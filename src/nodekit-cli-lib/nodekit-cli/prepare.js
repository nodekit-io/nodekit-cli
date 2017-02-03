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

var nodekit_util      = require('./util'),
    ConfigParser      = require('nodekit-cli')['nodekit-cli-common'].ConfigParser,
    PlatformJson      = require('nodekit-cli')['nodekit-cli-common'].PlatformJson,
    PluginInfoProvider = require('nodekit-cli')['nodekit-cli-common'].PluginInfoProvider,
    PlatformMunger    = require('nodekit-cli')['nodekit-cli-common'].ConfigChanges.PlatformMunger,
    events            = require('nodekit-cli')['nodekit-cli-common'].events,
    platforms         = require('../platforms/platforms'),
    // PlatformApiPoly = require('../platforms/PlatformApiPoly'),
    HooksRunner       = require('../hooks/HooksRunner'),
    Q                 = require('q'),
    restore           = require('./restore-util'),
    path              = require('path'),
    config            = require('./config'),
    _ = require('underscore');

// Returns a promise.
exports = module.exports = prepare;
function prepare(options) {
    return Q().then(function() {
        var projectRoot = nodekit_util.cdProjectRoot();
        var config_json = config.read(projectRoot);
        options = options || { verbose: false, platforms: [], options: {} };
        options.save = options.save || false;
        options.fetch = options.fetch || false;
        var hooksRunner = new HooksRunner(projectRoot);
        return hooksRunner.fire('before_prepare', options)
        .then(function(){
            return restore.installPlatformsFromConfigXML(options.platforms, { searchpath : options.searchpath, fetch : options.fetch, restoring : true });
        })
        .then(function(){
            options = nodekit_util.preProcessOptions(options);
            var paths = options.platforms.map(function(p) {
                var platform_path = path.join(projectRoot, 'platforms', p);
                return platforms.getPlatformApi(p, platform_path).getPlatformInfo().locations.app;
            });
            options.paths = paths;
        }).then(function() {
            options = nodekit_util.preProcessOptions(options);
            options.searchpath = options.searchpath || config_json.plugin_search_path;
            // Iterate over each added platform
            return preparePlatforms(options.platforms, projectRoot, options);
        }).then(function() {
            options.paths = options.platforms.map(function(platform) {
                return platforms.getPlatformApi(platform).getPlatformInfo().locations.app;
            });
            return hooksRunner.fire('after_prepare', options);
        }).then(function () {
            return restore.installPluginsFromConfigXML(options);
        });
    });
}

/**
 * Calls `platformApi.prepare` for each platform in project
 *
 * @param   {string[]}  platformList  List of platforms, added to current project
 * @param   {string}    projectRoot   Project root directory
 *
 * @return  {Promise}
 */
function preparePlatforms (platformList, projectRoot, options) {
    return Q.all(platformList.map(function(platform) {
        // TODO: this need to be replaced by real projectInfo
        // instance for current project.
        var project = {
            root: projectRoot,
            projectConfig: new ConfigParser(nodekit_util.projectConfig(projectRoot)),
            locations: {
                plugins: path.join(projectRoot, 'plugins'),
                app: nodekit_util.projectApp(projectRoot)
            }
        };

        // CB-9987 We need to reinstall the plugins for the platform it they were added by nodekit@<5.4.0
        return restoreMissingPluginsForPlatform(platform, projectRoot, options)
        .then(function () {
            // platformApi prepare takes care of all functionality
            // which previously had been executed by nodekit.prepare:
            //   - reset config.xml and then merge changes from project's one,
            //   - update app directory from project's one and merge assets from platform_app,
            //   - reapply config changes, made by plugins,
            //   - update platform's project
            // Please note that plugins' changes, such as installed js files, assets and
            // config changes is not being reinstalled on each prepare.
            var platformApi = platforms.getPlatformApi(platform);
            return platformApi.prepare(project, _.clone(options))
            .then(function () {
                if (platform === 'windows' && true /* NODEKIT */) {
                    // Windows Api doesn't fire 'pre_package' hook, so we fire it here
                    return new HooksRunner(projectRoot).fire('pre_package', {
                        appPath: platformApi.getPlatformInfo().locations.app,
                        platforms: ['windows'],
                        nohooks: options.nohooks
                    });
                }
            })
            .then(function () {
                if (options.browserify) {
                    var browserify = require('../plugman/browserify');
                    return browserify(project, platformApi);
                }
            })
            .then(function () {
                // Handle edit-config in config.xml
                var platformRoot = path.join(projectRoot, 'platforms', platform);
                var platformJson = PlatformJson.load(platformRoot, platform);
                var munger = new PlatformMunger(platform, platformRoot, platformJson);
                munger.add_config_changes(project.projectConfig, /*should_increment=*/true).save_all();
            });
        });
    }));
}

module.exports.preparePlatforms = preparePlatforms;

/**
 * Ensures that plugins, installed with previous versions of CLI (<5.4.0) are
 *   readded to platform correctly. Also triggers regeneration of
 *   nodekit_plugins.js file.
 *
 * @param   {String}  platform     Platform name to check for installed plugins
 * @param   {String}  projectRoot  A current nodekit project location
 * @param   {Object}  [options]    Options that will be passed to
 *   PlatformApi.pluginAdd/Remove. This object will be extended with plugin
 *   variables, used to install the plugin initially (picked from "old"
 *   plugins/<platform>.json)
 *
 * @return  {Promise}               Promise that'll be fulfilled if all the
 *   plugins reinstalled properly.
 */
function restoreMissingPluginsForPlatform(platform, projectRoot, options) {
    events.emit('verbose', 'Checking for any plugins added to the project that have not been installed in ' + platform + ' platform');

    // Flow:
    // 1. Compare <platform>.json file in <project>/plugins ("old") and platforms/<platform> ("new")
    // 2. If there is any differences - merge "old" one into "new"
    // 3. Reinstall plugins that are missing and was merged on previous step

    var oldPlatformJson = PlatformJson.load(path.join(projectRoot, 'plugins'), platform);
    var platformJson = PlatformJson.load(path.join(projectRoot, 'platforms', platform), platform);

    var missingPlugins = Object.keys(oldPlatformJson.root.installed_plugins)
        .concat(Object.keys(oldPlatformJson.root.dependent_plugins))
        .reduce(function (result, candidate) {
            if (!platformJson.isPluginInstalled(candidate))
                result.push({name: candidate,
                    // Note: isPluginInstalled is actually returns not a boolean,
                    // but object which corresponds to this particular plugin
                    variables: oldPlatformJson.isPluginInstalled(candidate)});

            return result;
        }, []);

    if (missingPlugins.length === 0) {
        events.emit('verbose', 'No differences found between plugins added to project and installed in ' +
            platform + ' platform. Continuing...');
        return Q.resolve();
    }

    var api = platforms.getPlatformApi(platform);
    var provider = new PluginInfoProvider();
    return missingPlugins.reduce(function (promise, plugin) {
        return promise.then(function () {
            var pluginOptions = options || {};
            pluginOptions.variables = plugin.variables;
            pluginOptions.usePlatformApp = true;

            events.emit('verbose', 'Reinstalling missing plugin ' + plugin.name + ' in ' + platform + ' platform');
            var pluginInfo = provider.get(path.join(projectRoot, 'plugins', plugin.name));
            return api.removePlugin(pluginInfo, pluginOptions)
            .then(function () {
                return api.addPlugin(pluginInfo, pluginOptions);
            });
        });
    }, Q());
}
