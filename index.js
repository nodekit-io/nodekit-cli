/*
* nodekit.io
*
* Copyright (c) 2016-7 OffGrid Networks. All Rights Reserved.
* Portions Copyright 2012 The Apache Software Foundation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var path = require('path');

function addProperty(obj, property, modulePath) {
    // Add properties as getter to delay load the modules on first invocation
    Object.defineProperty(obj, property, {
        configurable: true,
        get: function () {
            var module = require(modulePath);
            // We do not need the getter any more
            obj[property] = module;
            return module;
        }
    });
}
exports = module.exports = {};

module.exports.platforms = 
    { 
        "nodekit-platform-android": path.join(__dirname, "src", "nodekit-platform-android"),
        "nodekit-platform-ios": path.join(__dirname, "src", "nodekit-platform-ios"),
        "nodekit-platform-osx": path.join(__dirname, "src", "nodekit-platform-osx"),
        "nodekit-platform-macos": path.join(__dirname, "src", "nodekit-platform-macos"),
        "nodekit-platform-windows": path.join(__dirname, "src", "nodekit-platform-windows")
    };

addProperty(module.exports, 'nodekit-cli-common', './src/nodekit-cli-common');
addProperty(module.exports, 'nodekit-cli-fetch', './src/nodekit-cli-fetch');
addProperty(module.exports, 'nodekit-cli-serve', './src/nodekit-cli-serve');
addProperty(module.exports, 'nodekit-cli-lib', './src/nodekit-cli-lib');
addProperty(module.exports, 'nodekit-cli-create', './src/nodekit-cli-create');

module.exports.cli = require('./src/cli');