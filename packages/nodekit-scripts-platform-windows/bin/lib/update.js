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

var Q      = require('q');
var fs     = require('fs');
var path   = require('path');
var shell   = require('shelljs');
var create = require('./create');
var events = require('nodekit-scripts').common.events;
var ConfigParser = require('nodekit-scripts').common.ConfigParser;
var NodeKitError = require('nodekit-scripts').common.NodeKitError;
var AppxManifest = require('../../template/nodekit-scripts/lib/AppxManifest');

// updates the nodekit.js in project along with the nodekit tooling.
module.exports.update = function (destinationDir, options) {
    if (!fs.existsSync(destinationDir)){
        // if specified project path is not valid then reject promise
        return Q.reject(new NodeKitError('The given path to the project does not exist: ' + destinationDir));
    }

    var projectConfig = path.join(destinationDir, 'nodekit.json');
    if (!fs.existsSync(projectConfig)){
        return Q.reject(new NodeKitError('Can\'t update project at ' + destinationDir +
            '. nodekit.json does not exist in destination directory'));
    }

    var guid;
    var config = new ConfigParser(projectConfig);

    // guid param is used only when adding a platform, and isn't saved anywhere.
    // The only place, where it is being persisted - phone/win10 appxmanifest file,
    // but since win10 introduced just recently, we can't rely on its manifest
    // for old platform versions.
    var manifestPath = path.join(destinationDir, 'package.phone.appxmanifest');
    try {
        guid = AppxManifest.get(manifestPath).getPhoneIdentity().getPhoneProductId();
    } catch (e) { /*ignore IO errors */ }

    shell.rm('-rf', destinationDir);
    return create.create(destinationDir, config, {guid: guid}, events);
};

