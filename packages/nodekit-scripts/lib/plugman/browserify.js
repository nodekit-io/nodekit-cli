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

/* jshint expr:true */

var path               = require('path'),
    aliasify           = require('aliasify'),
    common             = require('./platforms/common'),
    fs                 = require('fs'),
    childProcess       = require('child_process'),
    events             = require('nodekit-scripts').common.events,
    plugman            = require('./plugman'),
    bundle             = require('cordova-js/tasks/lib/bundle-browserify'),
    writeLicenseHeader = require('cordova-js/tasks/lib/write-license-header'),
    Q                  = require('q'),
    computeCommitId    = require('cordova-js/tasks/lib/compute-commit-id'),
    Readable           = require('stream').Readable;

var PlatformJson = require('nodekit-scripts').common.PlatformJson;
var PluginInfoProvider = require('nodekit-scripts').common.PluginInfoProvider;

function generateFinalBundle(platform, libraryRelease, outReleaseFile, commitId, platformVersion) {
    var deferred = Q.defer();
    var outReleaseFileStream = fs.createWriteStream(outReleaseFile);
    var time = new Date().valueOf();

    writeLicenseHeader(outReleaseFileStream, platform, commitId, platformVersion);

    var releaseBundle = libraryRelease.bundle();

    releaseBundle.pipe(outReleaseFileStream);

    outReleaseFileStream.on('finish', function() {
        var newtime = new Date().valueOf() - time;
        plugman.emit('verbose', 'generated nodekit.' + platform + '.js @ ' + commitId + ' in ' + newtime + 'ms');
        deferred.resolve();
        // TODO clean up all the *.browserify files
    });

    outReleaseFileStream.on('error', function(err) {
        events.emit('warn', 'Error while generating nodekit.js');
        deferred.reject(err);
    });
    return deferred.promise;
}

function computeCommitIdSync() {
    var deferred = Q.defer();
    computeCommitId(function(cId){
        deferred.resolve(cId);
    });
    return deferred.promise;
}

function getPlatformVersion(cId, project_dir) {
    var deferred = Q.defer();
    //run version script for each platform to get platformVersion
    var versionPath = path.join(project_dir, '/nodekit-scripts/version');
    childProcess.exec('"' + versionPath + '"', function(err, stdout, stderr) {
        if (err) {
            err.message = 'Failed to get platform version (will use \'N/A\' instead).\n' + err.message;
            events.emit('warn', err);
            deferred.resolve('N/A');
        } else {
            deferred.resolve(stdout.trim());
        }
    });
    return deferred.promise;
}

module.exports = function doBrowserify (project, platformApi, pluginInfoProvider) {
    // Process:
    // - Do config munging by calling into config-changes module
    // - List all plugins in plugins_dir
    // - Load and parse their plugin.xml files.
    // - Skip those without support for this platform. (No <platform> tags means JS-only!)
    // - Build a list of all their js-modules, including platform-specific js-modules.
    // - For each js-module (general first, then platform) build up an object storing the path and any clobbers, merges and runs for it.
    // Write this object into app/nodekit_plugins.json.
    // This file is not really used. Maybe nodekit app harness
    var platform = platformApi.platform;
    events.emit('verbose', 'Preparing ' + platform + ' browserify project');
    pluginInfoProvider = pluginInfoProvider || new PluginInfoProvider(); // Allow null for backwards-compat.
    var platformJson = PlatformJson.load(project.locations.plugins, platform);
    var appDir = platformApi.getPlatformInfo().locations.app;

    var commitId;
    return computeCommitIdSync()
    .then(function(cId){
        commitId = cId;
        return getPlatformVersion(commitId, platformApi.root);
    }).then(function(platformVersion){
        var libraryRelease = bundle(platform, false, commitId, platformVersion, platformApi.getPlatformInfo().locations.platformApp);

        var pluginMetadata = {};
        var modulesMetadata = [];

        var plugins = Object.keys(platformJson.root.installed_plugins).concat(Object.keys(platformJson.root.dependent_plugins));
        events.emit('verbose', 'Iterating over plugins in project:', plugins);
        plugins.forEach(function (plugin) {
            var pluginDir = path.join(project.locations.plugins, plugin);
            var pluginInfo = pluginInfoProvider.get(pluginDir);
            // pluginMetadata is a mapping from plugin IDs to versions.
            pluginMetadata[pluginInfo.id] = pluginInfo.version;

            // Copy app assets described in <asset> tags.
            pluginInfo.getAssets(platform)
            .forEach(function(asset) {
                common.asset.install(asset, pluginDir, appDir);
            });

            pluginInfo.getJsModules(platform)
            .forEach(function(jsModule) {
                var moduleName = jsModule.name ? jsModule.name : path.basename(jsModule.src, '.js');
                var moduleId = pluginInfo.id + '.' + moduleName;
                var moduleMetadata = {
                    file: jsModule.src,
                    id: moduleId,
                    name: moduleName,
                    pluginId: pluginInfo.id
                };

                if (jsModule.clobbers.length > 0) {
                    moduleMetadata.clobbers = jsModule.clobbers.map(function(o) { return o.target; });
                }
                if (jsModule.merges.length > 0) {
                    moduleMetadata.merges = jsModule.merges.map(function(o) { return o.target; });
                }
                if (jsModule.runs) {
                    moduleMetadata.runs = true;
                }

                modulesMetadata.push(moduleMetadata);
                libraryRelease.require(path.join(pluginDir, jsModule.src), { expose: moduleId });
            });
        });

        events.emit('verbose', 'Writing out nodekit_plugins.js...');

        // Create a stream and write plugin metadata into it
        // instead of generating intermediate file on FS
        var nodekit_plugins = new Readable();
        nodekit_plugins.push(
            'module.exports.metadata = ' + JSON.stringify(pluginMetadata, null, 4) + ';\n' +
            'module.exports = ' + JSON.stringify(modulesMetadata, null, 4) + ';\n', 'utf8');
        nodekit_plugins.push(null);

        var bootstrap = new Readable();
        bootstrap.push('require(\'nodekit/init\');\n', 'utf8');
        bootstrap.push(null);

        var moduleAliases = modulesMetadata
        .reduce(function (accum, meta) {
            accum['./' + meta.name] = meta.id;
            return accum;
        }, {});

        libraryRelease
            .add(nodekit_plugins, {file: path.join(appDir, 'nodekit_plugins.js'), expose: 'nodekit/plugin_list'})
            .add(bootstrap)
            .transform(aliasify, {aliases: moduleAliases});

        var outReleaseFile = path.join(appDir, 'nodekit.js');
        return generateFinalBundle(platform, libraryRelease, outReleaseFile, commitId, platformVersion);
    });
};
