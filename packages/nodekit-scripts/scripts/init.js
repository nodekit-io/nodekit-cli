/*
* nodekit.io
*
* Copyright (c) 2016-7 OffGrid Networks. All Rights Reserved.
* Portions Copyright 2012 The Apache Software Foundation
* Portions Copyright 2015-Present Facebook 
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var fs = require('fs-extra');
var path = require('path');
var spawn = require('cross-spawn');
var chalk = require('chalk');
var shell = require('shelljs');

module.exports = function (appPath, appName, verbose, originalDirectory, template) {

    var ownPackageName = require(path.join(__dirname, '..', 'package.json')).name;
    var ownPath = path.join(appPath, 'node_modules', ownPackageName);

    // Check for template and if we dont have it then download it

    var template = template || 'nodekit-sample';

    var templatePath = path.resolve(path.join(appPath, 'node_modules', template))

    if (!fs.existsSync(templatePath)) {

        console.log("Downloading project template for " + chalk.green(template));
        console.log();
        install(appPath, [template], verbose, true, function (code, command, args) {

            if (code !== 0) {
                console.error('`' + command + ' ' + args.join(' ') + '` failed');
                process.exit(1);
            }

            if (!fs.existsSync(templatePath)) {
                console.error('`' + command + ' ' + args.join(' ') + '` succeeeded but cannot find template at ' + chalk.red(templatePath));
                process.exit(1);
            }

            copyFromTemplate(appName, appPath, templatePath, verbose);
            updatePackageJson(appName, appPath, templatePath, verbose);
            initDependencies(appName,appPath, templatePath, originalDirectory, verbose);
        });
    } else {
        copyFromTemplate(appName, appPath, templatePath, verbose);
        updatePackageJson(appName, appPath, templatePath, verbose);
        initDependencies(appName, appPath, templatePath, originalDirectory, verbose);
    }
};

/**
 * Copies template files, and directories into a NodeKit project directory.
 * If the template is a app folder, the app folder is simply copied
 * Otherwise if the template exists in a subdirectory everything is copied
 * Otherwise package.json, RELEASENOTES.md, .git, NOTICE, LICENSE, COPYRIGHT, and .npmignore are not copied over.
 * A template directory, and project directory must be passed.
 * templateDir - Template directory
 * appPath - Project directory
 * isSubDir - boolean is true if template has subdirectory structure (see code around line 229)
 */
