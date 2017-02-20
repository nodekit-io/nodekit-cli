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
var fs = require('fs'),
    nodekit_lib = require('nodekit-scripts').lib,
    nodekit = nodekit_lib.nodekit,
    Q = require('q'),
    path = require('path');

module.exports = function help (args) {
    var command,
        file,
        raw,
        docdir;
    args = args || [];
    command = ((args)[0] || 'nodekit');
    docdir = path.join(__dirname, '..', 'doc');
    file = [
      command + '.md',
      command + '.txt',
      'nodekit.md',
      'nodekit.txt',
    ].map(function (file) {
        var f = path.join(docdir, file);
        if (fs.existsSync(f)) {
           return f;
        }
        return null;
    }).filter(function (f) {
        return f !== null;
    });
    raw = fs.readFileSync(file[0]).toString('utf8').replace(/nodekit-cli/g, nodekit_lib.binname);
    nodekit.emit('results', raw);
    return Q();
};
