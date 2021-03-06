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

/* jshint laxcomma:true, sub:true, expr:true */

var path = require('path'),
    fs   = require('fs'),
    semver = require('semver'),
    shell= require('shelljs'),
    action_stack = require('nodekit-scripts').common.ActionStack,
    dependencies = require('./util/dependencies'),
    NodeKitError = require('nodekit-scripts').common.NodeKitError,
    underscore = require('underscore'),
    Q = require('q'),
    events = require('nodekit-scripts').common.events,
    platform_modules = require('../platforms/platforms'),
    promiseutil = require('../util/promise-util'),
    HooksRunner = require('../hooks/HooksRunner'),
    nodekitUtil = require('../nodekit-scripts/util'),
    pluginMapper = require('cordova-registry-mapper').oldToNew,
    npmUninstall = require('nodekit-scripts')['nodekit-scripts-fetch'].uninstall,
    pluginSpec = require('../nodekit-scripts/plugin_spec_parser');

var superspawn = require('nodekit-scripts').common.superspawn;
var PlatformJson = require('nodekit-scripts').common.PlatformJson;
var PluginInfoProvider = require('nodekit-scripts').common.PluginInfoProvider;

// possible options: cli_variables, app_dir
// Returns a promise.
module.exports = uninstall;
function uninstall(platform, project_dir, id, plugins_dir, options) {
    project_dir = nodekitUtil.convertToRealPathSafe(project_dir);
    plugins_dir = nodekitUtil.convertToRealPathSafe(plugins_dir);

    options = options || {};
    options.is_top_level = true;
    options.pluginInfoProvider = options.pluginInfoProvider || new PluginInfoProvider();
    plugins_dir = plugins_dir || path.join(project_dir, 'nodekit-scripts', 'plugins');

    // Allow `id` to be a path to a file.
    var xml_path = path.join(id, 'plugin.xml');
    if ( fs.existsSync(xml_path) ) {
        id = options.pluginInfoProvider.get(id).id;
    }

    return module.exports.uninstallPlatform(platform, project_dir, id, plugins_dir, options)
    .then(function() {
        return module.exports.uninstallPlugin(id, plugins_dir, options);
    });
}

// Returns a promise.
module.exports.uninstallPlatform = function(platform, project_dir, id, plugins_dir, options) {
    project_dir = nodekitUtil.convertToRealPathSafe(project_dir);
    plugins_dir = nodekitUtil.convertToRealPathSafe(plugins_dir);

    options = options || {};
    options.is_top_level = true;
    options.pluginInfoProvider = options.pluginInfoProvider || new PluginInfoProvider();
    plugins_dir = plugins_dir || path.join(project_dir, 'nodekit-scripts', 'plugins');

    if (!platform_modules[platform]) {
        return Q.reject(new NodeKitError(platform + ' not supported.'));
    }

    var plugin_dir = path.join(plugins_dir, id);
    if (!fs.existsSync(plugin_dir)) {
        return Q.reject(new NodeKitError('Plugin "' + id + '" not found. Already uninstalled?'));
    }

    var current_stack = new action_stack();

    return Q().then(function() {
        if (options.platformVersion) {
            return Q(options.platformVersion);
        }
        return Q(superspawn.maybeSpawn(path.join(project_dir, 'nodekit-scripts', 'version'), [], { chmod: true }));
    }).then(function(platformVersion) {
        options.platformVersion = platformVersion;
        return runUninstallPlatform(current_stack, platform, project_dir, plugin_dir, plugins_dir, options);
    });
};

