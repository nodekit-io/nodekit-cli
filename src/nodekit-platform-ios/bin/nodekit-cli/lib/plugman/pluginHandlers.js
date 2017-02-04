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

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var events = require('nodekit-cli')['nodekit-cli-common'].events;
var NodeKitError = require('nodekit-cli')['nodekit-cli-common'].NodeKitError;

// These frameworks are required by nodekit-ios by default. We should never add/remove them.
var keep_these_frameworks = [
    'MobileCoreServices.framework',
    'CoreGraphics.framework',
    'AssetsLibrary.framework'
];

var handlers = {
    'source-file':{
        install:function(obj, plugin, project, options) {
            installHelper('source-file', obj, plugin.dir, project.projectDir, plugin.id, options, project);
        },
        uninstall:function(obj, plugin, project, options) {
            uninstallHelper('source-file', obj, project.projectDir, plugin.id, options, project);
        }
    },
    'header-file':{
        install:function(obj, plugin, project, options) {
            installHelper('header-file', obj, plugin.dir, project.projectDir, plugin.id, options, project);
        },
        uninstall:function(obj, plugin, project, options) {
            uninstallHelper('header-file', obj, project.projectDir, plugin.id, options, project);
        }
    },
    'resource-file':{
        install:function(obj, plugin, project, options) {
            var src = obj.src,
                srcFile = path.resolve(plugin.dir, src),
                destFile = path.resolve(project.resources_dir, path.basename(src));
            if (!fs.existsSync(srcFile)) throw new NodeKitError('Cannot find resource file "' + srcFile + '" for plugin ' + plugin.id + ' in iOS platform');
            if (fs.existsSync(destFile)) throw new NodeKitError('File already exists at detination "' + destFile + '" for resource file specified by plugin ' + plugin.id + ' in iOS platform');
            project.xcode.addResourceFile(path.join('Resources', path.basename(src)));
            var link = !!(options && options.link);
            copyFile(plugin.dir, src, project.projectDir, destFile, link);
        },
        uninstall:function(obj, plugin, project, options) {
            var src = obj.src,
                destFile = path.resolve(project.resources_dir, path.basename(src));
            project.xcode.removeResourceFile(path.join('Resources', path.basename(src)));
            shell.rm('-rf', destFile);
        }
    },
    'framework':{ // CB-5238 custom frameworks only
        install:function(obj, plugin, project, options) {
            var src = obj.src,
                custom = obj.custom;
            if (!custom) {
                var keepFrameworks = keep_these_frameworks;

                if (keepFrameworks.indexOf(src) < 0) {
                    if (obj.type === 'podspec') {
                        //podspec handled in Api.js
                    } else {
                        project.frameworks[src] = project.frameworks[src] || 0;
                        project.frameworks[src]++;
                        project.xcode.addFramework(src, {weak: obj.weak});
                    }
                }
                return;
            }
            var srcFile = path.resolve(plugin.dir, src),
                targetDir = path.resolve(project.plugins_dir, plugin.id, path.basename(src));
            if (!fs.existsSync(srcFile)) throw new NodeKitError('Cannot find framework "' + srcFile + '" for plugin ' + plugin.id + ' in iOS platform');
            if (fs.existsSync(targetDir)) throw new NodeKitError('Framework "' + targetDir + '" for plugin ' + plugin.id + ' already exists in iOS platform');
            var link = !!(options && options.link);
            copyFile(plugin.dir, src, project.projectDir, targetDir, link); // frameworks are directories
            // CB-10773 translate back slashes to forward on win32
            var project_relative = fixPathSep(path.relative(project.projectDir, targetDir));
            var pbxFile = project.xcode.addFramework(project_relative, {customFramework: true});
            if (pbxFile) {
                project.xcode.addToPbxEmbedFrameworksBuildPhase(pbxFile);
            }
        },
        uninstall:function(obj, plugin, project, options) {
            var src = obj.src;

            if (!obj.custom) { //CB-9825 cocoapod integration for plugins
                var keepFrameworks = keep_these_frameworks;
                if (keepFrameworks.indexOf(src) < 0) {
                    if (obj.type === 'podspec') {
                        var podsJSON = require(path.join(project.projectDir, 'pods.json'));
                        if(podsJSON[src]) {
                            if(podsJSON[src].count > 1) {
                                podsJSON[src].count = podsJSON[src].count - 1;
                            } else {
                                delete podsJSON[src];
                            }
                        }
                    } else {
                        //this should be refactored
                        project.frameworks[src] = project.frameworks[src] || 1;
                        project.frameworks[src]--;
                        if (project.frameworks[src] < 1) {
                            // Only remove non-custom framework from xcode project
                            // if there is no references remains
                            project.xcode.removeFramework(src);
                            delete project.frameworks[src];
                        }
                    }
                }
                return;
            }

            var targetDir = fixPathSep(path.resolve(project.plugins_dir, plugin.id, path.basename(src))),
                pbxFile = project.xcode.removeFramework(targetDir, {customFramework: true});
            if (pbxFile) {
                project.xcode.removeFromPbxEmbedFrameworksBuildPhase(pbxFile);
            }
            shell.rm('-rf', targetDir);
        }
    },
    'lib-file': {
        install:function(obj, plugin, project, options) {
            events.emit('verbose', '<lib-file> install is not supported for iOS plugins');
        },
        uninstall:function(obj, plugin, project, options) {
            events.emit('verbose', '<lib-file> uninstall is not supported for iOS plugins');
        }
    },
    'asset':{
        install:function(obj, plugin, project, options) {
            if (!obj.src) {
                throw new NodeKitError(generateAttributeError('src', 'asset', plugin.id));
            }
            if (!obj.target) {
                throw new NodeKitError(generateAttributeError('target', 'asset', plugin.id));
            }

            copyFile(plugin.dir, obj.src, project.app, obj.target);
            if (options && options.usePlatformApp) copyFile(plugin.dir, obj.src, project.platformApp, obj.target);
        },
        uninstall:function(obj, plugin, project, options) {
            var target = obj.target;

            if (!target) {
                throw new NodeKitError(generateAttributeError('target', 'asset', plugin.id));
            }

            removeFile(project.app, target);
            removeFileF(path.resolve(project.app, 'plugins', plugin.id));
            if (options && options.usePlatformApp) {
                removeFile(project.platformApp, target);
                removeFileF(path.resolve(project.platformApp, 'plugins', plugin.id));
            }
        }
    },
    'js-module': {
        install: function (obj, plugin, project, options) {
            // Copy the plugin's files into the app directory.
            var moduleSource = path.resolve(plugin.dir, obj.src);
            var moduleName = plugin.id + '.' + (obj.name || path.basename(obj.src, path.extname (obj.src)));

            // Read in the file, prepend the nodekit.define, and write it back out.
            var scriptContent = fs.readFileSync(moduleSource, 'utf-8').replace(/^\ufeff/, ''); // Window BOM
            if (moduleSource.match(/.*\.json$/)) {
                scriptContent = 'module.exports = ' + scriptContent;
            }
            scriptContent = 'nodekit.define("' + moduleName + '", function(require, exports, module) {\n' + scriptContent + '\n});\n';

            var moduleDestination = path.resolve(project.app, 'plugins', plugin.id, obj.src);
            shell.mkdir('-p', path.dirname(moduleDestination));
            fs.writeFileSync(moduleDestination, scriptContent, 'utf-8');
            if (options && options.usePlatformApp) {
                var platformAppDestination = path.resolve(project.platformApp, 'plugins', plugin.id, obj.src);
                shell.mkdir('-p', path.dirname(platformAppDestination));
                fs.writeFileSync(platformAppDestination, scriptContent, 'utf-8');
            }
        },
        uninstall: function (obj, plugin, project, options) {
            var pluginRelativePath = path.join('plugins', plugin.id, obj.src);
            removeFileAndParents(project.app, pluginRelativePath);
            if (options && options.usePlatformApp) removeFileAndParents(project.platformApp, pluginRelativePath);
        }
    }
};

