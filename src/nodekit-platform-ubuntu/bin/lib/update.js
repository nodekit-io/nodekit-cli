#!/usr/bin/env node

/*
 *
 * Copyright 2013, 2014 Canonical Ltd.    
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
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

var shell = require('shelljs');
var path = require('path');
var fs = require('fs');

var ROOT = path.join(__dirname, '..', '..');

exports.updateProject = function(projectPath) {
    if (!fs.existsSync(projectPath)) {
        console.error('Project does not exist!');
        process.exit(1);
    }

    shell.rm('-r', path.join(projectPath, 'app'));
    shell.mkdir(path.join(projectPath, 'app'));
    shell.cp(path.join(ROOT, 'app', 'nodekit.js'), path.join(projectPath, 'app'));

    shell.rm('-r', path.join(projectPath, 'nodekit-cli'));

    // Copy the necessary node modules.
    shell.cp('-r', path.join(ROOT, 'node_modules'), path.join(projectPath, 'nodekit-cli'));

    // Checking requirements needs to be copied as well.
    shell.cp('-r', path.join(ROOT, 'bin/check_reqs'), path.join(projectPath, 'nodekit-cli'));
    shell.cp('-r', path.join(ROOT, 'bin', 'lib', 'check_reqs.js'), path.join(projectPath, 'nodekit-cli', 'lib'));

    // Copy the default template including the defaults_nodekit.json for the Ubuntu platform.
    shell.cp('-r', path.join(ROOT, 'bin', 'templates', 'project', 'nodekit-cli'), projectPath);

    var tmp = path.join(projectPath, 'tmp');
    shell.mkdir(tmp);

    var pluginsDir = path.join(projectPath, 'build', 'src', 'plugins');
    var coreplugins = path.join(projectPath, 'build', 'src', 'coreplugins.cpp');
    shell.mv(coreplugins, tmp);
    shell.mv(pluginsDir, tmp);
    shell.rm('-r', path.join(projectPath, 'build'));

    shell.cp('-r', path.join(ROOT, '*'), path.join(projectPath, 'build'));

    shell.rm('-r', coreplugins);
    shell.rm('-r', pluginsDir);
    shell.mv(path.join(tmp, 'plugins'), path.join(projectPath, 'build', 'src'));
    shell.mv(path.join(tmp, 'coreplugins.cpp'), path.join(projectPath, 'build', 'src'));

    shell.rm('-r', tmp);
    console.log('project updated');
}
