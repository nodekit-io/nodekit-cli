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
    shell         = require('shelljs'),
    Q             = require('q'),
    Parser        = require('nodekit-cli')['nodekit-cli-common'].PlatformParser,
    ConfigParser = require('nodekit-cli')['nodekit-cli-common'].ConfigParser,
    NodeKitError = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    HooksRunner        = require('../../hooks/HooksRunner');

function windows_parser(project) {
    try {
        // Check that it's a universal windows store project
        var projFile = fs.readdirSync(project).filter(function(e) { return e.match(/\.projitems$/i); })[0];

        if (!projFile) {
            throw new NodeKitError('No project file in "' + project + '"');
        }

        // Call the base class constructor
        Parser.call(this, 'windows', project);

        this.projDir = project;
        this.projFilePath = path.join(this.projDir, projFile);
    } catch(e) {
        throw new NodeKitError('The provided path "' + project + '" is not a Windows project. ' + e);
    }
}

require('util').inherits(windows_parser, Parser);

module.exports = windows_parser;

windows_parser.prototype.update_from_config = function(config) {
    //check config parser
    if (config instanceof ConfigParser) {
    } else throw new Error('update_from_config requires a ConfigParser object');

    var platformPrepare;
    try {
        // The platform must contain the prepare script - require and exec it
        platformPrepare = require(path.join(this.projDir, 'nodekit-cli', 'lib', 'prepare'));
    } catch (e) {
        throw new NodeKitError('prepare script not found in the platform path "' + this.projDir + '"');
    }

    try {
        platformPrepare.applyPlatformConfig();
    } catch (e) {
        throw new NodeKitError('Error occured while trying to call legacy applyPlatformConfig method of the platform prepare script: "' + e + '"');
    }
};

// Returns the platform-specific app directory.
windows_parser.prototype.app_dir = function() {
    return path.join(this.projDir, 'app');
};

windows_parser.prototype.config_xml = function() {
    return path.join(this.projDir,'config.xml');
};

// copy files from merges directory to actual app dir
windows_parser.prototype.copy_merges = function(merges_sub_path) {
    var merges_path = path.join(util.appDir(util.isNodeKit(this.projDir)), 'merges', merges_sub_path);
    if (fs.existsSync(merges_path)) {
        var overrides = path.join(merges_path, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};

// Used for creating platform_app in projects created by older versions.
windows_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, 'template', 'app', 'nodekit.js');
    return path.resolve(jsPath);
};

windows_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.and updates the csproj file.
windows_parser.prototype.update_app = function() {
    var projectRoot = util.isNodeKit(this.projDir);
    var project_app = util.projectApp(projectRoot);
    var platform_app = path.join(this.projDir, 'platform_app');

    // Clear the app dir
    shell.rm('-rf', this.app_dir());
    shell.mkdir(this.app_dir());
    // Copy over all  project app.assets
    shell.cp('-rf', path.join(project_app, '*'), this.app_dir());

    // Copy all files from merges directory.
    this.copy_merges('windows');

    // Copy over stock platform app assets (nodekit.js)
    shell.cp('-rf', path.join(platform_app, '*'), this.app_dir());
};

// calls the nessesary functions to update the windows project
windows_parser.prototype.update_project = function(cfg, opts) {
    try {
        this.update_from_config(cfg);
    } catch(e) {
        return Q.reject(e);
    }

    var that = this;
    var projectRoot = util.isNodeKit(process.cwd());

    var hooksRunner = new HooksRunner(projectRoot);
    return hooksRunner.fire('pre_package', { appPath:this.app_dir(), platforms: ['windows'], nohooks: opts? opts.nohooks: [] })
    .then(function() {
        // overrides (merges) are handled in update_app()
        that.add_bom();
        util.deleteSvnFolders(that.app_dir());
    });
};

// Adjust version number as per CB-5337 Windows8 build fails due to invalid app version
windows_parser.prototype.fixConfigVersion = function (version) {
    if(version && version.match(/\.\d/g)) {
        var numVersionComponents = version.match(/\.\d/g).length + 1;
        while (numVersionComponents++ < 4) {
            version += '.0';
        }
    }
    return version;
};

// CB-5421 Add BOM to all html, js, css files to ensure app can pass Windows Store Certification
windows_parser.prototype.add_bom = function () {
    var app = this.app_dir();
    var files = shell.ls('-R', app);

    files.forEach(function (file) {
        if (!file.match(/\.(js|html|css|json)$/i)) {
            return;
        }

        var filePath = path.join(app, file);
        // skip if this is a folder
        if (!fs.lstatSync(filePath).isFile()) {
            return;
        }

        var content = fs.readFileSync(filePath);

        if (content[0] !== 0xEF && content[1] !== 0xBE && content[2] !== 0xBB) {
            fs.writeFileSync(filePath, '\ufeff' + content);
        }
    });
};
