/*
* nodekit.io
*
* Copyright (c) 2016-7 OffGrid Networks. All Rights Reserved.
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

var gulp = require('gulp');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var del = require('del');
var filter = require('gulp-filter');
var path = require('path');
var multimatch = require('multimatch');
var fs = require('fs');
var es = require('event-stream');

gulp.task("clean", function () {
    return del([
        'packages',
        'bin',
        'doc',
        'scripts',
        'src'
    ]);
})

function refreshPackageFromTemplate(srcPackage, packageName, dependencies)
{
    var srcPackageJson = require(path.join(srcPackage, "package.json"));
    var template = require(path.resolve(path.join('./templates-build', packageName, "package.json")));
  
    template.dependencies = srcPackageJson.dependencies;
    delete template.dependencies["cordova-common"];

    if (dependencies)
    {
        dependencies.forEach(function(item){
            var depVersion = require(path.resolve(path.join('./packages', item, 'package.json'))).version;
            template.dependencies["nodekit-scripts-common"] = JSON.stringify(depVersion);
        })
    }

    template.version = srcPackageJson.version;
    template.name = packageName;
    fs.writeFileSync(
        path.join('./packages', packageName, 'package.json'),
        JSON.stringify(template, null, 2)
    );
}

function refreshPackageVersion(packageName)
{
    var srcPackageJson = require(path.resolve("./package.json"));
    var template = require(path.resolve(path.join('./packages', packageName, "package.json")));
    template.version = srcPackageJson.version;
    fs.writeFileSync(
        path.join('./packages', packageName, 'package.json'),
        JSON.stringify(template, null, 2)
    );
}

function map(src, dest, cb) {
    var f = filter(['**',
        '!node_modules/**/spec/**',
        '!node_modules/**/tests/**',
        '!node_modules/**/test/**',
        '!node_modules/**/node_modules/**',
        '!node_modules/**/guides/**',
        '!node_modules/*-android/framework/src/org/apache/**',
        '!node_modules/**/*-js-src/**', '!node_modules/**/template/www/**',
        '!node_modules/**/CordovaLib/**',
        '!node_modules/*-android/bin/templates/project/**',
        '!node_modules/*-ios/bin/templates/project/**',
        '!node_modules/cordova-lib/src/cordova/metadata/**',
        '!node_modules/cordova-lib/src/platforms/PlatformApiPoly.js',
        '!**/*.bat', '!**/*_plist_to_config_xml', '!**/autotest', '!**/diagnose_project',
        '!node_modules/**/template*/**/cordova/build', '!node_modules/**/template*/**/cordova/clean',
        '!node_modules/**/template*/**/cordova/log',
        '!node_modules/**/template*/**/cordova/loggingHelper.*', '!node_modules/**/template*/**/cordova/run',
        '!node_modules/*/bin/check_reqs', '!node_modules/*/bin/create', '!node_modules/*/bin/update',
        '!node_modules/*/bin/test'
    ]);
    var f2 = filter(['**', '!**/*.png'], { restore: true });

    gulp.src(src, { nodir: true })
        .pipe(f)
        .pipe(f2)
        .pipe(replace(/cordova/ig, function (match) { return matchCase("nodekit", match); }))
        .pipe(replace(/require\(["']nodekit-common["']\)/ig, "require('nodekit-scripts').common")) 
        .pipe(replace(/require\(["']nodekit-fetch["']\)/ig, "require('nodekit-scripts')['nodekit-scripts-fetch']")) 
        .pipe(replace(/nodekit-fetch/g, "nodekit-scripts-fetch"))
        .pipe(replace(/require\(["']nodekit-create["']\)/ig, "require('nodekit-scripts').['nodekit-scripts-create']"))
        .pipe(replace(/require\(["']nodekit-lib["']\)/ig, "require('nodekit-scripts').lib"))
        .pipe(replace(/require\(["']nodekit-serve["']\)/ig, "require('nodekit-scripts').['nodekit-scripts-serve']"))
        .pipe(replace(/require\(["']nodekit-registry-mapper["']\)/ig, "require('cordova-registry-mapper')"))
        .pipe(replace(/require\('nodekit-js/ig, "require('cordova-js"))
        .pipe(replace(/cordova-js-src/ig, "nodekit-js-src"))
        .pipe(replace(/ios android wp7 wp8 blackberry www/g, "ios macos android windows nodejs"))
        .pipe(replace(/android     blackberry  ios         wp8         www/ig, "android     macos       ios         windows     nodejs"))
        .pipe(replace(/http:\/\/www\./g, "http://"))
        .pipe(replace(/Apache NodeKit /ig, "NodeKit "))
        .pipe(replace(/path\.relative\(nodekitProject\.root, destinations\.platformWww\)/g, "/* , NodeKit removed platform_app */"))
        .pipe(replace(/shell\.cp\('-rf', path\.join\(destinations\.platformWww, '\*'\), destinations\.www\);/g, "// NodeKit removed platform_app"))
        .pipe(replace(/shell\.cp\('-rf', path\.join\(nodekitProject\.locations\.www, '\*'\), destinations\.www\);/g, "shell.cp('-rf', path.join(nodekitProject.locations.app, 'dist', '*'), destinations.app);"))
        .pipe(replace(/path\.relative\(nodekitProject\.root, nodekitProject\.locations\.www\)/g, "path.relative(nodekitProject.root, path.join(nodekitProject.locations.app, 'dist'))"))
        .pipe(replace(/nodekit\.apache\.org/ig, "nodekit.io"))
        .pipe(replace(/org\.apache\.nodekit/ig, "io.nodekit"))
        .pipe(replace(/org_apache_nodekit/ig, "io_nodekit"))
        .pipe(replace(/the Apache Software Foundation \(ASF\)/ig, "OffGrid Networks (OGN)"))
        .pipe(replace(/The ASF licenses/ig, "OGN licenses"))
        .pipe(replace(/nodekit-app-hello-world/ig, "nodekit-sample"))
        .pipe(replace(/GA_TRACKING_CODE = '.+'/ig, "GA_TRACKING_CODE = 'UA-85195988-1'"))
        .pipe(replace(/__CDV_ORGANIZATION_NAME__/ig, "__ORGANIZATION_NAME__"))
        .pipe(replace(/PlatformApi = require\('\.\.\/platforms\/PlatformApiPoly'\)/g, "return Q.reject(new NodeKitError('Missing Api.js for platform and polyfill no longer supported.'))"))
        .pipe(replace(/PlatformApiPoly =/g, "// PlatformApiPoly ="))
        .pipe(replace(/\&\& \!\(platformApi instanceof PlatformApiPoly\)/g, "&& true /* NODEKIT */"))
        .pipe(replace(/PlatformApi = require\('\.\/PlatformApiPoly'\)/g, "throw new Error('Current location does not contain a valid NodeKit Platform')"))
        .pipe(replace(/gradle-2\.13-all.zip/ig, "gradle-2.14.1-all.zip"))
        .pipe(replace(/,\s?'nodekit'/g, ", 'nodekit-scripts'"))
        .pipe(replace(/,\s?'nodekit\//g, ", 'nodekit-scripts/"))
        .pipe(replace(/'nodekit'\sfolder/g, "'nodekit-scripts' folder"))
        .pipe(replace(/["']\.\/src\//g, "'./"))
        .pipe(replace(/\.\.\/src\/cli/g, "../scripts/cli"))
        .pipe(replace(/var platMatch = \/\^nodekit\-/g,"var platMatch = /^nodekit-scripts-platform-"))
        .pipe(replace(/require\('\.\.\/\.\.\/lib\/create'\)/g, "require('../lib/create')"))
        .pipe(replace(/require\('\.\.\/\.\.\/\.\.\/lib\/create'\)/g, "require('../lib/create')"))
        .pipe(replace(/Path to your new NodeKit iOS project/g, "Path to your new NodeKit project"))
        .pipe(replace(/, 'nodekit-scripts', '\.\/nodekit\/nodekit'/g, ", 'nodekit', './nodekit-scripts/nodekit'"))
        .pipe(replace(/ROOT, 'framework'/g, "ROOT, 'bin', 'templates', 'framework'"))
        .pipe(replace(/\/nodekit\//g, "/nodekit-scripts/"))
        .pipe(replace(/shell\.cp\('\-r', path\.join\(ROOT, 'node_modules'\), destScriptsDir\)/ig, "// shell.cp('-r', path.join(ROOT, 'node_modules_bundle'), path.join(destScriptsDir, 'node_modules'))"))
        .pipe(replace(/shell\.cp\('-r', path\.join\(project_template_dir, 'assets'\), project_path\)/ig, "/*NODEKIT*/  shell.mkdir('-p', path.join(project_path, 'assets'));  shell.cp('-r', path.join(project_template_dir, 'assets'), project_path)"))
        .pipe(replace(/shell\.cp\('-r', path\.join\(project_template_dir, 'res'\), project_path\)/ig, "/*NODEKIT*/ shell.mkdir('-p', path.join(project_path, 'res')); shell.cp('-r', path.join(project_template_dir, 'res'),  project_path)"))
        .pipe(replace(/'nodekit-'\s?\+\s?/g, "'nodekit-scripts-platform-' + "))
        .pipe(replace(/if \(opts\.fetch\)/g, "if (true /* NODEKIT always uses fetch */ )"))
      /*  .pipe(replace(/return downloadPlatform\(projectRoot, platform, spec, opts\)/ig, `// NODEKIT-START
                    if (platform && platforms[platform].template) {
                        var maybeDir = require('nodekit-scripts').platforms[platforms[platform].template];
                        return getPlatformDetailsFromDir(maybeDir, platform)
                    }
                    // NODEKIT-END
                    return downloadPlatform(projectRoot, platform, spec, opts);`)) */
        .pipe(replace(/shell\.mkdir\(path\.join\(dir, 'plugins'\)\)\;/ig, `shell.mkdir(path.join(dir, 'plugins'));

        //NODEKIT-START
        if (!fs.existsSync(path.join(dir, 'node_modules'))) {
            shell.mkdir(path.join(dir, 'node_modules'));
            var nodekit_scripts_dir = path.resolve(__dirname, "../../..");
            var nodekit_scripts_js = 'module.exports = require("' + nodekit_scripts_dir + '");'; 
            fs.writeFileSync(path.join(dir, 'node_modules', 'nodekit-scripts.js'), nodekit_scripts_js, 'utf8');
        }
        //NODEKIT-END`))
        .pipe(replace(/\.\.\/NodeKitLib\/NodeKitLib\.xcodeproj/ig, "NodeKitLib/NodeKitLib.xcodeproj"))
        .pipe(replace(/path = NodeKitLib\.xcodeproj; sourceTree = NODEKITLIB;/ig, 'name = NodeKitLib.xcodeproj; path = NodeKitLib/NodeKitLib.xcodeproj; sourceTree = "<group>";'))
        .pipe(replace(/nodekitlib/ig, function (match) { return matchCase("nknodekit", match); }))
        .pipe(replace(/app www./g, " project app."))
        .pipe(replace(/app_www/g, "project_app"))
        .pipe(replace(/Www/g, "App"))
        .pipe(replace(/www/g, "app"))
        .pipe(replace(/undashed\[2\]/g, "undashed[2] || 'org.example.' + undashed[1]"))
        .pipe(replace(/undashed\[3\]/g, "undashed[3] || undashed[1]"))
        .pipe(replace(/\.\.\/\.\.\/package/g, "../../package"))
        .pipe(replace(/var pkg = require\('\.\.\/\.\.\/\.\.\/package'\);/g, "var pkg = require('../../package');"))
        .pipe(replace(/SWIFT_OBJC_BRIDGING_HEADER =/g, "// *NODEKIT* SWIFT_OBJC_BRIDGING_HEADER ="))
        .pipe(replace(/CODE_SIGN_ENTITLEMENTS =/g, "// *NODEKIT* CODE_SIGN_ENTITLEMENTS ="))
        .pipe(replace(/config\.xml/g, "nodekit.json"))
        .pipe(replace(/Config\.xml/g, "nodekit.json"))
        .pipe(replace(/config_xml/g, "nodekit_json"))
        .pipe(replace(/config xml/g, "nodekit json"))
        .pipe(replace(/configxml/g, "nodekitjson"))
        .pipe(replace(/configXML/g, "nodekitJson"))
        .pipe(replace(/Configxml/g, "NodeKitJson"))
        .pipe(replace(/configXml/g, "nodekitJson"))
        .pipe(replace(/ConfigXML/g, "NodeKitJson"))
        .pipe(replace(/ConfigXml/g, "NodeKitJson"))
        .pipe(replace(/config\/xml/g, "nodekit/json"))
        .pipe(replace(/defaults.xml/g, "defaults_nodekit.json"))
        .pipe(replace(/res\/xml\/nodekit/g, "res/raw/nodekit"))
        .pipe(f2.restore)
        .pipe(rename(function (path) {
            path.basename = indexify(path);
            path.dirname = (path.dirname == "src") ? "packages/nodekit-scripts/scripts" : path.dirname;
            path.dirname = (path.dirname == "scripts") ? "packages/nodekit-scripts/bash-completion" : path.dirname;
            path.dirname = path.dirname.startsWith('doc') ? "packages/nodekit-scripts/" + path.dirname : path.dirname;
            path.dirname = path.dirname.replace(/cordova/ig, function (match) { return matchCase("nodekit", match); });
            path.basename = path.basename.replace(/cordova/ig, function (match) { return matchCase("nodekit", match); });
            path.dirname = path.dirname.replace(/nodekitlib/ig, function (match) { return matchCase("nknodekit", match); });
            path.basename = path.basename.replace(/nodekitlib/ig, function (match) { return matchCase("nknodekit", match); });
            path.dirname = (path.dirname + '/').replace(/\bnodekit\//g, "nodekit-scripts/");
            path.dirname = path.dirname.replace(/^template\//ig, "bin/templates/");
            path.dirname = path.dirname.replace(/bin\/templates\/nodekit-scripts/ig, "bin/nodekit-scripts");
            path.dirname = path.dirname.replace(/bin\/templates\/scripts\/nodekit-scripts/ig, "bin/nodekit-scripts");
            path.dirname = path.dirname.replace(/bin\/templates\/project\/nodekit-scripts/ig, "bin/nodekit-scripts");
            path.dirname = path.dirname.replace(/^framework/ig, "bin/templates/framework");
            path.dirname = path.dirname.replace(/^bin\/templates\/$/ig, "bin/templates/project/");
            path.dirname = path.dirname.replace(/^bin\/templates\/images\/$/ig, "bin/templates/project/images/");
            path.dirname = path.dirname.replace(/^[qml|xml]/ig, function (match) { return "bin/templates/project/" + match });
            if ((path.extname == '.xml') && (path.basename == 'defaults')) {
                path.extname = '.json';
                path.basename = 'defaults_nodekit'
            }
            if ((path.extname == '.xml') && (path.basename == 'config')) {
                path.extname = '.json';
                path.basename = 'nodekit'
            }
            if (path.dirname == 'bin/' && path.basename == 'nodekit') {
                path.dirname = "packages/nodekit-scripts/bin"
                path.basename = 'nodekit-scripts'
            }
    
        }))
        .pipe(gulp.dest(dest))
        .on('end', cb);
}


gulp.task('srccopy1', ['cli'], function () {
    gulp.src("./templates-build/doc/**/*")
        .pipe(gulp.dest('./packages/nodekit-scripts/doc'));
})

gulp.task("srccopy2", ['scripts-lib', 'scripts-common', 'scripts-fetch', 'scripts-serve', 'scripts-create', 'android', 'ios', 'macos', 'windows'], function (cb) {
    es.concat(
    gulp.src(["./templates-build/nodekit-scripts-platform*/**/*",
        "./templates-build/nodekit-scripts*/**/*"])
        .pipe(gulp.dest('./packages')),
   
    gulp.src("./templates-build/nodekit-cli/*")
        .pipe(gulp.dest('./packages/nodekit-cli')),
    
    gulp.src("./templates-build/nodekit-common-platform-darwin/**/*")
        .pipe(gulp.dest('./packages/nodekit-scripts-platform-ios')),
 
    gulp.src("./templates-build/nodekit-common-platform-darwin/**/*")
        .pipe(gulp.dest('./packages/nodekit-scripts-platform-macos'))
          ).on('end', cb);
})

gulp.task("packageCopy", ["srccopy2"], function() {
     refreshPackageFromTemplate('cordova-osx', 'nodekit-scripts-platform-macos');
     refreshPackageFromTemplate('cordova-ios', 'nodekit-scripts-platform-ios');
     refreshPackageFromTemplate('cordova-android', 'nodekit-scripts-platform-android');
     refreshPackageFromTemplate('cordova-windows', 'nodekit-scripts-platform-windows');
     refreshPackageVersion('nodekit-scripts');
})

gulp.task('cli', map.bind(null, './node_modules/cordova/*/**', '.'));

gulp.task("scripts-lib", map.bind(null, ["./node_modules/cordova-lib/src/**/*", "./node_modules/cordova-lib/cordova-lib.js"], 'packages/nodekit-scripts/lib'));
gulp.task("scripts-common", map.bind(null, ["./node_modules/cordova-common/src/**/*", "./node_modules/cordova-common/cordova-common.js"], 'packages/nodekit-scripts/common'));
gulp.task("scripts-fetch", map.bind(null, "./node_modules/cordova-fetch/index.js", 'packages/nodekit-scripts/lib/nodekit-scripts-fetch'));
gulp.task("scripts-serve", map.bind(null, ["./node_modules/cordova-serve/src/**/*", "./node_modules/cordova-serve/serve.js"], 'packages/nodekit-scripts/lib/nodekit-scripts-serve'));
gulp.task("scripts-create", map.bind(null, "./node_modules/cordova-create/index.js", 'packages/nodekit-scripts/lib/nodekit-scripts-create'));

gulp.task("android", map.bind(null, "./node_modules/cordova-android/*/**", 'packages/nodekit-scripts-platform-android'));
gulp.task("ios", map.bind(null, "./node_modules/cordova-ios/*/**", 'packages/nodekit-scripts-platform-ios'));
gulp.task("macos1", map.bind(null, "./node_modules/cordova-ios/*/**", "packages/nodekit-scripts-platform-macos")); /* NOTE COPIED FROM IOS NOT OSX */
gulp.task("macos2", ["macos1"], map.bind(null, "./node_modules/cordova-osx/bin/templates/scripts/**/*", "packages/nodekit-scripts-platform-macos/bin")); /* NOTE SCRIPTS COPIED FROM OSX */
gulp.task("macos", ["macos1", "macos2"])
gulp.task("windows", map.bind(null, "./node_modules/cordova-windows/*/**", 'packages/nodekit-scripts-platform-windows'));

gulp.task('refactor', ['cli', 'srccopy1', 'scripts-lib', 'scripts-common', 'scripts-fetch', 'scripts-serve', 'scripts-create', 'android', 'ios', 'macos', 'windows', 'srccopy2', 'packageCopy']);

function matchCase(text, pattern) {
    if (pattern == "Cordova" && text == "nodekit") return "NodeKit";
    if (pattern == "NodeKitLib" && text == "nknodekit") return "NKNodeKit";
    if (pattern == "NODEKITLIB" && text == "nknodekit") return "NKNODEKIT";

    var result = '';

    for (var i = 0; i < text.length; i++) {
        var c = text.charAt(i);
        var p = pattern.charCodeAt(i);

        if (p >= 65 && p < 65 + 26) {
            result += c.toUpperCase();
        } else {
            result += c.toLowerCase();
        }
    }

    return result;
}

function indexify(path) {
    if (path.dirname == "." && (path.basename == 'serve' || path.basename == 'cordova-common' || path.basename == 'cordova-lib'))
        return 'index'
    else
        return path.basename;
}



//     .pipe(replace(/updateWww\(nodekitProject, this\.locations\)/g, "/* NODEKIT */ true"))
