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

/* jshint sub:true */
var fs            = require('fs'),
    path          = require('path'),
    events        = require('nodekit-cli')['nodekit-cli-common'].events,
    NodeKitError  = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    shell         = require('shelljs'),
    url           = require('url'),
    nopt          = require('nopt'),
    Q             = require('q'),
    semver        = require('semver');

// Global configuration paths
var global_config_path = process.env['NODEKIT_HOME'];
if (!global_config_path) {
    var HOME = process.env[(process.platform.slice(0, 3) == 'win') ? 'USERPROFILE' : 'HOME'];
    global_config_path = path.join(HOME, '.nodekit');
}

var origCwd = null;

var lib_path = path.join(global_config_path, 'lib');


exports.binname = 'nodekit';
exports.globalConfig = global_config_path;

// defer defining libDirectory on exports so we don't create it if 
// someone simply requires this module
Object.defineProperty(exports,'libDirectory', {
        configurable: true,
        get: function () {
            shell.mkdir('-p', lib_path);
            exports.libDirectory = lib_path;
        return lib_path;
    }
});

addModuleProperty(module, 'plugin_parser', './plugin_parser');

exports.isNodeKit = isNodeKit;
exports.cdProjectRoot = cdProjectRoot;
exports.deleteSvnFolders = deleteSvnFolders;
exports.listPlatforms = listPlatforms;
exports.findPlugins = findPlugins;
exports.appDir = appDir;
exports.projectApp = projectApp;
exports.projectConfig = projectConfig;
exports.preProcessOptions = preProcessOptions;
exports.addModuleProperty = addModuleProperty;
exports.getOrigWorkingDirectory = getOrigWorkingDirectory;
exports._resetOrigCwd = _resetOrigCwd;
exports.fixRelativePath = fixRelativePath;
exports.convertToRealPathSafe = convertToRealPathSafe;
exports.isDirectory = isDirectory;
exports.isUrl = isUrl;
exports.getLatestMatchingNpmVersion = getLatestMatchingNpmVersion;
exports.getAvailableNpmVersions = getAvailableNpmVersions;
exports.getInstalledPlatformsWithVersions = getInstalledPlatformsWithVersions;
exports.existsSync = existsSync;

function isUrl(value) {
    var u = value && url.parse(value);
    return !!(u && u.protocol && u.protocol.length > 2); // Account for windows c:/ paths
}

function isRootDir(dir) {
    if (exports.existsSync(path.join(dir, 'app'))) {
        if (exports.existsSync(path.join(dir, 'nodekit.json'))) {
            // For sure is.
            if (exports.existsSync(path.join(dir, 'platforms'))) {
                return 2;
            } else {
                return 1;
            }
        }
        // Might be (or may be under platforms/).
        if (exports.existsSync(path.join(dir, 'app', 'nodekit.json'))) {
            return 1;
        }
    }
    return 0;
}

function existsSync(fileSpec) {
    // Since fs.existsSync() is deprecated
    try {
        fs.statSync(fileSpec);
        return true;
    } catch (error) {
        return false;
    }
}


// Runs up the directory chain looking for a .nodekit directory.
// IF it is found we are in a NodeKit project.
// Omit argument to use CWD.
function isNodeKit(dir) {
    if (!dir) {
        // Prefer PWD over cwd so that symlinked dirs within your PWD work correctly (CB-5687).
        var pwd = process.env.PWD;
        var cwd = process.cwd();
        if (pwd && pwd != cwd && pwd != 'undefined') {
            return this.isNodeKit(pwd) || this.isNodeKit(cwd);
        }
        return this.isNodeKit(cwd);
    }
    var bestReturnValueSoFar = false;
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
    console.error('Hit an unhandled case in util.isNodeKit');
    return false;
}

// Cd to project root dir and return its path. Throw NodeKitError if not in a Corodva project.
function cdProjectRoot() {
    var projectRoot = this.isNodeKit();
    if (!projectRoot) {
        throw new NodeKitError('Current working directory is not a NodeKit-based project.');
    }
    if (!origCwd) {
        origCwd = process.env.PWD || process.cwd();
    }
    process.env.PWD = projectRoot;
    process.chdir(projectRoot);
    return projectRoot;
}

function getOrigWorkingDirectory() {
    return origCwd || process.env.PWD || process.cwd();
}

function _resetOrigCwd() {
    origCwd = null;
}

