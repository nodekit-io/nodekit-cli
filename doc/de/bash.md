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

# Bash-Shell-Unterstützung

NodeKit CLI kommt zusammengerollt mit einem Skript, die Bash Befehlszeile Befehlszeilenergänzung vorsieht. Wenn Sie ein ausreichend Unix-y Betriebssystem (Linux, BSD, OS X) ausführen können Sie damit tippen NodeKit-Befehlszeilen erleichtern installieren.

## Installation

### Linux

Um auf einem Linux- oder BSD-System zu installieren, kopieren Sie die `scripts/nodekit.completion` Datei in Ihr `/etc/bash_completion.d` Verzeichnis. Dies wird beim nächsten Start eine neue Shell gelesen.

### OS X

Unter OS X setzen die `scripts/nodekit.completion` Datei überall lesbar, und fügen Sie folgende Zeile an das Ende Ihrer `~/.bashrc` Datei:

    source <path to>/nodekit.completion
    

Dies wird beim nächsten Start eine neue Shell gelesen.

## Verwendung

Es ist einfach! Solange Ihre Befehlszeile mit einer ausführbaren Datei namens 'Cordoba' beginnt, drücken Sie einfach `<TAB>` zu jedem Zeitpunkt, eine Liste der gültigen Ergänzungen zu sehen.

Beispiele:

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