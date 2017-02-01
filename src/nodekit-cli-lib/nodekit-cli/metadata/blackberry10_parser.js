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

var fs            = require('fs'),
    path          = require('path'),
    shell         = require('shelljs'),
    util          = require('../util'),
    Q             = require('q'),
    Parser        = require('./parser'),
    ConfigParser = require('nodekit-cli')['nodekit-cli-common'].ConfigParser,
    NodeKitError = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    events = require('nodekit-cli')['nodekit-cli-common'].events;

function blackberry_parser(project) {
    if (!fs.existsSync(path.join(project, 'app'))) {
        throw new NodeKitError('The provided path "' + project + '" is not a NodeKit BlackBerry10 project.');
    }

    // Call the base class constructor
    Parser.call(this, 'blackberry10', project);

    this.path = project;
    this.config_path = path.join(this.path, 'app', 'config.xml');
    this.xml = new ConfigParser(this.config_path);
}

require('util').inherits(blackberry_parser, Parser);

module.exports = blackberry_parser;

blackberry_parser.prototype.update_from_config = function(config) {
    var projectRoot = util.isNodeKit(this.path),
        resDir = path.join(this.path, 'platform_app', 'res'),
        platform_app = path.join(this.path, 'platform_app'),
        icons,
        splashscreens;

    var copyResources = function(resList) {
        for (var i = 0; i < resList.length; i++) {
                var src = path.join(projectRoot, resList[i].src),
                dest = path.join(platform_app, resList[i].src),
                destFolder = path.dirname(dest);

            if (!fs.existsSync(destFolder)) {
                shell.mkdir('-p', destFolder); // make sure target dir exists
            }
            events.emit('verbose', 'Copying resource from ' + src + ' to ' + dest);
            shell.cp('-f', src, dest);
        }
    };

    if (!config instanceof ConfigParser) {
        throw new Error('update_from_config requires a ConfigParser object');
    }

    shell.rm('-rf', resDir);
    shell.mkdir(resDir);

    icons = config.getIcons('blackberry10');
    if (icons) {
        copyResources(icons);
    }
    // blackberry10 splash images use custom element rim:splash
    splashscreens = config.getStaticResources('blackberry10', 'rim:splash');
    if (splashscreens) {
        copyResources(splashscreens);
    }
};

// Returns a promise.
blackberry_parser.prototype.update_project = function(cfg) {
    var self = this;

    try {
        self.update_from_config(cfg);
    } catch(e) {
        return Q.reject(e);
    }
    self.update_overrides();
    util.deleteSvnFolders(this.app_dir());
    return Q();
};

// Returns the platform-specific app directory.
blackberry_parser.prototype.app_dir = function() {
    return path.join(this.path, 'app');
};

blackberry_parser.prototype.config_xml = function(){
    return this.config_path;
};

// Used for creating platform_app in projects created by older versions.
blackberry_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, 'javascript', 'nodekit.blackberry10.js');
    return path.resolve(jsPath);
};

blackberry_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.
blackberry_parser.prototype.update_app = function() {
    var projectRoot = util.isNodeKit(this.path);
    var project_app = util.projectApp(projectRoot);
    var platform_app = path.join(this.path, 'platform_app');
    var platform_cfg_backup = new ConfigParser(this.config_path);

    // Clear the app dir
    shell.rm('-rf', this.app_dir());
    shell.mkdir(this.app_dir());
    // Copy over all  project app.assets
    shell.cp('-rf', path.join(project_app, '*'), this.app_dir());
    // Copy over stock platform app assets (nodekit.js)
    shell.cp('-rf', path.join(platform_app, '*'), this.app_dir());
    //Re-Write config.xml
    platform_cfg_backup.write();
};

// update the overrides folder into the app folder
blackberry_parser.prototype.update_overrides = function() {
    var projectRoot = util.isNodeKit(this.path);
    var merges_path = path.join(util.appDir(projectRoot), 'merges', 'blackberry10');
    if (fs.existsSync(merges_path)) {
        var overrides = path.join(merges_path, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};
