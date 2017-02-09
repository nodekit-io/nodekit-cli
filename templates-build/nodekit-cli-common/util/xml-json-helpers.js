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

var xml2js = require('xml2js'),
    xml2js_processors = require('xml2js/lib/processors');

var NAMEVALUES = {
    'preference': 'value',
    'param': 'value',
    'engine': 'spec',
    'plugin': 'spec'
};
var SINGLETONS = { 'allow-intent': '$href' };
var ATTRIBUTES = require('./widget.json');
var NAMEOBJECTS = ['platform'];

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
    },
    writeJsonFromXsd: function (filename, contents) {
        writeXsdToJson(filename, contents);
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
    jsonObj = _unsimplify("widget", jsonObj);
    jsonObj = _promoteAttributes(jsonObj);
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
        attrValueProcessors: [xml2js_processors.parseNumbers, xml2js_processors.parseBooleans],
        mergeAttrs: true,
        async: false
    });

    var xmlStr = contents.write({ indent: 4 });
    x2js.parseString(xmlStr, function (e, jsonObj) {
        jsonObj = _simplify("widget", jsonObj);
        var contents = JSON.stringify(jsonObj, null, 4);
        fs.writeFileSync(filePath, contents, 'utf-8');
    })
}

function writeXsdToJson(filePath, contents) {
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
        var XSD = {};
        jsonObj = _simplify_xsd(XSD, jsonObj);
        fs.writeFileSync(filePath, JSON.stringify(XSD, null, 4), 'utf-8');
    })
}

function writeXmlToXml(filePath, contents) {
    fs.writeFileSync(filename, contents.write({ indent: 4 }), 'utf-8');
}

function _simplify(parent, obj) {
    var attr, child, entry, index, key, value;
    if (typeof obj !== 'object') {
        return obj;
    } else {
        for (key in obj) {
            if (!Object.hasOwnProperty.call(obj, key)) continue;
            child = obj[key];
            if (key.startsWith('$') && ATTRIBUTES[parent] && ATTRIBUTES[parent].includes(key.substr(1))) {
                obj[key.substr(1)] = _simplify(key, child);
                delete obj[key];
            } else if (SINGLETONS[key]) {
                var decode = SINGLETONS[key];
                var singletonresult = [];
                objectMap(child, function (entry) {
                    singletonresult.push(entry[decode])
                })
                delete obj[key];
                obj[key] = singletonresult;
            } else if (NAMEOBJECTS.includes(key)) {
                var nameobjectresult = {};
                objectMap(child, function (entry) {
                    index = entry['$name'];
                    delete entry['$name'];
                    nameobjectresult[index] = _simplify(key, entry);
                })
                delete obj[key];
                obj[key] = nameobjectresult;
            } else if (NAMEVALUES[key]) {
                var valueitem = '$' + NAMEVALUES[key];
                var namevalueresult = {};
                objectMap(child, function (entry) {
                    namevalueresult[entry['$name']] = entry[valueitem];
                });
                delete obj[key];
                obj[key] = namevalueresult;
            } else {
                if (Array.isArray(child)) {
                    for (index in child) {
                        if (!Object.hasOwnProperty.call(child, index)) continue;
                        entry = child[index];
                        if (typeof entry === 'string') {
                            // no change
                        } else {
                            child[index] = _simplify(key, entry);
                        }
                        delete obj[key];
                        obj[key] = child;
                    }
                } else if (typeof child === "object") {
                    delete obj[key];
                    obj[key] = _simplify(key, child)
                } else {
                    delete obj[key];
                    obj[key] = child;
                }
            }
        }

        return obj;
    };
}

