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

var fs = require('fs'),
    path = require('path'),
    shell = require('shelljs'),
    util = require('../util'),
    NodeKitError = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    Q = require('q'),
    Parser = require('./parser');

function dirExists(dir) {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

function browser_parser(project) {
    if (!dirExists(project) || !dirExists(path.join(project, 'nodekit-cli'))) {
        throw new NodeKitError('The provided path "' + project + '" is not a valid browser project.');
    }

    // Call the base class constructor
    Parser.call(this, 'browser', project);

    this.path = project;
}

require('util').inherits(browser_parser, Parser);

module.exports = browser_parser;

// Returns a promise.
browser_parser.prototype.update_from_config = function() {
    return Q();
};

browser_parser.prototype.app_dir = function() {
    return path.join(this.path, 'app');
};

// Used for creating platform_app in projects created by older versions.
browser_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-lib', 'nodekit.js');
    return path.resolve(jsPath);
};

browser_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.
browser_parser.prototype.update_app = function() {
    var projectRoot = util.isNodeKit(this.path);
    var project_app = util.projectApp(projectRoot);
    var platform_app = path.join(this.path, 'platform_app');

    // Clear the app dir
    shell.rm('-rf', this.app_dir());
    shell.mkdir(this.app_dir());
    // Copy over all  project app.assets
    shell.cp('-rf', path.join(project_app, '*'), this.app_dir());
    // Copy over stock platform app assets (nodekit.js)
    shell.cp('-rf', path.join(platform_app, '*'), this.app_dir());
};

browser_parser.prototype.update_overrides = function() {
    var projectRoot = util.isNodeKit(this.path);
    var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'browser');
    if(fs.existsSync(mergesPath)) {
        var overrides = path.join(mergesPath, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};

browser_parser.prototype.config_xml = function(){
    return path.join(this.path, 'config.xml');
};

// Returns a promise.
browser_parser.prototype.update_project = function(cfg) {
    return this.update_from_config()
        .then(function(){
            this.update_overrides();
            util.deleteSvnFolders(this.app_dir());

            // Copy munged config.xml to platform app dir
            shell.cp('-rf', path.join(this.app_dir(), '..', 'config.xml'), this.app_dir());
        }.bind(this));
};
