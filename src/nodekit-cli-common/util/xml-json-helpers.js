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

/* jshint sub:true, laxcomma:true */

/**
 * contains XML utility functions, some of which are specific to elementtree
 */

var fs = require('fs')
    , path = require('path')
    , _ = require('underscore')
    , et = require('elementtree')

var xml2js = require('xml2js');


module.exports = {
    parseElementtreeSync: function (filename) {
        if (path.extname(filename) == '.json')
            return readJsontoXml(filename);
        else
            return readXmltoXml(filename);
    },
    writeJsonFromXml: function (filename, contents) {
        if (path.extname(filename) == '.json')
            writeXmlToJson(filename, contents)
        else
            writeXmlToXml(filename, contents)
    }
}

function readXmltoXml(filePath) {
    var contents = fs.readFileSync(filename, 'utf-8');
    if (contents) {
        //Windows is the BOM. Skip the Byte Order Mark.
        contents = contents.substring(contents.indexOf('<'));
    }
    return new et.ElementTree(et.XML(contents));
}

function readJsontoXml(filePath) {
    var x2js2 = new xml2js.Builder({
        rootName: "widget",
        attrkey: '$',
        charkey: 'value',
        trim: true,
        normalize: true,
        normalizeTags: false,
        explicitRoot: false,
        explicitArray: false,
        mergeAttrs: true
    });

    var jsonObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    var jsonObj = _render(jsonObj);
    var contents = x2js2.buildObject(jsonObj);
    if (contents) {
        //Windows is the BOM. Skip the Byte Order Mark.
        contents = contents.substring(contents.indexOf('<'));
    }
    return new et.ElementTree(et.XML(contents));
}


function writeXmlToJson(filePath, contents) {
    var x2js = new xml2js.Parser({
        attrkey: '$',
        charkey: 'value',
        trim: true,
        normalize: true,
        normalizeTags: false,
        explicitRoot: false,
        explicitArray: false,
        attrNameProcessors: [function (name) { return "$" + name }],
        mergeAttrs: true,
        async: false
    });

    var xmlStr = contents.write({ indent: 4 });
    x2js.parseString(xmlStr, function (e, jsonObj) {
        var contents = JSON.stringify(jsonObj, null, 4);
        fs.writeFileSync(filePath, contents, 'utf-8');
    })
}

function writeXmlToXml(filePath, contents) {
   fs.writeFileSync(filename, contents.write({ indent: 4 }), 'utf-8');
}

function _render(obj) {
    var attr, child, entry, index, key, value;
    if (typeof obj !== 'object') {
        return obj;
    } else {
        for (key in obj) {
            if (!Object.hasOwnProperty.call(obj, key)) continue;
            child = obj[key];
            if (key.startsWith('$')) {
                obj['$'] = obj['$'] || {};
                obj['$'][key.substr(1)] = _render(child);
                delete obj[key];
            } else
                obj[key] = _render(child)
        }
        return obj;
    };
}
