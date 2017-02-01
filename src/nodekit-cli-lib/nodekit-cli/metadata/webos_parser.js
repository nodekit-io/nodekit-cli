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

/* jshint node:true, bitwise:true, undef:true, trailing:true, quotmark:true,
          indent:4, unused:vars, latedef:nofunc,
          sub:true
*/

var fs = require('fs'),
    path = require('path'),
    shell = require('shelljs'),
    util = require('../util'),
    Q = require('q'),
    Parser = require('./parser');

function webos_parser(project) {
    // Call the base class constructor
    Parser.call(this, 'webos', project);
    this.path = project;
}

require('util').inherits(webos_parser, Parser);

module.exports = webos_parser;

// Returns a promise.
webos_parser.prototype.update_from_config = function(config) {
    var app = this.app_dir();
    var manifestPath = path.join(app, 'appinfo.json');
    var manifest = {type: 'web', uiRevision:2};

    // Load existing manifest
    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath));
    }

    // overwrite properties existing in config.xml
    manifest.id = config.packageName() || 'io.nodekit.example';
    var contentNode = config.doc.find('content');
    var contentSrc = contentNode && contentNode.attrib['src'] || 'index.html';
    manifest.main = contentSrc;
    manifest.version = config.version() || '0.0.1';
    manifest.title = config.name() || 'NodeKitExample';
    manifest.appDescription = config.description() || '';
    manifest.vendor = config.author() || 'My Company';

    var authorNode = config.doc.find('author');
    var authorUrl = authorNode && authorNode.attrib['href'];
    if (authorUrl) {
        manifest.vendorurl = authorUrl;
    }

    var projectRoot = util.isNodeKit(this.path);
    var copyImg = function(src, type) {
        var index = src.indexOf('app');
        if(index===0 || index===1) {
            return src.substring(index+4);
        } else {
            var newSrc = type + '.png';
            shell.cp('-f', path.join(projectRoot, src), path.join(app, newSrc));
            return newSrc;
        }
    };

    var icons = config.getIcons('webos');
    // if there are icon elements in config.xml
    if (icons) {
        var setIcon = function(type, size) {
            var item = icons.getBySize(size, size);
            if(item && item.src) {
                manifest[type] = copyImg(item.src, type);
            } else {
                item = icons.getDefault();
                if(item && item.src) {
                    manifest[type] = copyImg(item.src, type);
                }
            }
        };
        setIcon('icon', 80, 80);
        setIcon('largeIcon', 130, 130);
    }

    var splash = config.getSplashScreens('webos');
    // if there are icon elements in config.xml
    if (splash) {
        var splashImg = splash.getBySize(1920, 1080);
        if(splashImg && splashImg.src) {
            manifest.splashBackground = copyImg(splashImg.src, 'splash');
        }
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t'));

    return Q();
};

webos_parser.prototype.app_dir = function() {
    return path.join(this.path, 'app');
};

// Used for creating platform_app in projects created by older versions.
webos_parser.prototype.nodekitjs_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-lib', 'nodekit.js');
    return path.resolve(jsPath);
};

webos_parser.prototype.nodekitjs_src_path = function(libDir) {
    var jsPath = path.join(libDir, 'nodekit-js-src');
    return path.resolve(jsPath);
};

// Replace the app dir with contents of platform_app and  project app.
webos_parser.prototype.update_app = function() {
    var projectRoot = util.isNodeKit(this.path);
    var project_app = util.projectApp(projectRoot);
    var platform_app = path.join(this.path, 'platform_app');

    // Clear the app dir
    shell.rm('-rf', this.app_dir());
    shell.mkdir(this.app_dir());
    // Copy over all  project app.assets
    if(fs.lstatSync(project_app).isSymbolicLink()) {
        var real_app = fs.realpathSync(project_app);
        if(fs.existsSync(path.join(real_app, 'build/enyo.js'))) {
            // symlinked Enyo bootplate; resolve to bootplate root for
            // ares-webos-sdk to handle the minification
            if(fs.existsSync(path.join(real_app, '../enyo'))) {
                project_app = path.join(real_app, '..');
            } else if (fs.existsSync(path.join(real_app, '../../enyo'))) {
                project_app = path.join(real_app, '../..');
            }
            //double check existence of deploy
            if(!fs.existsSync(path.join(project_app, 'deploy'))) {
                project_app = real_app; //fallback
            }
        }
    }
    shell.cp('-rf', path.join(project_app, '*'), this.app_dir());
    // Copy over stock platform app assets (nodekit.js)
    shell.cp('-rf', path.join(platform_app, '*'), this.app_dir());

    // prepare and update deploy.json for nodekit components
    var deploy = path.join(this.app_dir(), 'deploy.json');
    if(fs.existsSync(deploy)) {
        try {
            // make stub file entries to guarantee the dir/files are there
            shell.mkdir('-p', path.join(this.app_dir(), 'plugins'));
            var pluginFile = path.join(this.app_dir(), 'nodekit_plugins.js');
            if(!fs.existsSync(pluginFile)) {
                fs.writeFileSync(pluginFile, '');
            }
            // add to json if not already there, so they don't get minified out during build
            var obj = JSON.parse(fs.readFileSync(deploy, {encoding:'utf8'}));
            obj.assets = obj.assets || [];
            var assets = ['plugins', 'nodekit.js', 'nodekit_plugins.js'];
            for(var i=0; i<assets.length; i++) {
                var index = obj.assets.indexOf(assets[i]);
                if(index<0) {
                    index = obj.assets.indexOf('./' + assets[i]);
                }
                if(index<0) {
                    obj.assets.push('./' + assets[i]);
                }
                fs.writeFileSync(deploy, JSON.stringify(obj, null, '\t'));
            }
        } catch(e) {
            console.error('Unable to update deploy.json: ' + e);
        }
    }
};

webos_parser.prototype.update_overrides = function() {
    var projectRoot = util.isNodeKit(this.path);
    var mergesPath = path.join(util.appDir(projectRoot), 'merges', 'webosos');
    if(fs.existsSync(mergesPath)) {
        var overrides = path.join(mergesPath, '*');
        shell.cp('-rf', overrides, this.app_dir());
    }
};

webos_parser.prototype.config_xml = function(){
    return path.join(this.path, 'config.xml');
};

// Returns a promise.
webos_parser.prototype.update_project = function(cfg) {
    return this.update_from_config(cfg)
        .then(function(){
            this.update_overrides();
            util.deleteSvnFolders(this.app_dir());
        }.bind(this));
};


