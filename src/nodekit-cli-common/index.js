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

var addProperty = require('./util/addProperty');

module.exports = { };

addProperty(module, 'events', './events');
addProperty(module, 'superspawn', './superspawn');

addProperty(module, 'ActionStack', './ActionStack');
addProperty(module, 'NodeKitError', './NodeKitError/NodeKitError');
addProperty(module, 'NodeKitLogger', './NodeKitLogger');
addProperty(module, 'NodeKitCheck', './NodeKitCheck');
addProperty(module, 'NodeKitExternalToolErrorContext', './NodeKitError/NodeKitExternalToolErrorContext');
addProperty(module, 'PlatformJson', './PlatformJson');
addProperty(module, 'ConfigParser', './ConfigParser/ConfigParser');
addProperty(module, 'FileUpdater', './FileUpdater');

addProperty(module, 'PluginInfo', './PluginInfo/PluginInfo');
addProperty(module, 'PluginInfoProvider', './PluginInfo/PluginInfoProvider');

addProperty(module, 'PluginManager', './PluginManager');

addProperty(module, 'ConfigChanges', './ConfigChanges/ConfigChanges');
addProperty(module, 'ConfigKeeper', './ConfigChanges/ConfigKeeper');
addProperty(module, 'ConfigFile', './ConfigChanges/ConfigFile');
addProperty(module, 'mungeUtil', './ConfigChanges/munge-util');

addProperty(module, 'xmlHelpers', './util/xml-helpers');

