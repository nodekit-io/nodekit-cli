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

var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    shell = require('shelljs'),
    et = require('elementtree'),
    NodeKitError  = require('nodekit-cli')['nodekit-cli-common'].NodeKitError,
    stripLicense = require('./util/strip-license');


module.exports = function create( name, id, version, pluginPath, options ) {
    var cwd = pluginPath + '/' + name + '/',
        templatesDir = path.join(__dirname, '..', '..', 'templates/'),
        baseJS,
        root,
        pluginName,
        clobber,
        jsMod;

    // Check we are not already in a plugin
    if( fs.existsSync( cwd + 'plugin.xml' ) ) {
        return Q.reject( new NodeKitError( 'plugin.xml already exists. Are you already in a plugin?' ) );
    }

    // Create a plugin.xml file
    root = et.Element( 'plugin' );
    root.set( 'xmlns', 'http://apache.org/nodekit-cli/ns/plugins/1.0' );
    root.set( 'xmlns:android', 'http://schemas.android.com/apk/res/android' );
    root.set( 'id', id );
    root.set( 'version', version );

    // Add the name tag
    pluginName = et.XML( '<name>' );
    pluginName.text = name;
    root.append( pluginName );

    // Loop through the options( variables ) for other tags
    for( var key in options ) {
        var temp = et.XML( '<' + key + '>');
        temp.text = options[ key ];
        root.append( temp );
    }

    // Setup the directory structure
    shell.mkdir( '-p', cwd + 'app' );
    shell.mkdir( '-p', cwd + 'src' );

    // Create a base plugin.js file
    baseJS = stripLicense.fromCode(fs.readFileSync(templatesDir + 'base.js', 'utf-8').replace(/%pluginName%/g, name));
    fs.writeFileSync( cwd + 'app/' + name + '.js', baseJS, 'utf-8' );
    // Add it to the xml as a js module
    jsMod = et.Element( 'js-module' );
    jsMod.set( 'src', 'app/' + name + '.js' );
    jsMod.set( 'name', name );

    clobber = et.Element( 'clobbers' );
    clobber.set( 'target', 'nodekit.plugins.' + name );
    jsMod.append( clobber );

    root.append( jsMod );

    // Write out the plugin.xml file
    fs.writeFileSync( cwd + 'plugin.xml', new et.ElementTree( root ).write( {indent: 4} ), 'utf-8' );

    return Q();
};
