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

# Поддержка оболочки командной строки bash

NodeKit CLI поставляется в комплекте со скриптом, который обеспечивает автодополнение в командной строке по клавише Tab для Bash. Если вы работаете достаточно Unix подобную операционную систему (Linux, BSD, OS X) вы можете установить этот скрипт для упрощения ввода командных строк с nodekit.

## Установка

### Linux

Для установки в системе Linux или BSD, скопируйте `scripts/nodekit.completion` файла в ваш каталог `/etc/bash_completion.d`. Этот файл будет прочитан в следующий раз когда вы запустите новое окно терминала.

### OS X

На OS X, положите файл `scripts/nodekit.completion` где он будет доступен для чтения и добавьте следующую строку в конец вашего `~/.bashrc` файл:

    source <path to>/nodekit.completion
    

Этот файл будет прочитан в следующий раз когда вы запустите новое окно терминала.

## Применение

Это очень просто! При условии что ваша командная строка начинается с исполняемого файла под названием «nodekit», просто нажмите `<TAB>` в любой момент, чтобы просмотреть список допустимых вариантов.

Примеры:

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