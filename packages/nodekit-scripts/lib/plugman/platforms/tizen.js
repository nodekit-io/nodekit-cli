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

/* jshint laxcomma:true, sub:true */

var path = require('path')
    , fs = require('fs')
    , events = require('nodekit-scripts').common.events
    , xml_helpers = require('nodekit-scripts').common.xmlHelpers;

module.exports = {
    app_dir: function(project_dir) {
        return path.join(project_dir, 'app');
    },
    package_name:function(project_dir) {
        // preferred location if nodekit >= 3.4
        var preferred_path = path.join(project_dir, 'nodekit.json');
        var config_path;
        if (!fs.existsSync(preferred_path)) {
            // older location
            var old_config_path = path.join(module.exports.app_dir(project_dir), 'nodekit.json');
            if (!fs.existsSync(old_config_path)) {
                // output newer location and fail reading
                config_path = preferred_path;
                events.emit('verbose', 'unable to find '+config_path);
            } else {
                config_path = old_config_path;
            }
        } else {
            config_path = preferred_path;
        }
        var widget_doc = xml_helpers.parseElementtreeSync(config_path);
        return widget_doc._root.attrib['id'];
    },
    'source-file':{
        install: function(obj, plugin_dir, project_dir, plugin_id, options) {},
        uninstall: function(obj, project_dir, plugin_id, options) {}
    },
    'header-file': {
        install: function(obj, plugin_dir, project_dir, plugin_id, options) {},
        uninstall: function(obj, project_dir, plugin_id, options) {}
    },
    'resource-file':{
        install: function(obj, plugin_dir, project_dir, plugin_id, options) {},
        uninstall: function(obj, project_dir, plugin_id, options) {}
    },
    'framework': {
        install: function(obj, plugin_dir, project_dir, plugin_id, options) {},
        uninstall: function(obj, project_dir, plugin_id, options) {}
    },
    'lib-file': {
        install: function(obj, plugin_dir, project_dir, plugin_id, options) {},
        uninstall: function(obj, project_dir, plugin_id, options) {}
    }
};
