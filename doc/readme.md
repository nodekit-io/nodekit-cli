---
title: CLI Reference
description: Learn how to use NodeKit CLI commands and their options.
---

<!--
#
# Licensed to OffGrid Networks (OGN) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  OGN licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->

# NodeKit Command-line-interface (CLI) Reference

## Syntax

```bash
nodekit <command> [options] -- [platformOpts]
```

## Global Command List

These commands are available at all times.

| Command  | Description
|----------|--------------
| create | Create a project
| help <command> | Get help for a command
| telemetry | Turn telemetry collection on or off

## Project Command List

These commands are supported when the current working directory is a valid NodeKit project.

| Command      | Description
|--------------|--------------
| info         | Generate project information
| requirements | Checks and print out all the installation requirements for platforms specified
| platform     | Manage project platforms
| plugin       | Manage project plugins
| prepare      | Copy files into platform(s) for building
| compile      | Build platform(s)
| clean        | Cleanup project from build artifacts
| run          | Run project (including prepare && compile)
| serve        | Run project with a local webserver (including prepare)

## Common options

These options apply to all nodekit-cli commands.

| Option               | Description
|----------------------|------------------------
| -d or --verbose      | Pipe out more verbose output to your shell. You can also subscribe to `log` and `warn` events if you are consuming `nodekit-cli` as a node module by calling `nodekit.on('log', function() {})` or `nodekit.on('warn', function() {})`.
| -v or --version      | Print out the version of your `nodekit-cli` install.
| --no-update-notifier | Will disable updates check. Alternatively set `"optOut": true` in `~/.config/configstore/update-notifier-nodekit.json` or set `NO_UPDATE_NOTIFIER` environment variable with any value (see details in [update-notifier docs](https://npmjs.com/package/update-notifier#user-settings)).
|--nohooks             | Suppress executing hooks (taking RegExp hook patterns as parameters)
| --no-telemetry       | Disable telemetry collection for the current command.

## Platform-specific options

Certain commands have options (`platformOpts`) that are specific to a particular platform. They can be provided to the nodekit-cli with a '--' separator that stops the command parsing within the nodekit-lib module and passes through rest of the options for platforms to parse.

## Examples
-  This example demonstrates how nodekit-cli can be used to create a project with the `camera` plugin and run it for `android` platform. In particular, platform specific options like `--keystore` can be provided:

        # Create a nodekit project
        nodekit create myApp com.myCompany.myApp myApp
        cd myApp
        # Add camera plugin to the project and remember that in config.xml
        nodekit plugin add nodekit-plugin-camera --save
        # Add camera plugin to the project and remember that in config.xml. Use npm install to fetch.
        nodekit plugin add nodekit-plugin-camera --save --fetch
        # Add android platform to the project and remember that in config.xml
        nodekit platform add android --save
        # Add android platform to the project and remember that in config.xml. Use npm install to fetch.
        nodekit platform add android --save --fetch
        # Check to see if your system is configured for building android platform.
        nodekit requirements android
        # Build the android and emit verbose logs.
        nodekit build android --verbose
        # Run the project on the android platform.
        nodekit run android
        # Build for android platform in release mode with specified signing parameters.
        nodekit build android --release -- --keystore="..\android.keystore" --storePassword=android --alias=mykey

## nodekit create command

### Synopsis

Create the directory structure for the NodeKit project in the specified path.

### Syntax

```
nodekit create path [id [name [config]]] [options]
```

| Value | Description   |
|-------|---------------|
| path  |  Directory which should not already exist. NodeKit will create this directory. For more details on the directory structure, see below. |
| id    | _Default_: `io.nodekit.hellonodekit` <br/>  Reverse domain-style identifier that maps to `id` attribute of `widget` element in `config.xml`. This can be changed but there may be code generated using this value, such as Java package names. It is recommended that you select an appropriate value.  |
| name  | _Default_: `HelloNodeKit` <br/> Application's display title that maps `name` element in `config.xml` file. This can be changed but there may be code generated using this value, such as Java class names. The default value is `HelloNodeKit`, but it is recommended that you select an appropriate value. |
| config | JSON string whose key/values will be included in `<path>`/.nodekit/config.json |

### Options

| Option | Description |
|--------|-------------|
| --template |  Use a custom template located locally, in NPM, or GitHub. |
| --copy-from\|--src | _Deprecated_ <br/> Use --template instead. Specifies a directory from which to copy the current NodeKit project. |
|--link-to | Symlink to specified `app` directory without creating a copy. |

### Directory structure

NodeKit CLI works with the following directory structure:

```
myapp/
|-- config.xml
|-- hooks/
|-- merges/
| | |-- android/
| | |-- windows/
| | |-- ios/
|-- app/
|-- platforms/
| |-- android/
| |-- windows/
| |-- ios/
|-- plugins/
  |--nodekit-plugin-camera/
```

#### config.xml

Configures your application and allows you to customize the behavior of your project. See also [config.xml reference documentation][config.xml ref]

#### app/

Contains the project's web artifacts, such as .html, .css and .js files. As a nodekit application developer, most of your code and assets will go here. They will be copied on a `nodekit prepare` to each platform's app directory. The app source directory is reproduced within each platform's subdirectory, appearing for example in `platforms/ios/app` or `platforms/android/assets/app`. Because the CLI constantly copies over files from the source app folder, you should only edit these files and not the ones located under the platforms subdirectories. If you use version control software, you should add this source app folder, along with the merges folder, to your version control system.

#### platforms/

Contains all the source code and build scripts for the platforms that you add to your project.

> **WARNING:** When using the CLI to build your application, you should not edit any files in the /platforms/ directory unless you know what you are doing, or if documentation specifies otherwise. The files in this directory are routinely overwritten when preparing applications for building, or when plugins are re-installed.

#### plugins/

Any added plugins will be extracted or copied into this directory.

#### hooks/

This directory may contains scripts used to customize nodekit-cli commands. Any scripts you add to these directories will be executed before and after the commands corresponding to the directory name. Useful for integrating your own build systems or integrating with version control systems.

Refer to [Hooks Guide] for more information.

#### merges/

Platform-specific web assets (HTML, CSS and JavaScript files) are contained within appropriate subfolders in this directory. These are deployed during a `prepare` to the appropriate native directory.  Files placed under `merges/` will override matching files in the `app/` folder for the relevant platform. A quick example, assuming a project structure of:

```
merges/
|-- ios/
| -- app.js
|-- android/
| -- android.js
app/
-- app.js
```

After building the Android and iOS projects, the Android application will contain both `app.js` and `android.js`. However, the iOS application will only contain an `app.js`, and it will be the one from `merges/ios/app.js`, overriding the "common" `app.js` located inside `app/`.

#### Version control

It is recommended not to check in `platforms/` and `plugins/` directories into version control as they are considered a build artifact. Instead, you should save the platform/plugin spec in the `config.xml` and they will be downloaded when on the machine when `nodekit prepare` is invoked.

### Examples

- Create a NodeKit project in `myapp` directory using the specified ID and display name:

        nodekit create myapp com.mycompany.myteam.myapp MyApp

- Create a NodeKit project with a symlink to an existing `app` directory. This can be useful if you have a custom build process or existing web assets that you want to use in your NodeKit app:

        nodekit create myapp --link-to=../app


## nodekit platform command

### Synopsis

Manage nodekit platforms - allowing you to add, remove, update, list and check for updates. Running commands to add or remove platforms affects the contents of the project's platforms directory.

### Syntax

```bash
nodekit {platform | platforms} [
    add <platform-spec> [...] {--save | link=<path> | --fetch } |
    {remove | rm}  platform [...] {--save | --fetch}|
    {list | ls}  |
    check |
    save |
    update ]
```

| Sub-command           | Option | Description |
------------------------|-------------|------|
| add `<platform-spec>` [...] |  | Add specified platforms |
|     | --save                   | Save `<platform-spec>` into `config.xml` after installing them using `<engine>` tag |
|     | --link=`<path>`          | When `<platform-spec>` is a local path, links the platform library directly instead of making a copy of it (support varies by platform; useful for platform development)
|     | --fetch                  | Fetches the platform using `npm install` and stores it into the apps `node_modules` directory |
| remove `<platform>` [...] |    | Remove specified platforms |
|     | --save                   | Delete specified platforms from `config.xml` after removing them |
|     | --fetch                  | Removes the platform using `npm uninstall` and removes it from the apps `node_modules` directory |
| update `platform` [...] |      | Update specified platforms |
|     | --save                   | Updates the version specified in `config.xml` |
|     | --fetch                  | Fetches the platform using `npm install` and stores it into the apps `node_modules` directory |
| list |                         | List all installed and available platforms |
| check |                        | List platforms which can be updated by `nodekit-cli platform update` |
| save  |                        | Save `<platform-spec>` of all platforms added to config.xml |

### Platform-spec

There are a number of ways to specify a platform:

```
<platform-spec> : platform[@version] | path | url[#commit-ish]
```

| Value | Description |
|-----------|-------------|
| platform  | Platform name e.g. android, ios, windows etc. to be added to the project. Every release of nodekit CLI pins a version for each platform. When no version is specified this version is used to add the platform. |
| version   | Major.minor.patch version specifier using semver |
| path      | Path to a directory or tarball containing a platform |
| url       | URL to a git repository or tarball containing a platform |
| commit-ish | Commit/tag/branch reference. If none is specified, 'master' is used |

### Supported Platforms

  * Amazon Fire OS
  * Android
  * macOS (OS X)
  * iOS
  * Ubuntu
  * Windows 10
  * Windows Classic

### Examples

- Add pinned version of the `android` and `ios` platform and save the downloaded version to `config.xml`:

        nodekit platform add android ios --save

- Add pinned version of the `android` and `ios` platform and save the downloaded version to `config.xml`. Install 
to the project using `npm install` and store it in the apps `node_modules` directory:

        nodekit platform add android ios --save --fetch

- Add `android` platform with [semver](http://semver.org/) version ^5.0.0 and save it to `config.xml`:

        nodekit platform add android@^5.0.0 --save

- Add platform by cloning the specified git repo and checkout to the `4.0.0` tag:

        nodekit platform add https://github.com/myfork/nodekit-android.git#4.0.0

- Add platform using a local directory named `android`:

        nodekit platform add ../android

- Add platform using the specified tarball:

        nodekit platform add ../nodekit-android.tgz

- Remove `android` platform from the project and from `config.xml`:

        nodekit platform rm android --save

- Remove `android` platform from the project and from `config.xml`. Run `npm uninstall` to remove it
from the `node_modules` directory.

        nodekit platform rm android --save --fetch

- List available and installed platforms with version numbers. This is useful to find version numbers when reporting issues:

        nodekit platform ls

- Save versions of all platforms currently added to the project to `config.xml`.

        nodekit platform save

## nodekit plugin command

### Synopsis

Manage project plugins

### Syntax

```bash
nodekit {plugin | plugins} [
    add <plugin-spec> [..] {--searchpath=<directory> | --noregistry | --link | --save | --browserify | --force | --fetch} |
    {remove | rm} {<pluginid> | <name>} --save --fetch |
    {list | ls} |
    search [<keyword>] |
    save |
]
```

| Sub-command | Option | Description
|------------------------|-------------|------
| add `<plugin-spec>` [...] |     | Add specified plugins
|       |--searchpath `<directory>` | When looking up plugins by ID, look in this directory and each of its subdirectories before hitting the registry. Multiple search paths can be specified. Use ':' as a separator in `*nix` based systems and ';' for Windows.
|       |--noregistry             | Don't search the registry for plugins.
|       |--link                   | When installing from a local path, creates a symbolic link instead of copying files. The extent to which files are linked varies by platform. Useful for plugin development.
|       |--save                   | Save the `<plugin-spec>` as part of the `plugin` element  into `config.xml`.
|       |--browserify             | Compile plugin JS at build time using browserify instead of runtime.
|       |--force                  | _Introduced in version 6.1._ Forces copying source files from the plugin even if the same file already exists in the target directory.
|       |--fetch                 | Fetches the plugin using `npm install` and stores it into the apps `node_modules` directory |
| remove `<pluginid>|<name>` [...]| | Remove plugins with the given IDs/name.
|       |--save                    | Remove the specified plugin from config.xml
|       |--fetch                  | Removes the plugin using `npm uninstall` and removes it from the apps `node_modules` directory |
|list                           |  | List currently installed plugins
|search `[<keyword>]` [...]     |  | Search http://plugins.nodekit.io for plugins matching the keywords
|save                           |  | Save `<plugin-spec>` of all plugins currently added to the project

### Plugin-spec

There are a number of ways to specify a plugin:

    <plugin-spec> : [@scope/]pluginID[@version]|directory|url[#commit-ish][:subdir]

| Value       | Description
|-------------|--------------------
| scope       | Scope of plugin published as a [scoped npm package]
| plugin      | Plugin id (id of plugin in npm registry or in --searchPath)
| version     | Major.minor.patch version specifier using semver
| directory   | Directory containing plugin.xml
| url         | Url to a git repository containing a plugin.xml
| commit-ish  | Commit/tag/branch reference. If none is specified, 'master' is used
| subdir      | Sub-directory to find plugin.xml for the specified plugin. (Doesn't work with `--fetch` option)

### Algorithm for resolving plugins

When adding a plugin to a project, the CLI will resolve the plugin
based on the following criteria (listed in order of precedence):

1. The `plugin-spec` given in the command (e.g. `nodekit plugin add pluginID@version`)
2. The `plugin-spec` saved in `config.xml` (i.e. if the plugin was previously added with `--save`)
3. As of NodeKit version 6.1, the latest plugin version published to npm that the current project can support (only applies to plugins that list their [NodeKit dependencies] in their `package.json`)
4. The latest plugin version published to npm

### Examples

- Add `nodekit-plugin-camera` and `nodekit-plugin-file` to the project and save it to `config.xml`. Use `../plugins` directory to search for the plugins.

        nodekit plugin add nodekit-plugin-camera nodekit-plugin-file --save --searchpath ../plugins

- Add `nodekit-plugin-camera` with [semver](http://semver.org/) version ^2.0.0 and save it to `config.xml`:

        nodekit plugin add nodekit-plugin-camera@^2.0.0 --save

- Add `nodekit-plugin-camera` with [semver](http://semver.org/) version ^2.0.0 and `npm install` it. It will be stored in the `node_modules` directory:

        nodekit plugin add nodekit-plugin-camera@^2.0.0 --fetch

- Clone the specified git repo, checkout to tag `2.1.0`, look for plugin.xml in the `plugin` directory, and add it to the project. Save the `plugin-spec` to `config.xml`:

        nodekit plugin add https://github.com/apache/nodekit-plugin-camera.git#2.1.0:plugin --save

- Add the plugin from the specified local directory:

        nodekit plugin add ../nodekit-plugin-camera

- Add the plugin from the specified tarball file:

        nodekit plugin add ../nodekit-plugin-camera.tgz --save

- Remove the plugin from the project and the `config.xml`:

        nodekit plugin rm camera --save

- Remove the plugin from the project and `npm uninstall` it. Removes it from the `node_modules` directory:

        nodekit plugin rm camera --fetch

- List all plugins installed in the project:

        nodekit plugin ls

## nodekit prepare command

### Synopsis

Transforms config.xml metadata to platform-specific manifest files, copies icons & splashscreens,
copies plugin files for specified platforms so that the project is ready to build with each native SDK.

### Syntax

```
nodekit prepare [<platform> [..]]
     [--browserify | --fetch]
```

###Options

| Option     | Description
|------------|------------------
| `<platform> [..]` | Platform name(s) to prepare. If not specified, all platforms are built.
|--browserify | Compile plugin JS at build time using browserify instead of runtime.
|--fetch | When restoring plugins or platforms, fetch will `npm install` the missing modules.


## nodekit compile command

### Synopsis

`nodekit compile` is a subset of the [nodekit build command](#nodekit-build-command).
It only performs the compilation step without doing prepare. It's common to invoke `nodekit build` instead of this command - however, this stage is useful to allow extending using [hooks][Hooks guide].

###Syntax

```bash
nodekit build [<platform> [...]]
    [--debug|--release]
    [--device|--emulator|--target=<targetName>]
    [--buildConfig=<configfile>]
    [--browserify]
    [-- <platformOpts>]
```
For detailed documentation see [nodekit build command](#nodekit-build-command) docs below.

## nodekit build command

### Synopsis

Shortcut for `nodekit prepare` + `nodekit compile` for all/the specified platforms. Allows you to build the app for the specified platform.

### Syntax

```bash
nodekit build [<platform> [...]]
    [--debug|--release]
    [--device|--emulator]
    [--buildConfig=<configfile>]
    [--browserify]
    [-- <platformOpts>]
```

| Option     | Description
|------------|------------------
| `<platform> [..]` | Platform name(s) to build. If not specified, all platforms are built.
| --debug    | Perform a debug build. This typically translates to debug mode for the underlying platform being built.
| --release  | Perform a release build. This typically translates to release mode for the underlying platform being built.
| --device   | Build it for a device
| --emulator | Build it for an emulator. In particular, the platform architecture might be different for a device Vs emulator.
| --buildConfig=`<configFile>` | Default: build.json in nodekit root directory. <br/> Use the specified build configuration file. `build.json` file is used to specify paramaters to customize the app build process esecially related to signing the package.
| --browserify | Compile plugin JS at build time using browserify instead of runtime
| `<platformOpts>` | To provide platform specific options, you must include them after `--` separator. Review platform guide docs for more details.

### Examples

- Build for `android` and `windows` platform in `debug` mode for deployment to device:

        nodekit build android windows --debug --device

- Build for `android` platform in `release` mode and use the specified build configuration:

        nodekit build android --release --buildConfig=..\myBuildConfig.json

- Build for `android` platform in release mode and pass custom platform options to android build process:

        nodekit build android --release -- --keystore="..\android.keystore" --storePassword=android --alias=mykey

## nodekit run command

### Synopsis

Prepares, builds, and deploys app on specified platform devices/emulators. If a device is connected it will be used, unless an eligible emulator is already running.

###Syntax

```bash
nodekit run [<platform> [...]]
    [--list | --debug | --release]
    [--noprepare] [--nobuild]
    [--device|--emulator|--target=<targetName>]
    [--buildConfig=<configfile>]
    [--browserify]
    [-- <platformOpts>]
```

| Option      | Description
|-------------|------------------
| `<platform> [..]` | Platform name(s) to run. If not specified, all platforms are run.
| --list      | Lists available targets. Displays both device and emulator deployment targets unless specified
| --debug     | Deploy a debug build. This is the default behavior unless `--release` is specified.
| --release   | Deploy a release build
| --noprepare | Skip preparing (available in NodeKit v6.2 or later)
| --nobuild   | Skip building
| --device    | Deploy to a device
| --emulator  | Deploy to an emulator
| --target    | Deploy to a specific target emulator/device. Use `--list` to display target options
| --buildConfig=`<configFile>` | Default: build.json in nodekit root directory. <br/> Use the specified build configuration file. `build.json` file is used to specify paramaters to customize the app build process esecially related to signing the package.
| --browserify | Compile plugin JS at build time using browserify instead of runtime
| `<platformOpts>` | To provide platform specific options, you must include them after `--` separator. Review platform guide docs for more details.

###Examples

- Run a release build of current nodekit project on `android` platform emulator named `Nexus_5_API_23_x86`. Use the spcified build configuration when running:

        nodekit run android --release --buildConfig=..\myBuildConfig.json --target=Nexus_5_API_23_x86

- Run a debug build of current nodekit project on `android` platform using a device or emulator (if no device is connected). Skip doing the build:

        nodekit run android --nobuild

- Run a debug build of current nodekit project on an `ios` device:

        nodekit run ios --device

- Enumerate names of all the connected devices and available emulators that can be used to run this app:

        nodekit run ios --list


## nodekit emulate command

### Synopsis

Alias for `nodekit run --emulator`. Launches the emulator instead of device.
See [nodekit run command docs](#nodekit-run-command) for more details.

## nodekit clean command

### Synopsis

Cleans the build artifacts for the specified platform, or all platforms by running platform-specific build cleanup.

### Syntax

```
nodekit clean [<platform> [...]]
```

### Example

- Clean `android` platform build artifiacts:

        nodekit clean android


## nodekit requirements command

### Synopsis

Checks and print out all the requirements for platforms specified (or all platforms added
to project if none specified). If all requirements for each platform are met, exits with code 0
otherwise exits with non-zero code.

This can be useful when setting up a machine for building a particular platform.

### Syntax

```
nodekit requirements android
```

## nodekit info command

### Synopsis

Print out useful information helpful for submitting bug
reports and getting help.  Creates an info.txt file at the
base of your project.

### Syntax

```
nodekit info
```

## nodekit serve command

### Synopsis

Run a local web server for app/ assets using specified `port` or default of 8000. Access projects at: `http://HOST_IP:PORT/PLATFORM/app`

### Syntax

```
nodekit serve [port]
```

## nodekit telemetry command

### Synopsis

Turns telemetry collection on or off.

### Syntax

```
nodekit telemetry [STATE]
```

| Option      | Description
|-------------|------------------
| on          | Turn telemetry collection on.
| off         | Turn telemetry collection off.

### Details
 A timed prompt asking the user to opt-in or out is displayed the first time nodekit is run.
 It lasts for 30 seconds, after which the user is automatically opted-out if he doesn't provide any answer.
 In CI environments, the `CI` environment variable can be set, which will prevent the prompt from showing up.
 Telemetry collection can also be turned off on a single command by using the `--no-telemetry` flag.

### Examples
```
nodekit telemetry on
nodekit telemetry off
nodekit build --no-telemetry
```

For details, see our privacy notice: https://nodekit.io/privacy

## nodekit help command

### Synopsis

Show syntax summary, or the help for a specific command.

### Syntax

```
nodekit help [command]
nodekit [command] -h
nodekit -h [command]
```

[Hooks guide]: http://nodekit.io/docs/en/latest/guide_appdev_hooks_index.md.html
[config.xml ref]: http://nodekit.io/docs/en/latest/config_ref/index.html
[NodeKit dependencies]: http://nodekit.io/docs/en/latest/guide/hybrid/plugins/index.html#specifying-project-requirements
[scoped npm package]: https://docs.npmjs.com/misc/scope
