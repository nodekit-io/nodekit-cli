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
  ;

module.exports = {
      parseElementtreeSync: function (filename) {
        var contents = fs.readFileSync(filename, 'utf-8');
        if(contents) {
            //Windows is the BOM. Skip the Byte Order Mark.
            contents = contents.substring(contents.indexOf('<'));
        }
        return new et.ElementTree(et.XML(contents));
    },
    writeJsonFromXml: function (filename, contents) {
       fs.writeFileSync(filename, contents.write({indent: 4}), 'utf-8');
    }
}