// Fixes up relative paths that are no longer valid due to chdir() within cdProjectRoot().
function fixRelativePath(value, /* optional */ cwd) {
    // Don't touch absolute paths.
    if (value[1] == ':' || value[0] == path.sep) {
        return value;
    }
    var newDir = cwd || process.env.PWD || process.cwd();
    var origDir = getOrigWorkingDirectory();
    var pathDiff = path.relative(newDir, origDir);
    var ret = path.normalize(path.join(pathDiff, value));
    return ret;
}

// Resolve any symlinks in order to avoid relative path issues. See https://issues.apache.org/jira/browse/CB-8757
function convertToRealPathSafe(path) {
    if (path && exports.existsSync(path)) {
        return fs.realpathSync(path);
    }

    return path;
}

// Recursively deletes .svn folders from a target path
function deleteSvnFolders(dir) {
    var contents = fs.readdirSync(dir);
    contents.forEach(function(entry) {
        var fullpath = path.join(dir, entry);
        if (fs.statSync(fullpath).isDirectory()) {
            if (entry == '.svn') {
                shell.rm('-rf', fullpath);
            } else module.exports.deleteSvnFolders(fullpath);
        }
    });
}

function listPlatforms(project_dir) {
    var core_platforms = require('../platforms/platforms');
    var platforms_dir = path.join(project_dir, 'platforms');
    if ( !exports.existsSync(platforms_dir)) {
        return [];
    }
    var subdirs = fs.readdirSync(platforms_dir);
    return subdirs.filter(function(p) {
        return Object.keys(core_platforms).indexOf(p) > -1;
    });
}

function getInstalledPlatformsWithVersions(project_dir) {
    var result = {};
    var platforms_on_fs = listPlatforms(project_dir);

    return Q.all(platforms_on_fs.map(function(p) {
        var superspawn    = require('nodekit-cli')['nodekit-cli-common'].superspawn;
        return superspawn.maybeSpawn(path.join(project_dir, 'platforms', p, 'nodekit-cli', 'version'), [], { chmod: true })
        .then(function(v) {
            result[p] = v || null;
        }, function(v) {
            result[p] = 'broken';
        });
    })).then(function() {
        return result;
    });
}

// list the directories in the path, ignoring any files
function findPlugins(pluginPath) {
    var plugins = [],
        stats;

    if (exports.existsSync(pluginPath)) {
        plugins = fs.readdirSync(pluginPath).filter(function (fileName) {
            stats = fs.statSync(path.join(pluginPath, fileName));
            return fileName != '.svn' && fileName != 'CVS' && stats.isDirectory();
        });
    }

    return plugins;
}

function appDir(projectDir) {
    return projectDir;
}

function projectApp(projectDir) {
    return path.join(projectDir, 'app');
}

function projectConfig(projectDir) {
    var rootPath = path.join(projectDir, 'nodekit.json');
    var appPath = path.join(projectDir, 'app', 'nodekit.json');
    if (exports.existsSync(rootPath)) {
        return rootPath;
    } else if (exports.existsSync(appPath)) {
        return appPath;
    }
    return false;
}

function preProcessOptions (inputOptions) {
    /**
     * Current Desired Arguments
     * options: {verbose: boolean, platforms: [String], options: [String]}
     * Accepted Arguments
     * platformList: [String] -- assume just a list of platforms
     * platform: String -- assume this is a platform
     */
    var result = inputOptions || {};
    if (Array.isArray(inputOptions)) {
        result = { platforms: inputOptions };
    } else if (typeof inputOptions === 'string') {
        result = { platforms: [inputOptions] };
    }
    result.verbose = result.verbose || false;
    result.platforms = result.platforms || [];
    result.options = ensurePlatformOptionsCompatible(result.options);

    var projectRoot = this.isNodeKit();

    if (!projectRoot) {
        throw new NodeKitError('Current working directory is not a NodeKit-based project.');
    }
    var projectPlatforms = this.listPlatforms(projectRoot);
    if (projectPlatforms.length === 0) {
        throw new NodeKitError('No platforms added to this project. Please use `'+exports.binname+' platform add <platform>`.');
    }
    if (result.platforms.length === 0) {
        result.platforms = projectPlatforms;
    }

    if (!result.options.buildConfig && exports.existsSync(path.join(projectRoot, 'build.json'))) {
        result.options.buildConfig = path.join(projectRoot, 'build.json');
    }

    return result;
}

/**
 * Converts options, which is passed to platformApi from old format (array of
 *   plain strings) to new - nopt-parsed object + array of platform-specific
 *   options. If options are already in new the format - returns them unchanged.
 *
 * @param   {Object|String[]}  platformOptions  A platform options (array of
 *   strings or object) which is passed down to platform scripts/platformApi
 *   polyfill.
 *
 * @return  {Object}                            Options, converted to new format
 */