function _simplify_xsd(XSD, obj) {
    var attr, child, entry, index, key, value;

    if (typeof obj !== 'object') {
        return obj;
    } else {
        for (key in obj) {
            if (!Object.hasOwnProperty.call(obj, key)) continue;

            child = obj[key];
            if (key == "xs:element") {
                if (Array.isArray(child)) {
                    for (index in child) {
                        if (!Object.hasOwnProperty.call(child, index)) continue;
                        entry = child[index];
                        if (entry["xs:complexType"] && entry["xs:complexType"]["xs:attribute"]) {
                            objectMap(entry["xs:complexType"]["xs:attribute"], function (attrentry) {
                                if (attrentry["$name"]) {
                                    XSD[entry["$name"]] = XSD[entry["$name"]] || [];
                                    XSD[entry["$name"]].push(attrentry["$name"])
                                }
                            });
                        }
                    }
                } else {
                    entry = child;
                    if (entry["xs:complexType"] && entry["xs:complexType"]["xs:attribute"]) {
                        objectMap(entry["xs:complexType"]["xs:attribute"], function (attrentry) {
                            if (attrentry["$name"]) {
                                XSD[entry["$name"]] = XSD[entry["$name"]] || [];
                                XSD[entry["$name"]].push(attrentry["$name"])
                            }
                        })
                    }
                }
            }
            if (Array.isArray(child)) {
                for (index in child) {
                    if (!Object.hasOwnProperty.call(child, index)) continue;
                    entry = child[index];
                    if (typeof entry === 'string') {
                        // no change
                    } else {
                        child[index] = _xsd(XSD, entry);
                    }
                }
            } else if (typeof child === "object") {
                delete obj[key];
                obj[key] = _xsd(XSD, child)
            } else {
                entry = obj[key];
                delete obj[key];
                obj[key] = entry;
            }

        }
        return obj;
    };
}

function _unsimplify(parent, obj) {
    var attr, child, entry, index, key, value;
    if (typeof obj !== 'object') {
        return obj;
    } else {
        for (key in obj) {
            if (!Object.hasOwnProperty.call(obj, key)) continue;

            child = obj[key];
            if (ATTRIBUTES[parent] && ATTRIBUTES[parent].includes(key)) {
                obj['$' + key] = _unsimplify(key, child);
                delete obj[key];
            } else if (SINGLETONS[key]) {
                var decode = SINGLETONS[key];
                var singletonresult = [];
                objectMap(child, function (entry) {
                    singletonresult.push({ [decode]: entry })
                })
                delete obj[key];
                obj[key] = singletonresult;
            } else if (NAMEOBJECTS.includes(key)) {
                var nameobjectresult = [];
                for (index in child) {
                    if (!Object.hasOwnProperty.call(child, index)) continue;
                    entry = _unsimplify(key, child[index]);
                    entry['$name'] = index;
                    nameobjectresult.push(entry);
                }
                delete obj[key];
                obj[key] = nameobjectresult;
            } else if (NAMEVALUES[key]) {
                var decode = '$' + NAMEVALUES[key];
                var namevalueresult = [];
                for (index in child) {
                    if (!Object.hasOwnProperty.call(child, index)) continue;
                    entry = child[index];
                    namevalueresult.push({ "$name": index, [decode]: entry })
                }
                delete obj[key];
                obj[key] = namevalueresult;
            } else if (Array.isArray(child)) {
                for (index in child) {
                    if (!Object.hasOwnProperty.call(child, index)) continue;
                    entry = child[index];
                    if (typeof entry === 'string') {
                        // no change
                    } else {
                        child[index] = _unsimplify(key, entry);
                    }
                }
                delete obj[key];
                obj[key] = child;
            } else if (typeof child === "object") {
                delete obj[key];
                obj[key] = _unsimplify(key, child)
            } else {
                delete obj[key];
                obj[key] = child;
                // no change for string etc
            }
        }
    }

    return obj;
}

function _promoteAttributes(obj) {
    var attr, child, entry, index, key, value;
    if (typeof obj !== 'object') {
        return obj;
    } else {
        for (key in obj) {
            if (!Object.hasOwnProperty.call(obj, key)) continue;

            child = obj[key];

            if (key.startsWith('$')) {
                obj['$'] = obj['$'] || {};
                obj['$'][key.substr(1)] = _promoteAttributes(child);
                delete obj[key];
            } else {
                if (Array.isArray(child)) {
                    for (index in child) {
                        if (!Object.hasOwnProperty.call(child, index)) continue;
                        entry = child[index];
                        if (typeof entry === 'string') {
                            // no change
                        } else {
                            child[index] = _promoteAttributes(entry);
                        }
                    }
                } else if (typeof child === "object") {
                    obj[key] = _promoteAttributes(child)
                } else {
                    // no change for string etc
                }
            }
        }

        return obj;
    };
}

function objectMap(obj, func, valuefunc) {
    if (Array.isArray(obj)) {
        for (index in obj) {
            if (!Object.hasOwnProperty.call(obj, index)) continue;
            func(obj[index]);
        }
    } else if (typeof obj === 'object') {
        func(obj);
    } else if (valuefunc) {
        valuefunc(obj);
    }
}