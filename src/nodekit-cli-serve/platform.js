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

var fs     = require('fs'),
    Q      = require('q'),
    util   = require('./util');

/**
 * Launches a server where the root points to the specified platform in a NodeKit project.
 * @param {string} platform - NodeKit platform to serve.
 * @param {{root: ?string, port: ?number, urlPathProcessor: ?function, streamHandler: ?function, serverExtender: ?function}} opts
 *   root - nodekit project directory, or any directory within it. If not specified, cwd is used. This will be modified to point to the platform's app_dir.
 *   All other values are passed unaltered to launchServer().
 * @returns {*|promise}
 */
module.exports = function (platform, opts) {
    var that = this;
    return Q().then(function () {
        if (!platform) {
            throw new Error('A platform must be specified');
        }

        opts = opts || {};
        var projectRoot = findProjectRoot(opts.root);
        that.projectRoot = projectRoot;

        opts.root = util.getPlatformAppRoot(projectRoot, platform);
        if (!fs.existsSync(opts.root)) {
            throw new Error('Project does not include the specified platform: ' + platform);
        }

        return that.launchServer(opts);
    });
};

function findProjectRoot(path) {
    var projectRoot = util.nodekitProjectRoot(path);
    if (!projectRoot) {
        if (!path) {
            throw new Error('Current directory does not appear to be in a NodeKit project.');
        } else {
            throw new Error('Directory "' + path + '" does not appear to be in a NodeKit project.');
        }
    }
    return projectRoot;
}
