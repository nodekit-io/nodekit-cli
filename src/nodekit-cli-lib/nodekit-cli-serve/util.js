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

var fs   = require('fs'),
    path = require('path');

// Some helpful utility stuff copied from nodekit-lib. This is a bit nicer than taking a dependency on nodekit-lib just
// to get this minimal stuff. Hopefully we won't need the platform stuff (finding platform app_dir) once it is moved
// into the actual platform.

var platforms = {
    amazon_fireos: {app_dir: 'assets/app'},
    android: {app_dir: 'assets/app'},
    blackberry10: {app_dir: 'app'},
    browser: {app_dir: 'app'},
    firefoxos: {app_dir: 'app'},
    ios: {app_dir: 'app'},
    ubuntu: {app_dir: 'app'},
    windows: {app_dir: 'app'},
    wp8: {app_dir: 'app'}
};

/**
 * @desc Look for a NodeKit project's root directory, starting at the specified directory (or CWD if none specified).
 * @param {string=} dir - the directory to start from (we check this directory then work up), or CWD if none specified.
 * @returns {string} - the NodeKit project's root directory, or null if not found.
 */
function nodekitProjectRoot(dir) {
    if (!dir) {
        // Prefer PWD over cwd so that symlinked dirs within your PWD work correctly.
        var pwd = process.env.PWD;
        var cwd = process.cwd();
        if (pwd && pwd != cwd && pwd != 'undefined') {
            return nodekitProjectRoot(pwd) || nodekitProjectRoot(cwd);
        }
        return nodekitProjectRoot(cwd);
    }

    var bestReturnValueSoFar = null;
    for (var i = 0; i < 1000; ++i) {
        var result = isRootDir(dir);
        if (result === 2) {
            return dir;
        }
        if (result === 1) {
            bestReturnValueSoFar = dir;
        }
        var parentDir = path.normalize(path.join(dir, '..'));
        // Detect fs root.
        if (parentDir == dir) {
            return bestReturnValueSoFar;
        }
        dir = parentDir;
    }
    return null;
}

function getPlatformAppRoot(nodekitProjectRoot, platformName) {
    var platform = platforms[platformName];
    if (!platform) {
        throw new Error ('Unrecognized platform: ' + platformName);
    }
    return path.join(nodekitProjectRoot, 'platforms', platformName, platform.app_dir);
}

function isRootDir(dir) {
    if (fs.existsSync(path.join(dir, 'app'))) {
        if (fs.existsSync(path.join(dir, 'nodekit.json'))) {
            // For sure is.
            if (fs.existsSync(path.join(dir, 'platforms'))) {
                return 2;
            } else {
                return 1;
            }
        }
        // Might be (or may be under platforms/).
        if (fs.existsSync(path.join(dir, 'app', 'nodekit.json'))) {
            return 1;
        }
    }
    return 0;
}

module.exports = {
    nodekitProjectRoot: nodekitProjectRoot,
    getPlatformAppRoot: getPlatformAppRoot,
    platforms: platforms
};
