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

# Support du shell bash

NodeKit CLI est livré avec un script de ligne de commande saisie semi-automatique par tabulation pour Bash. Si vous utilisez un suffisamment Unix-y système d'exploitation (Linux, BSD, OS X), vous pouvez installer ceci pour faciliter les lignes de commande frappe nodekit.

## Installation

### Linux

Pour installer sur un système Linux ou BSD, copiez le `scripts/nodekit.completion` fichier vers votre `/etc/bash_completion.d` répertoire. Il indiquera la prochaine fois que vous démarrez un nouveau shell.

### OS X

Sur OS X, mettre le `scripts/nodekit.completion` fichier lisible n'importe où et ajoutez la ligne suivante à la fin de votre `~/.bashrc` fichier :

    source <path to>/nodekit.completion
    

Il indiquera la prochaine fois que vous démarrez un nouveau shell.

## Utilisation

C'est facile ! Tant que votre ligne de commande commence par un exécutable nommé « nodekit », vient de frapper `<TAB>` à tout moment pour voir une liste des complètements valides.

Exemples :

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