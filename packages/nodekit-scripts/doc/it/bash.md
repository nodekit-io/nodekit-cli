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

# Supporto di shell bash

NodeKit CLI viene fornito con uno script che prevede nella scheda-completamento della riga di comando Bash. Se si sta eseguendo un sufficientemente y Unix sistema operativo (Linux, BSD, OS X) si può installare questo per rendere più facile la digitazione righe di comando di nodekit.

## Installazione

### Linux

Per installare un sistema Linux o BSD, copiare la `scripts/nodekit.completion` del file al tuo `/etc/bash_completion.d` directory. Questo verrà letta la prossima volta che si avvia una nuova shell.

### OS X

Su OS X, mettere il `scripts/nodekit.completion` del file leggibile ovunque e aggiungere la riga seguente alla fine del tuo `~/.bashrc` file:

    source <path to>/nodekit.completion
    

Questo verrà letta la prossima volta che si avvia una nuova shell.

## Utilizzo

È facile! Finchè la tua riga di comando inizia con un eseguibile chiamato 'nodekit', appena colpito `<TAB>` in qualsiasi punto per vedere una lista dei completamenti validi.

Esempi:

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