#!/usr/bin/env node

/*
    Licensed to OffGrid Networks (OGN) under one
    or more contributor license agreements. See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership. OGN licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License. You may obtain a copy of the License at

        http://apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied. See the License for the
    specific language governing permissions and limitations
    under the License.
*/

// Custom Common Project Create script for NodeKit for iOS/macOS based on iOS (to include Workspaces)

var shell = require('shelljs'),
    Q = require ('q'),
    path = require('path'),
    fs = require('fs'),
    plist = require('plist'),
    ROOT = path.join(__dirname, '..', '..'),
    events = require('nodekit-cli')['nodekit-cli-common'].events,
    Podfile = require('../templates/scripts/nodekit-cli/lib/Podfile').Podfile,
    PodsJson = require('../templates/scripts/nodekit-cli/lib/PodsJson').PodsJson,
    check_reqs = require('./check_reqs'); 

function updateSubprojectHelp() {
    console.log('Updates the subproject path of the NKNodeKit entry to point to this script\'s version of NodeKit.');
    console.log('Usage: NodeKitVersion/bin/update_nodekit_project path/to/your/app.xcodeproj [path/to/NKNodeKit.xcodeproj]');
}

function setShellFatal(value, func) {
    var oldVal = shell.config.fatal;
    shell.config.fatal = value;
    func();
    shell.config.fatal = oldVal;
}

// NODEKIT: REMOVED copyJsAndNKNodeKit
function copyScripts(projectPath, projectName, opts) {
    var srcScriptsDir = path.join(ROOT, 'bin', 'templates', 'scripts', 'nodekit-cli');
    var destScriptsDir = path.join(projectPath, 'nodekit-cli');

    // Delete old scripts directory.
    shell.rm('-rf', destScriptsDir);

    // Copy in the new ones.
    var binDir = path.join(ROOT, 'bin');
    shell.cp('-r', srcScriptsDir, projectPath);
    /*NODEKIT*/ shell.cp('-r', path.join(ROOT, 'node_modules_bundle'), path.join(destScriptsDir, 'node_modules'));

    // Copy the check_reqs script
    // *NODEKIT shell.cp(path.join(binDir, 'check_reqs*'), destScriptsDir);
   shell.cp(path.join(binDir, 'lib', 'check_reqs.js'), path.join(destScriptsDir, 'lib'));

    // Copy the version scripts
    if (opts.platformDetails.platform == 'ios') 
    {    
        shell.cp(path.join(binDir, 'apple_ios_version'), destScriptsDir);
    }
    shell.cp(path.join(binDir, 'apple_osx_version'), destScriptsDir);
    shell.cp(path.join(binDir, 'apple_xcode_version'), destScriptsDir);
    shell.cp(path.join(binDir, 'lib', 'versions.js'),  path.join(destScriptsDir, 'lib'));

    // CB-11792 do a token replace for __PROJECT_NAME__ in .xcconfig
    var project_name_esc = projectName.replace(/&/g, '\\&');
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(destScriptsDir, 'build-debug.xcconfig'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(destScriptsDir, 'build-release.xcconfig'));

    // Make sure they are executable (sometimes zipping them can remove executable bit)
    shell.find(destScriptsDir).forEach(function(entry) {
        shell.chmod(755, entry);
    });
}

/*
 * Copy project template files into nodekit project.
 *
 * @param {String} project_path         path to nodekit project
 * @param {String} project_name         name of nodekit project
 * @param {String} project_template_dir path to nodekit-platform-  template directory
 * @parm  {BOOL}   use_cli              true if cli project
 */
function copyTemplateFiles(project_path, project_name, project_template_dir, package_name) {
    var r = path.join(project_path, project_name);

    shell.rm('-rf', path.join(r+'.xcodeproj'));
    shell.cp('-rf', path.join(project_template_dir, '__TEMP__.xcodeproj'), project_path);
    shell.mv('-f', path.join(project_path, '__TEMP__.xcodeproj'), path.join(r+'.xcodeproj'));

    shell.rm('-rf', path.join(project_path, project_name+'.xcodeworkspace'));
    shell.cp('-rf', path.join(project_template_dir, '__TEMP__.xcworkspace'), project_path);
    shell.mv('-f', path.join(project_path, '__TEMP__.xcworkspace'), path.join(r+'.xcworkspace'));
    shell.mv('-f', path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', '__PROJECT_NAME__.xcscheme'), path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', project_name+'.xcscheme'));

    // NODEKIT: Copy Podfile for NKNodeKit
    shell.rm('-rf', path.join(project_path , 'Podfile'));
    shell.cp('-rf', path.join(project_template_dir, 'Podfile'), project_path);

    shell.rm('-rf', r);
    shell.cp('-rf', path.join(project_template_dir, '__PROJECT_NAME__'), project_path);
    shell.mv('-f', path.join(project_path, '__PROJECT_NAME__'), r);

    shell.mv('-f', path.join(r, '__PROJECT_NAME__-Info.plist'), path.join(r, project_name+'-Info.plist'));
    shell.mv('-f', path.join(r, 'gitignore'), path.join(r, '.gitignore'));

    /*replace __PROJECT_NAME__ and --ID-- with ACTIVITY and ID strings, respectively, in:
     *
     * - ./__PROJECT_NAME__.xcodeproj/project.pbxproj
     * - ./__PROJECT_NAME__/Classes/AppDelegate.h
     * - ./__PROJECT_NAME__/Classes/AppDelegate.m
     * - ./__PROJECT_NAME__/Classes/MainViewController.h
     * - ./__PROJECT_NAME__/Classes/MainViewController.m
     * - ./__PROJECT_NAME__/Resources/main.m
     * - ./__PROJECT_NAME__/Resources/__PROJECT_NAME__-info.plist
     * - ./__PROJECT_NAME__/Resources/__PROJECT_NAME__-Prefix.plist
     */
    var project_name_esc = project_name.replace(/&/g, '\\&');
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r+'.xcodeproj', 'project.pbxproj'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r+'.xcworkspace', 'contents.xcworkspacedata'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r+'.xcworkspace', 'xcshareddata', 'xcschemes', project_name +'.xcscheme'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, project_name+'-Info.plist'));
    shell.sed('-i', /--ID--/g, package_name, path.join(r, project_name+'-Info.plist'));
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(r, 'main.swift'));
  
    // NODEKIT: Update Podfile for PROJECT_NAME target
    shell.sed('-i', /__PROJECT_NAME__/g, project_name_esc, path.join(project_path, 'Podfile'));
}