function copyFromTemplate(appName, appPath, input_directory, verbose) {

    var cfg = {id: "org.example." + appName, name: appName};

    var templateDir = input_directory;

    //handle when input wants to specify sub-directory (specified in index.js as "dirname" export); 
    var isSubDir = false;
    try {
        // Delete cached require incase one exists
        delete require.cache[require.resolve(input_directory)];
        var templatePkg = require(input_directory);
        if (templatePkg && templatePkg.dirname) {
            templateDir = templatePkg.dirname;
            isSubDir = true;
        }
    } catch (e) {
        isSubDir = false;
    }

    console.log("Installing template files from " + chalk.green(path.relative(appPath, templateDir)))
    console.log();

    if (!fs.existsSync(templateDir)) {
        console.error('Could not find template directory:  ' + chalk.red(templateDir));
        process.exit(1);
    }

    var dirAlreadyExisted = fs.existsSync(appPath);
    if (!dirAlreadyExisted) {
        console.error('AppDirectory does not exist ' + chalk.red(appPath));
        process.exit(1);
    }

    try {
        shellCopyTemplateFiles(templateDir, appPath, isSubDir);

        // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
        // See: https://github.com/npm/npm/issues/1862
        fs.move(path.join(appPath, 'gitignore'), path.join(appPath, '.gitignore'), [], function (err) {
            if (err) {
                // Append if there's already a `.gitignore` file there
                if (err.code === 'EEXIST') {
                    var data = fs.readFileSync(path.join(appPath, 'gitignore'));
                    fs.appendFileSync(path.join(appPath, '.gitignore'), data);
                    fs.unlinkSync(path.join(appPath, 'gitignore'));
                } else {
                    fs.copy(path.join(templateDir, '.npmignore'), path.join(appPath, '.gitignore'), function (err) {
                        if (err) {
                            console.error( err);
                        }
                    });
                }
            }
        });

    } catch (e) {
        if (!dirAlreadyExisted) {
            shell.rm('-rf', appPath);
        }
        if (process.platform.slice(0, 3) == 'win' && e.code == 'EPERM') {
            throw new NodeKitError('Symlinks on Windows require Administrator privileges');
        }
        throw e;
    }

    // Create basic project structure.
    if (!fs.existsSync(path.join(appPath, 'platforms')))
        shell.mkdir(path.join(appPath, 'platforms'));

    if (!fs.existsSync(path.join(appPath, 'plugins')))
        shell.mkdir(path.join(appPath, 'plugins'));

    if (!fs.existsSync(path.join(appPath, 'hooks')))
        shell.mkdir(path.join(appPath, 'hooks'));

    // Just like npm 'require-self' does, create a script in node_modules from nodekit-scripts to self
    var requiresSelf = path.join(appPath, 'node_modules', 'nodekit-scripts.js');
    if (!fs.existsSync(requiresSelf)) {
        var nodekit_scripts_dir = path.resolve(__dirname, "..");
        var nodekit_scripts_js = 'module.exports = require("' + nodekit_scripts_dir + '");';
        fs.writeFileSync(path.join(appPath, 'node_modules', 'nodekit-scripts.js'), nodekit_scripts_js, 'utf8');
    }

    // Setup nodekit.json
    var ConfigParser = require('nodekit-scripts').common.ConfigParser;
    var configPath = path.join(appPath, 'nodekit.json');
    // Write out id and name to nodekit.json; set version to 1.0.0 (to match package.json default version)
    var conf = new ConfigParser(configPath);
    conf.setPackageName(cfg.id);
    conf.setName(cfg.name);
    conf.setVersion('1.0.0');
    conf.write();
}

function updatePackageJson(appName, appPath, templatePath, verbose) {

    var appPackage = require(path.join(appPath, 'package.json'));
    var templatePackage = require(path.join(templatePath, 'package.json'));

    // Setup the dependencies and scripts
    appPackage.dependencies = appPackage.dependencies || {};
    appPackage.devDependencies = appPackage.devDependencies || {};
    appPackage.scripts = templatePackage.scripts;
    appPackage.directories = templatePackage.directories;

    // shallow merge scripts, no replace
    for (var attrname in templatePackage.scripts) {
        if (!appPackage.scripts[attrname])
            appPackage.scripts[attrname] = templatePackage.scripts[attrname];
    }

    // shallow merge dependencies, no replace
    for (var attrname in templatePackage.dependencies) {
        if (!appPackage.dependencies[attrname])
            appPackage.dependencies[attrname] = templatePackage.dependencies[attrname];
    }

    // shallow merge devdependencies, no replace
    for (var attrname in templatePackage.devDependencies) {
        if (!appPackage.devDependencies[attrname])
            appPackage.devDependencies[attrname] = templatePackage.devDependencies[attrname];
    }

    // reverse shallow merge nodekit config (reverse, as appPackage is still shallow, we dont know about template)
    for (var attrname in appPackage.nodekit) {
        if (appPackage.nodekit.hasOwnProperty(attrname))
            templatePackage.nodekit[attrname] = appPackage.nodekit[attrname];
    }
    appPackage.nodekit = templatePackage.nodekit;

    fs.writeFileSync(
        path.join(appPath, 'package.json'),
        JSON.stringify(appPackage, null, 2)
    );
}

