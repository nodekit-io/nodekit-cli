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

# Powłoki bash

NodeKit CLI przyjechał wiązany rezygnować skrypt, który zawiera kartę zakończenia wiersza poleceń dla Bash. Jeśli używasz wystarczająco Unix-y system operacyjny (Linux, BSD, OS X) można zainstalować ten ułatwia pisanie wierszy polecenia nodekit.

## Instalacja

### Linux

Aby zainstalować na systemie Linux i BSD, skopiuj `scripts/nodekit.completion` pliku do swojego `/etc/bash_completion.d` katalogu. To będzie odczytywane przy następnym uruchomieniu nowej powłoki.

### OS X

Na OS X, `scripts/nodekit.completion` plik w dowolnym miejscu czytelny i dodać następującą linię na końcu swojej `~/.bashrc` pliku:

    source <path to>/nodekit.completion
    

To będzie odczytywane przy następnym uruchomieniu nowej powłoki.

## Użycie

To proste! Tak długo, jak twój wiersz poleceń zaczyna się plik wykonywalny o nazwie "nodekit", po prostu wciskamy `<TAB>` w dowolnym momencie, aby zobaczyć listę ważnych uzupełnień.

Przykłady:

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