function install_Pods(project_dir, package_name, project_name, opts) {
    
            events.emit('verbose', 'Adding pods for NKNodeKit');
            var podfileFile = new Podfile(path.join(project_dir, Podfile.FILENAME), project_name); 
            return podfileFile.install(check_reqs.check_cocoapods);
}

function detectProjectName(projectDir) {
    var files = fs.readdirSync(projectDir);
    for (var i = 0; i < files.length; ++i) {
        var m = /(.*)\.xcodeproj$/.exec(files[i]);
        if (m) {
            return m[1];
        }
    }
    throw new Error('Could not find an .xcodeproj directory within ' + projectDir);
}

function AbsParentPath(_path) {
    return path.resolve(path.dirname(_path));
}

function AbsProjectPath(relative_path) {
    var absolute_path = path.resolve(relative_path);
    if (/.pbxproj$/.test(absolute_path)) {
        absolute_path = AbsParentPath(absolute_path);
    }
    else if (!(/.xcodeproj$/.test(absolute_path))) {
        throw new Error('The following is not a valid path to an Xcode project: ' + absolute_path);
    }
    return absolute_path;
}

function relpath(_path, start) {
    start = start || process.cwd();
    return path.relative(path.resolve(start), path.resolve(_path));
}

/*
 * Creates a new Xcode project with the following options:
 *
 * - --link (optional): Link directly against the shared copy of the NKNodeKit instead of a copy of it
 * - --cli (optional): Use the CLI-project template
 * - <path_to_new_project>: Path to your new NodeKit project
 * - <package_name>: Package name, following reverse-domain style convention
 * - <project_name>: Project name
 * - <project_template_dir>: Path to a project template (override)
 *
 */
exports.createProject = function(project_path, package_name, project_name, opts) {
    package_name = package_name || 'my.nodekit.project';
    project_name = project_name || 'NodeKitExample';
    var use_shared = !!opts.link;
    var bin_dir = path.join(ROOT, 'bin'),
        project_parent = path.dirname(project_path);
    var project_template_dir = opts.customTemplate || path.join(bin_dir, 'templates', 'project');

    //check that project path doesn't exist
    if (fs.existsSync(project_path)) {
        return Q.reject('Project already exists');
    }

    //check that parent directory does exist so cp -r will not fail
    if (!fs.existsSync(project_parent)) {
        return Q.reject('Parent directory "' + project_parent + '" of given project path does not exist');
    }
    events.emit('log', 'Creating NodeKit project for the ' + opts.platformDetails.platform + ' platform:');
    events.emit('log', '\tPath: ' + path.relative(process.cwd(), project_path));
    events.emit('log', '\tPackage: ' + package_name);
    events.emit('log', '\tName: ' + project_name);

    events.emit('verbose', 'Copying XCode template project to ' + project_path);

    // create the project directory and copy over files
    shell.mkdir(project_path);
    // *NODEKIT*  shell.cp('-rf', path.join(project_template_dir, 'app'), project_path);

    //Copy project template files
    copyTemplateFiles(project_path, project_name, project_template_dir, package_name);

    // Copy xcconfig files
    shell.cp('-rf', path.join(project_template_dir, '*.xcconfig'), project_path);

    //NKNodeKit stuff
    // *NODEKIT* copyJsAndNKNodeKit(project_path, project_name, use_shared);
    copyScripts(project_path, project_name, opts);
    // install pods
   
    events.emit('log', generateDoneMessage('create', use_shared, opts));

    return install_Pods(project_path, package_name, project_name, opts);
};

exports.updateProject = function(projectPath, opts) {
    var projectName = detectProjectName(projectPath);
    var project_template_dir = path.join(ROOT, 'bin', 'templates', 'project');
    //Get package_name from existing projectName-Info.plist file
    var package_name = plist.parse(fs.readFileSync(path.join(projectPath, projectName, projectName+'-Info.plist'), 'utf8')).CFBundleIdentifier;
    setShellFatal(true, function() {
        copyTemplateFiles(projectPath, projectName, project_template_dir, package_name);
        copyScripts(projectPath, projectName, opts);
        events.emit('log',generateDoneMessage('update', opts.link, opts));
    });
    return Q.resolve();
};

function generateDoneMessage(type, link, opts) {
    var pkg = require('../../package');
    var msg = opts.platformDetails.platform + ' project ' + (type == 'update' ? 'updated ' : 'created ') + 'with ' + pkg.name + '@' + pkg.version;
    return msg;
}
