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

/*jshint node: true*/

var PlatformJson = require('nodekit-cli')['nodekit-cli-common'].PlatformJson;
var PlatformMunger = require('nodekit-cli')['nodekit-cli-common'].ConfigChanges.PlatformMunger;
var PluginInfoProvider = require('nodekit-cli')['nodekit-cli-common'].PluginInfoProvider;

//shared PlatformMunger instance
var _instance = null;

module.exports = {

    get: function(platformRoot) {
        if (!_instance) {
            _instance = new PlatformMunger('osx', platformRoot, PlatformJson.load(platformRoot, 'osx'),
                new PluginInfoProvider());
        }

        return _instance;
    }
};
