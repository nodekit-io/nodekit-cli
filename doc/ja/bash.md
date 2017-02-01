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

# Bash シェルのサポート

コルドバの CLI は、Bash のコマンドラインのタブ補完を提供するスクリプトが付属しています。 十分に Unix y オペレーティング システム （Linux、BSD、OS X） を実行している場合入力コルドバ コマンド ・ ラインを容易にこれをインストールできます。

## インストール

### Linux

Linux や BSD のシステムをインストールするコピー、 `scripts/nodekit.completion` ファイルを `/etc/bash_completion.d` ディレクトリ。これは次に新しいシェルを起動したときに読み取られます。

### OS X

OS X に入れて、 `scripts/nodekit.completion` ファイルのどこにでも読みやすいとの末尾に次の行を追加、 `~/.bashrc` ファイル。

    source <path to>/nodekit.completion
    

これは次に新しいシェルを起動したときに読み取られます。

## 使い方

それは簡単です ！コマンド ライン 'コルドバ' と呼ばれる実行可能ファイルで始まる限り、ちょうどヒット `<TAB>` 有効な入力候補の一覧を表示する任意の時点で。

例:

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