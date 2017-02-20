![http://nodekit.io](https://raw.githubusercontent.com/nodekit-io/nodekit/master/docs/images/banner.png?v02)
*{NK} NodeKit* is the universal, open-source, embedded engine that provides a full Node.js instance inside desktop and mobile applications for macOS, iOS, Android, and Windows. 

This repository provides a command line interface to create a new **{NK} NodeKit** skeleton app for any or all of the target platforms, and/or
wraps an existing Node.js, desktop or web application in a **{NK} NodeKit** package that can be deployed to each of the appropriate app stores.

See [nodekit.io](http://nodekit.io) for further details on **{NK} NodeKit**

# {NK} NodeKit Command Line

[![Join the chat at https://gitter.im/nodekit-io/nodekit](https://img.shields.io/badge/Chat-on_gitter-46BC99.svg?style=flat)](https://gitter.im/nodekit-io/nodekit?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![{NK} Roadmap](https://img.shields.io/badge/OpenSource-roadmap-4DA6FD.svg?style=flat-square)](http://roadmap.nodekit.io)
[![Twitter Follow](https://img.shields.io/twitter/follow/nodekitio.svg?style=social)](https://twitter.com/nodekitio)

## Installation

Make sure you have Node.js installed (between v4 and v6).

Optimal: install Node.js version 6.7 or later and npm 3.10 or later using nvm

``` bash
npm install -g nodekit
```

## Create and run a nodekit application

``` bash
nodekit create myApp
cd myApp
nodekit platform add macos
nodekit build
nodekit run
``` 

## Target Platforms

| Platform  | Supported  |
|---|---|
| android  |  In Testing |
| ios |  Supported  |
| macos  |  Supported |
| windows  |  In progress |
| ubuntu  |  Not started |
| nodejs  |  Not started |

## License

Apache 2.0

## Related Repositories on GitHub
* [nodekit-io/nodekit](https://github.com/nodekit-io/nodekit) contains the core documents and issues tracker
* [nodekit-io/nodekit-cli](https://github.com/nodekit-io/nodekit-cli) contains the command line tool
* [nodekit-io/nodekit-darwin](https://github.com/nodekit-io/nodekit-darwin), [nodekit-io/nodekit-windows](https://github.com/nodekit-io/nodekit-windows), and [nodekit-io/nodekit-android](https://github.com/nodekit-io/nodekit-android) contain the platform specific versions of {NK} NodeKit Source

## Use of Cordova Command Line Tooling

Note that the command line interface for creating, building and running platforms is adapted from the Cordova Command line interface.  The platforms
directory will contain some files forked from the Cordova repositories but these are only used during the build phase, and the Cordova engine is not included in the
NodeKit runtime engine.  We do this because XCode, Visual Studio and Android Studio continue to evolve their build pipelines and project file structures,
and so we can get the benefits of all the hard work that goes into cordova-cli, cordova-lib and cordova-common.

Automatic refactor and patch from cordova-cli repository

``` bash
npm install
gulp clean
gulp refactor
```