// Returns a promise.
module.exports.uninstallPlugin = function(id, plugins_dir, options) {
    plugins_dir = nodekitUtil.convertToRealPathSafe(plugins_dir);

    options = options || {};
    options.pluginInfoProvider = options.pluginInfoProvider || new PluginInfoProvider();
    var pluginInfoProvider = options.pluginInfoProvider;

    var plugin_dir = path.join(plugins_dir, id);

    // @tests - important this event is checked spec/uninstall.spec.js
    events.emit('log', 'Removing "'+ id +'"');

    // If already removed, skip.
    if ( !fs.existsSync(plugin_dir) ) {
        events.emit('verbose', 'Plugin "'+ id +'" already removed ('+ plugin_dir +')');
        return Q();
    }

    /*
     * Deletes plugin from plugins directory and 
     * node_modules directory if --fetch was supplied.
     *
     * @param {String} id   the id of the plugin being removed
     *
     * @return {Promise||Error} Returns a empty promise or a promise of doing the npm uninstall
     */
    var doDelete = function(id) {
        var plugin_dir = path.join(plugins_dir, id);
        if ( !fs.existsSync(plugin_dir) ) {
            events.emit('verbose', 'Plugin "'+ id +'" already removed ('+ plugin_dir +')');
            return Q();
        }
        
        shell.rm('-rf', plugin_dir);
        events.emit('verbose', 'Deleted "'+ id +'"');
        
        if(options.fetch) {
            //remove plugin from node_modules directory
            return npmUninstall(id, options.projectRoot, options); 
        }
        
        return Q();

    };

    // We've now lost the metadata for the plugins that have been uninstalled, so we can't use that info.
    // Instead, we list all dependencies of the target plugin, and check the remaining metadata to see if
    // anything depends on them, or if they're listed as top-level.
    // If neither, they can be deleted.
    var top_plugin_id = id;

    // Recursively remove plugins which were installed as dependents (that are not top-level)
    var toDelete = [];
    function findDependencies(pluginId) {
        var depPluginDir = path.join(plugin_dir, '..', pluginId);
        // Skip plugin check for dependencies if it does not exist (CB-7846).
        if (!fs.existsSync(depPluginDir) ) {
            events.emit('verbose', 'Plugin "'+ pluginId +'" does not exist ('+ depPluginDir +')');
            return;
        }
        var pluginInfo = pluginInfoProvider.get(depPluginDir);
        // TODO: Should remove dependencies in a separate step, since dependencies depend on platform.
        var deps = pluginInfo.getDependencies();
        var deps_path;
        deps.forEach(function (d) {
            var parsedSpec = pluginSpec.parse(d.id);
            deps_path = path.join(plugin_dir, '..', parsedSpec.id);
            if (!fs.existsSync(deps_path)) {
                var newId = parsedSpec.scope ? null : pluginMapper[parsedSpec.id];
                if (newId && toDelete.indexOf(newId) === -1) {
                   events.emit('verbose', 'Automatically converted ' + d.id + ' to ' + newId + 'for uninstallation.');
                   toDelete.push(newId);
                   findDependencies(newId);
                }
            } else if (toDelete.indexOf(d.id) === -1) {
                toDelete.push(d.id);
                findDependencies(d.id);
            }
        });
    }
    findDependencies(top_plugin_id);
    toDelete.push(top_plugin_id);

    // Okay, now we check if any of these are depended on, or top-level.
    // Find the installed platforms by whether they have a metadata file.
    var platforms = Object.keys(platform_modules).filter(function(platform) {
        return fs.existsSync(path.join(plugins_dir, platform + '.json'));
    });

    // Can have missing plugins on some platforms when not supported..
    var dependList = {};
    platforms.forEach(function(platform) {
        var platformJson = PlatformJson.load(plugins_dir, platform);
        var depsInfo = dependencies.generateDependencyInfo(platformJson, plugins_dir, pluginInfoProvider);
        var tlps = depsInfo.top_level_plugins;
        var deps;

        // Top-level deps must always be explicitely asked to remove by user
        tlps.forEach(function(plugin_id){
            if(top_plugin_id == plugin_id)
                return;

            var i = toDelete.indexOf(plugin_id);
            if(i >= 0)
                toDelete.splice(i, 1);
        });

        toDelete.forEach(function(plugin) {
            deps = dependencies.dependents(plugin, depsInfo, platformJson, pluginInfoProvider);

            var i = deps.indexOf(top_plugin_id);
            if(i >= 0)
                deps.splice(i, 1); // remove current/top-level plugin as blocking uninstall

            if(deps.length) {
                dependList[plugin] = deps.join(', ');
            }
        });
    });

    var i, plugin_id, msg, delArray = [];
    for(i in toDelete) {
        plugin_id = toDelete[i];

        if( dependList[plugin_id] ) {
            msg = '"' + plugin_id + '" is required by ('+ dependList[plugin_id] + ')';
            if(options.force) {
                events.emit('log', msg +' but forcing removal.');
            } else {
                // @tests - error and event message is checked spec/uninstall.spec.js
                msg += ' and cannot be removed (hint: use -f or --force)';

                if(plugin_id == top_plugin_id) {
                    return Q.reject( new NodeKitError(msg) );
                } else {
                    events.emit('warn', msg);
                    continue;
                }
            }
        }
        //create an array of promises
        delArray.push(doDelete(plugin_id));
    }
    //return promise.all
    return Q.all(delArray);
};

