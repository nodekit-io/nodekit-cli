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
    events = require('nodekit-cli')['nodekit-cli-common'].events,
    util = require('../util'),
    Q = require('q'),
    Parser = require('./parser'),
    ConfigParser = require('nodekit-cli')['nodekit-cli-common'].ConfigParser;

function firefoxos_parser(project) {

    // Call the base class constructor
    Parser.call(this, 'firefoxos', project);

    this.path = project;
    this.config_path = path.join(project, 'config.xml');
    this.manifest_path = path.join(this.app_dir(), 'manifest.webapp');
}

require('util').inherits(firefoxos_parser, Parser);

module.exports = firefoxos_parser;

// Returns a promise.
firefoxos_parser.prototype.update_from_config = function(config) {

    if (!(config instanceof ConfigParser)) {
        return Q.reject(new Error('update_from_config requires a ConfigParser object'));
    }

    var manifest = {};

    // Load existing manifest
    if (fs.existsSync(this.manifest_path)) {
        manifest = JSON.parse(fs.readFileSync(this.manifest_path));
    }

    // overwrite properties existing in config.xml
    var contentNode = config.doc.find('content');
    var contentSrc = contentNode && contentNode.attrib['src'] || 'index.html';
    manifest.launch_path = '/' + contentSrc;

    manifest.installs_allowed_from = manifest.installs_allowed_from || ['*'];
    manifest.version = config.version();
    manifest.name = config.name();
    manifest.description = config.description();
    manifest.developer = {
        name: config.author()
    };

    var authorNode = config.doc.find('author');
    var authorUrl = authorNode && authorNode.attrib['href'];

    if (authorUrl) {
        manifest.developer.url = authorUrl;
    }

    var fullScreen = config.getPreference('fullscreen');

    if (fullScreen) {
        manifest.fullscreen = fullScreen;
    }

    var activitiesNodes = config.doc.findall('activities');
    activitiesNodes.forEach(function(activitiesNode) {
        var activityNodes = activitiesNode.findall('activity');
        if (activityNodes.length) {
            var activities = {};
            activityNodes.forEach(function (node) {
                var name = node.attrib.name;
                var href = node.attrib.href;
                if (name && href) {
                    events.emit('verbose', 'activity name='+name+' href='+href);
                    activities[name] = {};
                    activities[name].href = href;
                    var returnValue = node.attrib.returnValue;
                    if (returnValue) {
                        activities[name].returnValue = returnValue;
                    }
                    var disposition = node.attrib.disposition;
                    if (disposition) {
                        activities[name].disposition = disposition;
                    }
                    activities[name].filters = {};
                    var filterNodes = node.findall('filter');
                    filterNodes.forEach(function(filter) {
                        var url = filter.attrib.url;
                        if (url) {
                            activities[name].filters.url = url;
                        }
                        var type = filter.attrib.type;
                        if (type) {
                            activities[name].filters.type = type;
                        }
                    });
                } else {
                    events.emit('warn', 'activity without name='+name+'or href='+href);
                }
            });
            manifest.activities = activities;
        }
    });

    // Set orientation preference
    var orientation = this.helper.getOrientation(config);

    if (orientation && !this.helper.isDefaultOrientation(orientation)) {
        manifest.orientation = [ orientation ];
    } else {
        delete manifest.orientation;
    }

    var permissionNodes = config.doc.findall('permission');
    var privileged = false;

    if (permissionNodes.length) {
        manifest.permissions = {};

        permissionNodes.forEach(function(node) {
            var permissionName = node.attrib['name'];

            manifest.permissions[permissionName] = {
                description: node.attrib['description']
            };

            if (node.attrib['access']) {
                manifest.permissions[permissionName].access = node.attrib['access'];
            }

            if (node.attrib['privileged'] === 'true') {
                privileged = true;
            }
        });
    }

    if (privileged) {
        manifest.type = 'privileged';
    } else {
        delete manifest.type;
    }

    var icons = config.getIcons('firefoxos');
    // if there are icon elements in config.xml
    if (icons) {
        manifest.icons = {};
        for (var i = 0; i < icons.length; i++) {
            var icon = icons[i];
            var size = icon.width;
            var sizeInt = parseInt(size);

            events.emit('verbose', 'icon[' + i + ']:' + JSON.stringify(icon));

            if (size && !isNaN(sizeInt)) {
                if (icon.src) {
                    var destfilepath = path.join(this.app_dir(), 'icon', 'icon-' + size + '.png');

                    manifest.icons[sizeInt] = '/icon/icon-' + size + '.png';

                    if (!fs.existsSync(icon.src)) {
                        events.emit('verbose', 'ignoring icon[' + i + '] icon. File ' + icon.src + ' not found.');
                    } else {
                        events.emit('verbose', 'Copying icon from ' + icon.src + ' to ' + destfilepath);
                        shell.cp('-f', icon.src, destfilepath);
                    }
                } else {
                    events.emit('warn', 'ignoring icon[' + i + '] no src attribute:' + JSON.stringify(icon));
                }
            }
        }
    }

    fs.writeFileSync(this.manifest_path, JSON.stringify(manifest, null, 4));

    return Q();
};

firefoxos_parser.prototype.app_dir = function() {
    return path.join(this.path, 'app');
};

// Used for creating platform_app in projects created by older versions.
firefoxos_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-lib', 'nodekit.js');
    return path.resolve(jsPath);
};

firefoxos_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.
firefoxos_parser.prototype.update_app = function() {
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

firefoxos_parser.prototype.update_overrides = function() {
    var projectRoot = util.isNodeKit(this.path);
    var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'firefoxos');
    if(fs.existsSync(mergesPath)) {
        var overrides = path.join(mergesPath, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};

firefoxos_parser.prototype.config_xml = function(){
    return this.config_path;
};

// Returns a promise.
firefoxos_parser.prototype.update_project = function(cfg) {
    return this.update_from_config(cfg)
        .then(function(){
            this.update_overrides();
            util.deleteSvnFolders(this.app_dir());
        }.bind(this));
};
