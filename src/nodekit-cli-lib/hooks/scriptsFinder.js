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

var path = require('path'),
    fs = require('fs'),
    nodekitUtil = require('../nodekit-cli/util'),
    events = require('nodekit-cli')['nodekit-cli-common'].events,
    PluginInfoProvider = require('nodekit-cli')['nodekit-cli-common'].PluginInfoProvider,
    ConfigParser = require('nodekit-cli')['nodekit-cli-common'].ConfigParser;

/**
 * Implements logic to retrieve hook script files defined in special folders and configuration
 * files: nodekit.json, hooks/hook_type, plugins/../plugin.xml, etc
 */
module.exports  = {
    /**
     * Returns all script files for the hook type specified.
     */
    getHookScripts: function(hook, opts) {
        // args check
        if (!hook) {
            throw new Error('hook type is not specified');
        }
        return getApplicationHookScripts(hook, opts)
            .concat(getPluginsHookScripts(hook, opts));
    }
};

/**
 * Returns script files defined on application level.
 * They are stored in .nodekit/hooks folders and in nodekit.json.
 */
function getApplicationHookScripts(hook, opts) {
    // args check
    if (!hook) {
        throw new Error('hook type is not specified');
    }
    return getApplicationHookScriptsFromDir(path.join(opts.projectRoot, '.nodekit', 'hooks', hook))
        .concat(getApplicationHookScriptsFromDir(path.join(opts.projectRoot, 'hooks', hook)))
        .concat(getScriptsFromNodeKitJson(hook, opts));
}

/**
 * Returns script files defined by plugin developers as part of plugin.xml.
 */
function getPluginsHookScripts(hook, opts) {
    // args check
    if (!hook) {
        throw new Error('hook type is not specified');
    }

    // In case before_plugin_install, after_plugin_install, before_plugin_uninstall hooks we receive opts.plugin and
    // retrieve scripts exclusive for this plugin.
    if(opts.plugin) {
        events.emit('verbose', 'Finding scripts for "' + hook + '" hook from plugin ' + opts.plugin.id + ' on ' + opts.plugin.platform + ' platform only.');
        // if plugin hook is not run for specific platform then use all available platforms
        return getPluginScriptFiles(opts.plugin, hook, opts.plugin.platform  ? [opts.plugin.platform] : opts.nodekit.platforms);
    }

    return getAllPluginsHookScriptFiles(hook, opts);
}

/**
 * Gets application level hooks from the directrory specified.
 */
function getApplicationHookScriptsFromDir(dir) {
    if (!(fs.existsSync(dir))) {
        return [];
    }

    var compareNumbers = function(a, b) {
        // TODO SG looks very complex, do we really need this?
        return isNaN (parseInt(a, 10)) ? a.toLowerCase().localeCompare(b.toLowerCase ? b.toLowerCase(): b)
            : parseInt(a, 10) > parseInt(b, 10) ? 1 : parseInt(a, 10) < parseInt(b, 10) ? -1 : 0;
    };

    var scripts = fs.readdirSync(dir).sort(compareNumbers).filter(function(s) {
        return s[0] != '.';
    });
    return scripts.map(function (scriptPath) {
        // for old style hook files we don't use module loader for backward compatibility
        return { path: scriptPath, fullPath: path.join(dir, scriptPath), useModuleLoader: false };
    });
}

/**
 * Gets all scripts defined in nodekit.json with the specified type and platforms.
 */
function getScriptsFromNodeKitJson(hook, opts) {
    var configPath = nodekitUtil.projectConfig(opts.projectRoot);
    var nodekitJson = new ConfigParser(configPath);

    return nodekitJson.getHookScripts(hook, opts.nodekit.platforms).map(function(scriptElement) {
        return {
            path: scriptElement.attrib.src,
            fullPath: path.join(opts.projectRoot, scriptElement.attrib.src)
        };
    });
}

/**
 * Gets hook scripts defined by the plugin.
 */
function getPluginScriptFiles(plugin, hook, platforms) {
    var scriptElements = plugin.pluginInfo.getHookScripts(hook, platforms);

    return scriptElements.map(function(scriptElement) {
        return {
            path: scriptElement.attrib.src,
            fullPath: path.join(plugin.dir, scriptElement.attrib.src),
            plugin: plugin
        };
    });
}

/**
 * Gets hook scripts defined by all plugins.
 */
function getAllPluginsHookScriptFiles(hook, opts) {
    var scripts = [];
    var currentPluginOptions;

    var plugins = (new PluginInfoProvider()).getAllWithinSearchPath(path.join(opts.projectRoot, 'plugins'));

    plugins.forEach(function(pluginInfo) {
        currentPluginOptions = {
            id: pluginInfo.id,
            pluginInfo: pluginInfo,
            dir: pluginInfo.dir
        };

        scripts = scripts.concat(getPluginScriptFiles(currentPluginOptions, hook, opts.nodekit.platforms));
    });
    return scripts;
}
