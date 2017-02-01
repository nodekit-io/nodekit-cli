/**
    Licensed to OffGrid Networks (OGN) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  OGN licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

/* jshint sub:true */

var fs            = require('fs'),
    path          = require('path'),
    util          = require('../util'),
    events        = require('nodekit-cli')['nodekit-cli-common'].events,
    shell         = require('shelljs'),
    Q             = require('q'),
    Parser        = require('./parser'),
    ConfigParser = require('nodekit-cli')['nodekit-cli-common'].ConfigParser,
    NodeKitError = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    xml           = require('nodekit-cli')['nodekit-cli-common'].xmlHelpers,
    HooksRunner        = require('../../hooks/HooksRunner');

function wp8_parser(project) {

    try {
        // TODO : Check that it's not a wp8 project?
        var csproj_file   = fs.readdirSync(project).filter(function(e) { return e.match(/\.csproj$/i); })[0];
        if (!csproj_file) throw new NodeKitError('No .csproj file in "'+project+'"');

        // Call the base class constructor
        Parser.call(this, 'wp8', project);

        this.wp8_proj_dir = project;
        this.csproj_path  = path.join(this.wp8_proj_dir, csproj_file);
        this.sln_path     = path.join(this.wp8_proj_dir, csproj_file.replace(/\.csproj/, '.sln'));
    } catch(e) {
        throw new NodeKitError('The provided path "' + project + '" is not a Windows Phone 8 project. ' + e);
    }
    this.manifest_path  = path.join(this.wp8_proj_dir, 'Properties', 'WMAppManifest.xml');
}

require('util').inherits(wp8_parser, Parser);

module.exports = wp8_parser;

wp8_parser.prototype.update_from_config = function(config) {
    //check config parser
    if (config instanceof ConfigParser) {
    } else throw new Error('update_from_config requires a ConfigParser object');

    //Get manifest file
    var manifest = xml.parseElementtreeSync(this.manifest_path);

    var mainPageXAML = xml.parseElementtreeSync(path.join(this.wp8_proj_dir, 'MainPage.xaml'));

    var orientation = this.helper.getOrientation(config);
    if (orientation && !this.helper.isDefaultOrientation(orientation)) {

        mainPageXAML.getroot().attrib['Orientation'] = orientation;
        mainPageXAML.getroot().attrib['SupportedOrientations'] = orientation;

        if (!this.helper.isGlobalOrientation(orientation)) {
            delete mainPageXAML.getroot().attrib['SupportedOrientations'];
        }

    } else {
        delete mainPageXAML.getroot().attrib['SupportedOrientations'];
        delete mainPageXAML.getroot().attrib['Orientation'];
    }

    //Update app version
    var version = config.version();
    manifest.find('.//App').attrib.Version = version;

    // Update app name by editing app title in Properties\WMAppManifest.xml
    var name = config.name();
    var prev_name = manifest.find('.//App[@Title]')['attrib']['Title'];
    if(prev_name != name) {
        //console.log('Updating app name from ' + prev_name + " to " + name);
        manifest.find('.//App').attrib.Title = name;
        manifest.find('.//PrimaryToken').attrib.TokenID = name;
        //update name of sln and csproj.
        name = name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_'); //make it a ligitamate name
        prev_name = prev_name.replace(/(\.\s|\s\.|\s+|\.+)/g, '_');
        // TODO: might return .sln.user? (generated file)
        var sln_name = fs.readdirSync(this.wp8_proj_dir).filter(function(e) { return e.match(/\.sln$/i); })[0];
        var sln_path = path.join(this.wp8_proj_dir, sln_name);
        var sln_file = fs.readFileSync(sln_path, 'utf-8');
        var name_regex = new RegExp(prev_name, 'g');
        fs.writeFileSync(sln_path, sln_file.replace(name_regex, name), 'utf-8');
        shell.mv('-f', this.csproj_path, path.join(this.wp8_proj_dir, name + '.csproj'));
        this.csproj_path = path.join(this.wp8_proj_dir, name + '.csproj');
        shell.mv('-f', sln_path, path.join(this.wp8_proj_dir, name + '.sln'));
        this.sln_path    = path.join(this.wp8_proj_dir, name + '.sln');
    }

    // Update author, publisher and description
    // limit both to 256 char including spaces
    var author = config.author() || '';
    var description = config.description() || '';

    if(author.length > 256) {
        events.emit('warn','Author length from config.xml is too long. Truncating to 256 char');
        author = author.substr(0,256);
    }

    if(description.length > 256) {
        events.emit('warn','Description length from config.xml is too long. Truncating to 256 char');
        description = author.substr(0,256);
    }

    manifest.find('.//App').attrib.Author = author;
    manifest.find('.//App').attrib.Publisher = author;
    manifest.find('.//App').attrib.Description = description;

    // Update package name by changing:
    /*  - NodeKitAppProj.csproj
     *  - MainPage.xaml
     *  - MainPage.xaml.cs
     *  - App.xaml
     *  - App.xaml.cs
     */
    var pkg = config.packageName();
    var csproj = xml.parseElementtreeSync(this.csproj_path);
    prev_name = csproj.find('.//RootNamespace').text;
    if(prev_name != pkg) {
        //console.log("Updating package name from " + prev_name + " to " + pkg);
        //NodeKitAppProj.csproj
        csproj.find('.//RootNamespace').text = pkg;
        csproj.find('.//AssemblyName').text = pkg;
        csproj.find('.//XapFilename').text = pkg + '.xap';
        csproj.find('.//SilverlightAppEntry').text = pkg + '.App';
        fs.writeFileSync(this.csproj_path, csproj.write({indent: 4}), 'utf-8');
        //MainPage.xaml
        mainPageXAML.getroot().attrib['x:Class'] = pkg + '.MainPage';
        //MainPage.xaml.cs
        var mainPageCS = fs.readFileSync(path.join(this.wp8_proj_dir, 'MainPage.xaml.cs'), 'utf-8');
        var namespaceRegEx = new RegExp('namespace ' + prev_name);
        fs.writeFileSync(path.join(this.wp8_proj_dir, 'MainPage.xaml.cs'), mainPageCS.replace(namespaceRegEx, 'namespace ' + pkg), 'utf-8');
        //App.xaml
        var appXAML = xml.parseElementtreeSync(path.join(this.wp8_proj_dir, 'App.xaml'));
        appXAML.getroot().attrib['x:Class'] = pkg + '.App';
        fs.writeFileSync(path.join(this.wp8_proj_dir, 'App.xaml'), appXAML.write({indent: 4}), 'utf-8');
        //App.xaml.cs
        var appCS = fs.readFileSync(path.join(this.wp8_proj_dir, 'App.xaml.cs'), 'utf-8');
        fs.writeFileSync(path.join(this.wp8_proj_dir, 'App.xaml.cs'), appCS.replace(namespaceRegEx, 'namespace ' + pkg), 'utf-8');
    }

    // Write out MainPage.xaml
    fs.writeFileSync(path.join(this.wp8_proj_dir, 'MainPage.xaml'), mainPageXAML.write({indent: 4}), 'utf-8');

    //Write out manifest
    fs.writeFileSync(this.manifest_path, manifest.write({indent: 4}), 'utf-8');

    // Update icons
    var icons = config.getIcons('wp8');
    var platformRoot = this.wp8_proj_dir;
    var appRoot = util.isNodeKit(platformRoot);

    // icons, that should be added to platform
    // @param dest {string} Path to copy icon to, relative to platform root
    var platformIcons = [
        {dest: 'ApplicationIcon.png', width: 99, height: 99},
        {dest: 'Background.png', width: 159, height: 159},
    ];

    platformIcons.forEach(function (item) {
        var icon = icons.getBySize(item.width, item.height) || icons.getDefault();
        if (icon){
            var src = path.join(appRoot, icon.src),
                dest = path.join(platformRoot, item.dest);
            events.emit('verbose', 'Copying icon from ' + src + ' to ' + dest);
            shell.cp('-f', src, dest);
        }
    });

    // Update splashscreen
    // Image size for Windows phone devices should be 768 × 1280 px
    // See http://msdn.microsoft.com/en-us/library/windowsphone/develop/ff769511.aspx for reference
    var splash = config.getSplashScreens('wp8').getBySize(768, 1280);
    if (splash){
        var src = path.join(appRoot, splash.src),
            dest = path.join(platformRoot, 'SplashScreenImage.jpg');
        events.emit('verbose', 'Copying icon from ' + src + ' to ' + dest);
        shell.cp('-f', src, dest);
    }
};

