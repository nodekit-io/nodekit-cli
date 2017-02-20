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

var NodeKitCliCreate = function () {

}; 

/**
 * provides logic for exposing nodekit-lib create functionality to the command line
 * the create argument is implied from the call to this function, all other cl arguments should be passed in unmodified
 * 
 * @args  - 
 * @undashed 
 */
NodeKitCliCreate.prototype.run = function (args, undashed) {
    var cfg = {},
        customApp;

    // parseConfig will determine if there's a valid config JSON string
    cfg = this.parseConfig(undashed[4]);
    
    // create(dir, id, name, cfg)
    nodekit.raw.create(undashed[1] , // dir to create the project in
                       undashed[2] || 'org.example.' + undashed[1] , // App id
                       undashed[3] || undashed[1] , // App name
                       cfg
    ).done();
};

/**
 * parseConfig
 * generic parser, if it's valid json, returns the resulting object
 * if anything resolving to false is passed in, return an empty object 
 * invalid json results in an error message and process exit with status code 2.
 *
 * jsondata - a json data string
 *
 */
NodeKitCliCreate.prototype.parseConfig = function (jsondata) {
    if (!jsondata) return {};

    try {
        cfg = JSON.parse(jsondata);
    } catch (e) {
        console.error('Error while parsing json data\nError: '+ e +'\nData:' + jsondata);
        process.exit(2); 
    }
};
NodeKitCliCreate.prototype.customApp = function (args) {

    // handle custom app
    if (!!(customApp = args['copy-from'] || args['link-to'])) {

        if (customApp.indexOf(':') != -1) {
            throw new NodeKitError(
            'Only local paths for custom app assets are supported.'
            );

        }

        if ( customApp.substr(0,1) === '~' ) {  // resolve tilde in a naive way.
            customApp = path.join(process.env.HOME,  customApp.substr(1));
        }

        customApp = path.resolve(customApp);
        var appCfg = { uri: customApp };
        if (args['link-to']) {
            appCfg.link = true;
        }

        cfg.lib = cfg.lib || {};
        cfg.lib.app = appCfg;
    }
};

module.exports = new NodeKitCliCreate();