module.exports.getInstaller = function (type) {
    if (handlers[type] && handlers[type].install) {
        return handlers[type].install;
    }

    events.emit('warn', '<' + type + '> is not supported for iOS plugins');
};

module.exports.getUninstaller = function(type) {
    if (handlers[type] && handlers[type].uninstall) {
        return handlers[type].uninstall;
    }

    events.emit('warn', '<' + type + '> is not supported for iOS plugins');
};

function installHelper(type, obj, plugin_dir, project_dir, plugin_id, options, project) {
    var srcFile = path.resolve(plugin_dir, obj.src);
    var targetDir = path.resolve(project.plugins_dir, plugin_id, obj.targetDir || '');
    var destFile = path.join(targetDir, path.basename(obj.src));

    var project_ref;
    var link = !!(options && options.link);
    if (link) {
        var trueSrc = fs.realpathSync(srcFile);
        // Create a symlink in the expected place, so that uninstall can use it.
        if (options && options.force) {
            copyFile(plugin_dir, trueSrc, project_dir, destFile, link);
        } else {
            copyNewFile(plugin_dir, trueSrc, project_dir, destFile, link);
        }
        // Xcode won't save changes to a file if there is a symlink involved.
        // Make the Xcode reference the file directly.
        // Note: Can't use path.join() here since it collapses 'Plugins/..', and xcode
        // library special-cases Plugins/ prefix.
        project_ref = 'Plugins/' + fixPathSep(path.relative(fs.realpathSync(project.plugins_dir), trueSrc));
    } else {
        if (options && options.force) {
            copyFile(plugin_dir, srcFile, project_dir, destFile, link);
        } else {
            copyNewFile(plugin_dir, srcFile, project_dir, destFile, link);
        }
        project_ref = 'Plugins/' + fixPathSep(path.relative(project.plugins_dir, destFile));
    }

    if (type == 'header-file') {
        project.xcode.addHeaderFile(project_ref);
    } else if (obj.framework) {
        var opt = { weak: obj.weak };
        var project_relative = path.join(path.basename(project.xcode_path), project_ref);
        project.xcode.addFramework(project_relative, opt);
        project.xcode.addToLibrarySearchPaths({path:project_ref});
    } else {
        project.xcode.addSourceFile(project_ref, obj.compilerFlags ? {compilerFlags:obj.compilerFlags} : {});
    }
}

