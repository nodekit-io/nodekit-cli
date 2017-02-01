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
Bash shell support
==================

NodeKit CLI comes bundled with a script which provides command-line tab-completion for Bash. If you're running a sufficiently
Unix-y operating system (Linux, BSD, OS X) you can install this to make typing nodekit command lines easier.

Installation
------------

### Linux

To install on a Linux or BSD system, copy the `scripts/nodekit.completion` file to your `/etc/bash_completion.d` directory. This will be read the next time you start a new shell.

### OS X

On OS X, put the `scripts/nodekit.completion` file anywhere readable, and add the following line to the end of your `~/.bashrc` file:

    source <path to>/nodekit.completion

This will be read the next time you start a new shell.

Usage
------

It's easy! As long as your command line begins with an executable called 'nodekit', just hit `<TAB>` at any point to see a list of valid completions.

Examples:

    $ nodekit <TAB>
    build     compile   create    emulate   platform  plugin    prepare   serve

    $ nodekit pla<TAB>

    $ nodekit platform <TAB>
    add ls remove rm

    $ nodekit platform a<TAB>

    $ nodekit platform add <TAB>
    android     macos       ios         windows     nodejs

    $ nodekit plugin rm <TAB>

    $ nodekit plugin rm io.nodekit.<TAB>
    io.nodekit.file    io.nodekit.inappbrowser
