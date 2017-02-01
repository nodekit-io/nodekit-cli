/*
 *
 * Licensed to OffGrid Networks (OGN) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  OGN licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/*jslint sloppy:true, plusplus:true*/
/*global require, module, console */

var nodekit = require('nodekit');
var execProxy = require('nodekit/exec/proxy');

/**
 * Execute a nodekit command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will nodekit.callbackSuccess or nodekit.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in nodekit
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */
module.exports = function (success, fail, service, action, args) {

    // Handle the case when we have an old version of splashscreen plugin to avoid the API calls failures
    if (service === 'SplashScreen') {
        var pluginsVersions = require("nodekit/plugin_list").metadata;
        var splashscreenVersion = pluginsVersions['nodekit-plugin-splashscreen'];
        var MIN_SPLASHSCREEN_SUPPORTED_VER = 4;
        if (splashscreenVersion && ((parseInt(splashscreenVersion.split('.')[0], 10) || 0) < MIN_SPLASHSCREEN_SUPPORTED_VER)) {
            console.log('Warning: A more recent version of nodekit-plugin-splashscreen has been hooked into for compatibility reasons. Update the plugin to version >= 4.');

            var platformSplashscreen = require('nodekit/splashscreen');
            // Replace old plugin proxy with the platform's one
            require('nodekit/exec/proxy').add(service, platformSplashscreen);
        }
    }

    var proxy = execProxy.get(service, action),
        callbackId,
        onSuccess,
        onError;

    args = args || [];

    if (proxy) {
        callbackId = service + nodekit.callbackId++;
        // console.log("EXEC:" + service + " : " + action);
        if (typeof success === "function" || typeof fail === "function") {
            nodekit.callbacks[callbackId] = {success: success, fail: fail};
        }
        try {
            // callbackOptions param represents additional optional parameters command could pass back, like keepCallback or
            // custom callbackId, for example {callbackId: id, keepCallback: true, status: nodekit.callbackStatus.JSON_EXCEPTION }
            // CB-5806 [Windows8] Add keepCallback support to proxy
            onSuccess = function (result, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in nodekit.callbackFromNative
                // see CB-8996 Mobilespec app hang on windows
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = nodekit.callbackStatus.OK;
                }
                nodekit.callbackSuccess(callbackOptions.callbackId || callbackId,
                    {
                        status: callbackStatus,
                        message: result,
                        keepCallback: callbackOptions.keepCallback || false
                    });
            };
            onError = function (err, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in nodekit.callbackFromNative
                // see CB-8996 Mobilespec app hang on windows
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = nodekit.callbackStatus.OK;
                }
                nodekit.callbackError(callbackOptions.callbackId || callbackId,
                    {
                        status: callbackStatus,
                        message: err,
                        keepCallback: callbackOptions.keepCallback || false
                    });
            };
            proxy(onSuccess, onError, args);

        } catch (e) {
            console.log("Exception calling native with command :: " + service + " :: " + action  + " ::exception=" + e);
        }
    } else {
        if (typeof fail === "function") {
            fail("Missing Command Error");
        }
    }
};