function uninstallHelper(type, obj, project_dir, plugin_id, options, project) {
    var targetDir = path.resolve(project.plugins_dir, plugin_id, obj.targetDir || '');
    var destFile = path.join(targetDir, path.basename(obj.src));

    var project_ref;
    var link = !!(options && options.link);
    if (link) {
        var trueSrc = fs.readlinkSync(destFile);
        project_ref = 'Plugins/' + fixPathSep(path.relative(fs.realpathSync(project.plugins_dir), trueSrc));
    } else {
        project_ref = 'Plugins/' + fixPathSep(path.relative(project.plugins_dir, destFile));
    }

    shell.rm('-rf', targetDir);

    if (type == 'header-file') {
        project.xcode.removeHeaderFile(project_ref);
    } else if (obj.framework) {
        var project_relative = path.join(path.basename(project.xcode_path), project_ref);
        project.xcode.removeFramework(project_relative);
        project.xcode.removeFromLibrarySearchPaths({path:project_ref});
    } else {
        project.xcode.removeSourceFile(project_ref);
    }
}

var pathSepFix = new RegExp(path.sep.replace(/\\/,'\\\\'),'g');
function fixPathSep(file) {
    return file.replace(pathSepFix, '/');
}

function copyFile (plugin_dir, src, project_dir, dest, link) {
    src = path.resolve(plugin_dir, src);
    if (!fs.existsSync(src)) throw new NodeKitError('"' + src + '" not found!');

    // check that src path is inside plugin directory
    var real_path = fs.realpathSync(src);
    var real_plugin_path = fs.realpathSync(plugin_dir);
    if (real_path.indexOf(real_plugin_path) !== 0)
        throw new NodeKitError('File "' + src + '" is located outside the plugin directory "' + plugin_dir + '"');

    dest = path.resolve(project_dir, dest);

    // check that dest path is located in project directory
    if (dest.indexOf(project_dir) !== 0)
        throw new NodeKitError('Destination "' + dest + '" for source file "' + src + '" is located outside the project');

    shell.mkdir('-p', path.dirname(dest));

    if (link) {
        symlinkFileOrDirTree(src, dest);
    } else if (fs.statSync(src).isDirectory()) {
        // XXX shelljs decides to create a directory when -R|-r is used which sucks. http://goo.gl/nbsjq
        shell.cp('-Rf', path.join(src, '/*'), dest);
    } else {
        shell.cp('-f', src, dest);
    }
}

// Same as copy file but throws error if target exists
function copyNewFile (plugin_dir, src, project_dir, dest, link) {
    var target_path = path.resolve(project_dir, dest);
    if (fs.existsSync(target_path))
        throw new NodeKitError('"' + target_path + '" already exists!');

    copyFile(plugin_dir, src, project_dir, dest, !!link);
}

function symlinkFileOrDirTree(src, dest) {
    if (fs.existsSync(dest)) {
        shell.rm('-Rf', dest);
    }

    if (fs.statSync(src).isDirectory()) {
        shell.mkdir('-p', dest);
        fs.readdirSync(src).forEach(function(entry) {
            symlinkFileOrDirTree(path.join(src, entry), path.join(dest, entry));
        });
    }
    else {
        fs.symlinkSync(path.relative(fs.realpathSync(path.dirname(dest)), src), dest);
    }
}

// checks if file exists and then deletes. Error if doesn't exist
function removeFile (project_dir, src) {
    var file = path.resolve(project_dir, src);
    shell.rm('-Rf', file);
}

// deletes file/directory without checking
function removeFileF (file) {
    shell.rm('-Rf', file);
}

function removeFileAndParents (baseDir, destFile, stopper) {
    stopper = stopper || '.';
    var file = path.resolve(baseDir, destFile);
    if (!fs.existsSync(file)) return;

    removeFileF(file);

    // check if directory is empty
    var curDir = path.dirname(file);

    while(curDir !== path.resolve(baseDir, stopper)) {
        if(fs.existsSync(curDir) && fs.readdirSync(curDir).length === 0) {
            fs.rmdirSync(curDir);
            curDir = path.resolve(curDir, '..');
        } else {
            // directory not empty...do nothing
            break;
        }
    }
}

function generateAttributeError(attribute, element, id) {
    return 'Required attribute "' + attribute + '" not specified in <' + element + '> element from plugin: ' + id;
}