// possible options: cli_variables, app_dir, is_top_level
// Returns a promise
function runUninstallPlatform(actions, platform, project_dir, plugin_dir, plugins_dir, options) {
    var pluginInfoProvider = options.pluginInfoProvider;
    // If this plugin is not really installed, return (CB-7004).
    if (!fs.existsSync(plugin_dir)) {
        return Q(true);
    }

    var pluginInfo = pluginInfoProvider.get(plugin_dir);
    var plugin_id = pluginInfo.id;

    // Deps info can be passed recusively
    var platformJson = PlatformJson.load(plugins_dir, platform);
    var depsInfo = options.depsInfo || dependencies.generateDependencyInfo(platformJson, plugins_dir, pluginInfoProvider);

    // Check that this plugin has no dependents.
    var dependents = dependencies.dependents(plugin_id, depsInfo, platformJson, pluginInfoProvider);

    if(options.is_top_level && dependents && dependents.length > 0) {
        var msg = 'The plugin \'' + plugin_id + '\' is required by (' + dependents.join(', ') + ')';
        if(options.force) {
            events.emit('warn', msg + ' but forcing removal');
        } else {
            return Q.reject( new NodeKitError(msg + ', skipping uninstallation. (try --force if trying to update)') );
        }
    }

    // Check how many dangling dependencies this plugin has.
    var deps = depsInfo.graph.getChain(plugin_id);
    var danglers = dependencies.danglers(plugin_id, depsInfo, platformJson, pluginInfoProvider);

    var promise;
    if (deps && deps.length && danglers && danglers.length) {

        // @tests - important this event is checked spec/uninstall.spec.js
        events.emit('log', 'Uninstalling ' + danglers.length + ' dependent plugins.');
        promise = promiseutil.Q_chainmap(danglers, function(dangler) {
            var dependent_path = path.join(plugins_dir, dangler);

            //try to convert ID if old-id path doesn't exist.
            if (!fs.existsSync(dependent_path)) {
                var parsedSpec = pluginSpec.parse(dangler);
                var newId = parsedSpec.scope ? null : pluginMapper[parsedSpec.id];
                if(newId) {
                    dependent_path = path.join(plugins_dir, newId);
                    events.emit('verbose', 'Automatically converted ' + dangler + ' to ' + newId + 'for uninstallation.');
                }
            }

            var opts = underscore.extend({}, options, {
                is_top_level: depsInfo.top_level_plugins.indexOf(dangler) > -1,
                depsInfo: depsInfo
            });

            return runUninstallPlatform(actions, platform, project_dir, dependent_path, plugins_dir, opts);
        });
    } else {
        promise = Q();
    }

    var projectRoot = nodekitUtil.isNodeKit();

    if(projectRoot) {

        // using unified hooksRunner
        var hooksRunnerOptions = {
            nodekit: { platforms: [ platform ] },
            plugin: {
                id: pluginInfo.id,
                pluginInfo: pluginInfo,
                platform: platform,
                dir: plugin_dir
            }
        };

        // CB-10708 This is the case when we're trying to uninstall plugin using plugman from specific
        // platform inside of the existing CLI project. This option is usually set by nodekit-lib for CLI projects
        // but since we're running this code through plugman, we need to set it here implicitly
        options.usePlatformApp = true;

        var hooksRunner = new HooksRunner(projectRoot);

        return promise.then(function() {
            return hooksRunner.fire('before_plugin_uninstall', hooksRunnerOptions);
        }).then(function() {
            return handleUninstall(actions, platform, pluginInfo, project_dir, options.app_dir, plugins_dir, options.is_top_level, options);
        });
    } else {
        // TODO: Need review here - this condition added for plugman install.spec.js and uninstall.spec.js passing -
        // where should we get projectRoot - via going up from project_dir?
        return handleUninstall(actions, platform, pluginInfo, project_dir, options.app_dir, plugins_dir, options.is_top_level, options);
    }
}

// Returns a promise.
function handleUninstall(actions, platform, pluginInfo, project_dir, app_dir, plugins_dir, is_top_level, options) {
    events.emit('log', 'Uninstalling ' + pluginInfo.id + ' from ' + platform);

    // Set up platform to uninstall asset files/js modules
    // from <platform>/platform_app dir instead of <platform>/app.
    options.usePlatformApp = true;
    return platform_modules.getPlatformApi(platform, project_dir)
    .removePlugin(pluginInfo, options)
    .then(function(result) {
        // Remove plugin from installed list. This already done in platform,
        // but need to be duplicated here to remove plugin entry from project's
        // plugin list to manage dependencies properly.
        PlatformJson.load(plugins_dir, platform)
            .removePlugin(pluginInfo.id, is_top_level)
            .save();

        if (platform == 'android' &&
                semver.gte(options.platformVersion, '4.0.0-dev') &&
                // CB-10533 since 5.2.0-dev prepBuildFiles is now called internally by android platform and
                // no more exported from build module
                // TODO: This might be removed once we deprecate non-PlatformApi compatible platforms support
                semver.lte(options.platformVersion, '5.2.0-dev') &&
                pluginInfo.getFrameworks(platform).length > 0) {

            events.emit('verbose', 'Updating build files since android plugin contained <framework>');
            var buildModule;
            try {
                buildModule = require(path.join(project_dir, 'nodekit-scripts', 'lib', 'build'));
            } catch (e) {
                // Should occur only in unit tests.
            }
            if (buildModule && buildModule.prepBuildFiles) {
                buildModule.prepBuildFiles();
            }
        }

        // CB-11022 propagate `removePlugin` result to the caller
        return Q(result);
    });
}
