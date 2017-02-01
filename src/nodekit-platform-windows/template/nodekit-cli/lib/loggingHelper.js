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

var NodeKitLogger = require('nodekit-cli')['nodekit-cli-common'].NodeKitLogger;

module.exports = {
    adjustLoggerLevel: function (opts) {
        if (opts instanceof Array) {
            opts.silent = opts.indexOf('--silent') !== -1;
            opts.verbose = opts.indexOf('--verbose') !== -1 || opts.indexOf('-d') !== -1;
        }

        if (opts.verbose) {
            NodeKitLogger.get().setLevel('verbose');
        }

        if (opts.silent) {
            NodeKitLogger.get().setLevel('error');
        }
    }
};