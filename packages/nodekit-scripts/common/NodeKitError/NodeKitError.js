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

/* jshint proto:true */

var EOL = require('os').EOL;

/**
 * A derived exception class. See usage example in cli.js
 * Based on:
 * stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/8460753#8460753
 * @param {String} message Error message
 * @param {Number} [code=0] Error code
 * @param {NodeKitExternalToolErrorContext} [context] External tool error context object
 * @constructor
 */
function NodeKitError(message, code, context) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code || NodeKitError.UNKNOWN_ERROR;
    this.context = context;
}
NodeKitError.prototype.__proto__ = Error.prototype;

// TODO: Extend error codes according the projects specifics
NodeKitError.UNKNOWN_ERROR = 0;
NodeKitError.EXTERNAL_TOOL_ERROR = 1;

/**
 * Translates instance's error code number into error code name, e.g. 0 -> UNKNOWN_ERROR
 * @returns {string} Error code string name
 */
NodeKitError.prototype.getErrorCodeName = function() {
    for(var key in NodeKitError) {
        if(NodeKitError.hasOwnProperty(key)) {
            if(NodeKitError[key] === this.code) {
                return key;
            }
        }
    }
};

/**
 * Converts NodeKitError instance to string representation
 * @param   {Boolean}  [isVerbose]  Set up verbose mode. Used to provide more
 *   details including information about error code name and context
 * @return  {String}              Stringified error representation
 */
NodeKitError.prototype.toString = function(isVerbose) {
    var message = '', codePrefix = '';

    if(this.code !== NodeKitError.UNKNOWN_ERROR) {
        codePrefix = 'code: ' + this.code + (isVerbose ? (' (' + this.getErrorCodeName() + ')') : '') + ' ';
    }

    if(this.code === NodeKitError.EXTERNAL_TOOL_ERROR) {
        if(typeof this.context !== 'undefined') {
            if(isVerbose) {
                message = codePrefix + EOL + this.context.toString(isVerbose) + '\n failed with an error: ' +
                    this.message + EOL + 'Stack trace: ' + this.stack;
            } else {
                message = codePrefix + '\'' + this.context.toString(isVerbose) + '\' ' + this.message;
            }
        } else {
            message = 'External tool failed with an error: ' + this.message;
        }
    } else {
        message = isVerbose ? codePrefix + this.stack : codePrefix + this.message;
    }

    return message;
};

module.exports = NodeKitError;