// Returns the platform-specific app directory.
wp8_parser.prototype.app_dir = function() {
    return path.join(this.wp8_proj_dir, 'app');
};

wp8_parser.prototype.config_xml = function() {
    return path.join(this.wp8_proj_dir, 'config.xml');
};

// copy files from merges directory to actual app dir
wp8_parser.prototype.copy_merges = function(merges_sub_path) {
    var merges_path = path.join(util.appDir(util.isNodeKit(this.wp8_proj_dir)), 'merges', merges_sub_path);
    if (fs.existsSync(merges_path)) {
        var overrides = path.join(merges_path, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};

// Used for creating platform_app in projects created by older versions.
wp8_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, '..', 'common', 'app', 'nodekit.js');
    return path.resolve(jsPath);
};

wp8_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.and updates the csproj file.
wp8_parser.prototype.update_app = function() {
    var projectRoot = util.isNodeKit(this.wp8_proj_dir);
    var project_app = util.projectApp(projectRoot);
    var platform_app = path.join(this.wp8_proj_dir, 'platform_app');

    // Clear the app dir
    shell.rm('-rf', this.app_dir());
    shell.mkdir(this.app_dir());
    // Copy over all  project app.assets
    shell.cp('-rf', path.join(project_app, '*'), this.app_dir());

    // Copy all files from merges directories - wp generic first, then wp8 specific.
    this.copy_merges('wp');
    this.copy_merges('wp8');

    // Copy over stock platform app assets (nodekit.js)
    shell.cp('-rf', path.join(platform_app, '*'), this.app_dir());
};

// calls the nessesary functions to update the wp8 project
// Returns a promise.
wp8_parser.prototype.update_project = function(cfg, opts) {
    try {
        this.update_from_config(cfg);
    } catch(e) {
        return Q.reject(e);
    }

    // trigger an event in case anyone needs to modify the contents of the app folder before we package it.
    var that = this;
    var projectRoot = util.isNodeKit(process.cwd());

    var hooksRunner = new HooksRunner(projectRoot);
    return hooksRunner.fire('pre_package', { appPath:this.app_dir(), platforms: ['wp8'], nohooks: opts? opts.nohooks: []})
    .then(function() {
        util.deleteSvnFolders(that.app_dir());
    });
};