function initDependencies( appName, appPath,templatePath, originalDirectory, verbose) {

    console.log('Installing dependencies from ' + chalk.green('package.json') + '...');
    console.log();

    installAll(appPath, verbose, function (code, command, args) {

        if (code !== 0) {
            console.error('`' + command + ' ' + args.join(' ') + '` failed');
            process.exit(1);
        }

        // Display the most elegant way to cd.
        var cdpath;
        if (originalDirectory &&
            path.join(originalDirectory, appName) === appPath) {
            cdpath = appName;
        } else {
            cdpath = appPath;
        }

        console.log();
        console.log('Success! Created ' + appName + ' at ' + appPath);
        console.log('Inside that directory, you can run several commands:');
        console.log();
        console.log(chalk.cyan('  ' + command + ' run platform -- add <platform>'));
        console.log('    Adds a platform (e.g., ios, macos, android, windows)');
        console.log();
        console.log(chalk.cyan('  ' + command + ' run build'));
        console.log('    Bundles the app and builds the native components');
        console.log();
        console.log(chalk.cyan('  ' + command + ' start'));
        console.log('    Runs the app');
        console.log();
        console.log(chalk.cyan('  ' + command + ' jstest'));
        console.log('    Starts the javascript test runner.');
        console.log();
        console.log('We suggest that you begin by typing:');
        console.log();
        console.log(chalk.cyan('  cd'), cdpath);
        var platformRecommended =  (process.platform === 'win32') ? 'windows' : 'macos'
        console.log('  ' + chalk.cyan(command + ' run platform -- add ' + platformRecommended));
        console.log('  ' + chalk.cyan(command + ' run build'));
        console.log('  ' + chalk.cyan(command + ' start'));
        console.log();
        console.log('Happy offgrid\'n!');
    }); 

}

/**
 * Recursively copies folder to destination if folder is not found in destination (including symlinks).
 * @param  {string} src for copying
 * @param  {string} dst for copying
 * @return No return value
 */
function copyIfNotExists(src, dst) {
    if (!fs.existsSync(dst) && src) {
        shell.mkdir(dst);
        shell.cp('-R', path.join(src, '*'), dst);
    }
}

/**
 * Copies template files, and directories into a NodeKit project directory.
 * If the template is a app folder, the app folder is simply copied
 * Otherwise if the template exists in a subdirectory everything is copied
 * Otherwise package.json, RELEASENOTES.md, .git, NOTICE, LICENSE, COPYRIGHT, and .npmignore are not copied over.
 * A template directory, and project directory must be passed.
 * templateDir - Template directory
 * appPath - Project directory
 * isSubDir - boolean is true if template has subdirectory structure
 */
function shellCopyTemplateFiles(templateDir, appPath, isSubDir) {

    var readmeExists = fs.existsSync(path.join(appPath, 'README.md'));
    if (readmeExists) {
        fs.renameSync(path.join(appPath, 'README.md'), path.join(appPath, 'README.old.md'));
    }

    var copyPath;
    // if template is a app dir
    if (path.basename(templateDir) === 'app') {
        copyPath = path.resolve(templateDir);
        shell.cp('-R', copyPath, appPath);
    } else {
        var templateFiles;      // Current file
        templateFiles = fs.readdirSync(templateDir);
        // Remove directories, and files that are unwanted
        if (!isSubDir) {
            var excludes = ['package.json', 'RELEASENOTES.md', '.git', 'NOTICE', 'LICENSE', 'COPYRIGHT', '.npmignore'];
            templateFiles = templateFiles.filter(function (value) {
                return excludes.indexOf(value) < 0;
            });
        }
        // Copy each template file after filter
        for (var i = 0; i < templateFiles.length; i++) {
            copyPath = path.resolve(templateDir, templateFiles[i]);
            shell.cp('-R', copyPath, appPath);
        }
    }
}

function install(appPath, packagesToInstall, verbose, dev, callback) {

    var useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

    var command;
    var args;
    if (useYarn) {
        command = 'yarnpkg';
        args = ['add', '--exact'];
        if (dev)
            args.push('--dev');
    } else {
        command = 'npm';
        args = ['install', '--save-exact'];
        if (dev)
            args.push('--save-dev')
        else
            args.psh('--save')
    }

    if (verbose) {
        args.push('--verbose');
    }

    args.push(packagesToInstall);

    var child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', function (code) {
        callback(code, command, args);
    });
}

function installAll(appPath, verbose, callback) {

    var useYarn = fs.existsSync(path.join(appPath, 'yarn.lock'));

    var command;
    var args;
    if (useYarn) {
        command = 'yarnpkg';
        args = ['install'];
    } else {
        command = 'npm';
        args = ['install'];
    }

    if (verbose) {
        args.push('--verbose');
    }

    var child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', function (code) {
        callback(code, command, args);
    });
}