function ensurePlatformOptionsCompatible (platformOptions) {
    var opts = platformOptions || {};

    if (!Array.isArray(opts))
        return opts;

    events.emit('warn', 'The format of nodekit.raw.* methods "options" argument was changed in 5.4.0. ' +
        '"options.options" property now should be an object instead of an array of plain strings. Though the old format ' +
        'is still supported, consider updating your nodekit.raw.* method calls to use new argument format.');

    var knownArgs = [
        'debug',
        'release',
        'device',
        'emulator',
        'nobuild',
        'list',
        'buildConfig',
        'target',
        'archs'
    ];

    opts = nopt({}, {}, opts, 0);
    opts.argv = Object.keys(opts)
    .filter(function (arg) {
        return arg !== 'argv' && knownArgs.indexOf(arg) === -1;
    }).map(function (arg) {
        return opts[arg] === true ?
            '--' + arg :
            '--' + arg + '=' + opts[arg].toString();
    });

    return opts;
}

function isDirectory(dir) {
    try {
        return fs.lstatSync(dir).isDirectory();
    } catch (e) {
        return false;
    }
}

// opt_wrap is a boolean: True means that a callback-based wrapper for the promise-based function
// should be created.
function addModuleProperty(module, symbol, modulePath, opt_wrap, opt_obj) {
    var val = null;
    if (opt_wrap) {
        module.exports[symbol] = function() {
            val = val || module.require(modulePath);
            if (arguments.length && typeof arguments[arguments.length - 1] === 'function') {
                // If args exist and the last one is a function, it's the callback.
                var args = Array.prototype.slice.call(arguments);
                var cb = args.pop();
                val.apply(module.exports, args).done(function(result) { cb(undefined, result); }, cb);
            } else {
                val.apply(module.exports, arguments).done(null, function(err) { throw err; });
            }
        };
    } else {
        Object.defineProperty(opt_obj || module.exports, symbol, {
            get : function() { val = val || module.require(modulePath); return val; },
            set : function(v) { val = v; }
        });
    }

    // Add the module.raw.foo as well.
    if(module.exports.raw) {
        Object.defineProperty(module.exports.raw, symbol, {
            get : function() { val = val || module.require(modulePath); return val; },
            set : function(v) { val = v; }
        });
    }
}

/**
 * Returns the latest version of the specified module on npm that matches the specified version or range.
 * @param {string} module_name - npm module name.
 * @param {string} version - semver version or range (loose allowed).
 * @returns {Promise} Promise for version (a valid semver version if one is found, otherwise whatever was provided).
 */
function getLatestMatchingNpmVersion(module_name, version) {
    if (!version) {
        // If no version specified, get the latest
        return getLatestNpmVersion(module_name);
    }

    var validVersion = semver.valid(version, /* loose */ true);
    if (validVersion) {
        // This method is really intended to work with ranges, so if a version rather than a range is specified, we just
        // assume it is available and return it, bypassing the need for the npm call.
        return Q(validVersion);
    }

    var validRange = semver.validRange(version, /* loose */ true);
    if (!validRange) {
        // Just return what we were passed
        return Q(version);
    }

    return getAvailableNpmVersions(module_name).then(function (versions) {
        return semver.maxSatisfying(versions, validRange) || version;
    });
}

/**
 * Returns a promise for an array of versions available for the specified npm module.
 * @param {string} module_name - npm module name.
 * @returns {Promise} Promise for an array of versions.
 */
function getAvailableNpmVersions(module_name) {
    var npm = require('npm');
    return Q.nfcall(npm.load).then(function () {
        return Q.ninvoke(npm.commands, 'view', [module_name, 'versions'], /* silent = */ true).then(function (result) {
            // result is an object in the form:
            //     {'<version>': {versions: ['1.2.3', '1.2.4', ...]}}
            // (where <version> is the latest version)
            return result[Object.keys(result)[0]].versions;
        });
    });
}

/**
 * Returns a promise for the latest version available for the specified npm module.
 * @param {string} module_name - npm module name.
 * @returns {Promise} Promise for an array of versions.
 */
function getLatestNpmVersion(module_name) {
    var npm = require('npm');
    return Q.nfcall(npm.load).then(function () {
        return Q.ninvoke(npm.commands, 'view', [module_name, 'version'], /* silent = */ true).then(function (result) {
            // result is an object in the form:
            //     {'<version>': {version: '<version>'}}
            // (where <version> is the latest version)
            return Object.keys(result)[0];
        });
    });
}
