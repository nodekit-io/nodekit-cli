/*
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

var Q     = require('q');
var fs    = require('fs');
var path  = require('path');
var shell = require('shelljs');
var uuid  = require('node-uuid');
var events = require('nodekit-scripts').common.events;
var NodeKitError = require('nodekit-scripts').common.NodeKitError;
var AppxManifest = require('../../template/nodekit-scripts/lib/AppxManifest');
var pkg = require('../../package');

// Creates nodekit-windows project at specified path with specified namespace, app name and GUID
module.exports.create = function (destinationDir, config, options) {
    if(!destinationDir) return Q.reject('No destination directory specified.');

    var projectPath = path.resolve(destinationDir);
    if (fs.existsSync(projectPath)) {
        return Q.reject(new NodeKitError('Project directory already exists:\n\t' + projectPath));
    }

    // Set parameters/defaults for create
    var packageName = (config && config.packageName()) || 'NodeKit.Example';
    var appName = (config && config.name()) || 'NodeKitAppProj';
        // 64 symbols restriction goes from manifest schema definition
        // http://msdn.microsoft.com/en-us/library/windows/apps/br211415.aspx
    var safeAppName = appName.length <= 64 ? appName : appName.substr(0, 64);
    var templateOverrides = options.customTemplate;
    var guid = options.guid || uuid.v1();
    var root = path.join(__dirname, '..', '..');

    events.emit('log', 'Creating NodeKit Windows Project:');
    events.emit('log', '\tPath: ' + path.relative(process.cwd(), projectPath));
    events.emit('log', '\tNamespace: ' + packageName);
    events.emit('log', '\tName: ' + appName);
    if (templateOverrides) {
        events.emit('log', '\tCustomTemplatePath: ' + templateOverrides);
    }

    // Copy the template source files to the new destination
    events.emit('verbose', 'Copying windows template project to ' + projectPath);
    shell.cp('-rf', path.join(root, 'template', '*'), projectPath);

    // Duplicate nodekit.js to platform_app otherwise it will get removed by prepare
    shell.cp('-rf', path.join(root, 'template/app/nodekit.js'), path.join(projectPath, 'platform_app'));
    // Duplicate splashscreen.css to platform_app otherwise it will get removed by prepare
    var cssDirectory = path.join(projectPath, 'platform_app', 'css');
    recursiveCreateDirectory(cssDirectory);
    shell.cp('-rf', path.join(root, 'template/app/css/splashscreen.css'), cssDirectory);

    // Copy nodekit-js-src directory
    events.emit('verbose', 'Copying nodekit-js sources to platform_app');
    shell.cp('-rf', path.join(root, 'nodekit-js-src'), path.join(projectPath, 'platform_app'));

    // Copy our unique VERSION file, so peeps can tell what version this project was created from.
    shell.cp('-rf', path.join(root, 'VERSION'), projectPath);

    // copy node_modules to nodekit directory
    events.emit('verbose', 'Copying node_modules to ' + projectPath);
    shell.cp('-r', path.join(root, 'node_modules'), path.join(projectPath, 'nodekit-scripts'));

    // copy check_reqs module to nodekit directory
    shell.cp('-rf', path.join(root, 'bin', 'check_reqs*'), path.join(projectPath, 'nodekit-scripts'));
    shell.cp('-rf', path.join(root, 'bin', 'lib', 'check_reqs*'), path.join(projectPath, 'nodekit-scripts', 'lib'));

    if (templateOverrides && fs.existsSync(templateOverrides)) {
        events.emit('verbose', 'Copying windows template overrides from ' + templateOverrides + ' to ' + projectPath);
        shell.cp('-rf', templateOverrides, projectPath);
    }

    // Copy base.js into the target project directory
    var destinationDirectory = path.join(projectPath, 'platform_app', 'WinJS', 'js');
    var destBaseJsPath = path.join(destinationDirectory, 'base.js');
    var srcBaseJsPath = path.join(root, 'node_modules', 'winjs', 'js', 'base.js');
    recursiveCreateDirectory(destinationDirectory);
    shell.cp('-f', srcBaseJsPath, destBaseJsPath);

    // CB-12042 Also copy base.js to app directory
    shell.mkdir('-p', path.join(projectPath, 'app/WinJS/js'));
    shell.cp('-f', srcBaseJsPath, path.join(projectPath, 'app/WinJS/js/base.js'));

    // replace specific values in manifests' templates
    events.emit('verbose', 'Updating manifest files with project configuration.');
    [ 'package.windows.appxmanifest', 'package.phone.appxmanifest',
      'package.windows10.appxmanifest' ]
    .forEach(function (item) {
        var manifest = AppxManifest.get(path.join(projectPath, item));
        if (manifest.hasPhoneIdentity) {
            manifest.getPhoneIdentity().setPhoneProductId(guid);
        }

        manifest.setPackageName(packageName)
            .setAppName(safeAppName)
            .write();
    });

    // Delete bld forder and bin folder
    ['bld', 'bin', '*.user', '*.suo', 'MyTemplate.vstemplate'].forEach(function (file) {
        shell.rm('-rf', path.join(projectPath, file));
    });

    events.emit('log', 'Windows project created with ' + pkg.name + '@' + pkg.version);
    return Q.resolve();
};

function recursiveCreateDirectory(targetPath, previousPath) {
    if (previousPath === targetPath) {
        // Shouldn't ever happen because we're already in a created directory
        // This is just here to prevent any potential infinite loop / stack overflow condition
        console.warn('Could not create a directory because its root was never located.');
        return;
    }

    var parent = path.join(targetPath, '..');
    if (!fs.existsSync(parent)) {
        recursiveCreateDirectory(parent, targetPath);
    }

    fs.mkdirSync(targetPath);
}
