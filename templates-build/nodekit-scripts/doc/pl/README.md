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

# nodekit-cli

> Narzędzie wiersza polecenia do tworzenia, wdrażania i zarządzania [NodeKit](http://nodekit.io)-oparty zastosowania.

[Apache NodeKit](http://nodekit.io) pozwala na budowanie rodzimych aplikacji mobilnych przy użyciu HTML, CSS i JavaScript. Narzędzie to pomaga z zarządzania wieloplatformowych aplikacji NodeKit, jak również integracji plugin NodeKit.

Zajrzyj do [przewodników wprowadzenie](http://nodekit.io/docs/en/edge/) więcej szczegółów na temat pracy z NodeKit podprojektów.

# NodeKit obsługiwanych platform

  * Amazon Fire OS
  * Android
  * macOS (OS X)
  * iOS
  * Ubuntu
  * Windows 10
  * Windows Phone 8
  * Windows 8

# Wymagania

  * [Node.js](http://nodejs.org/)
  * SDK dla każdej platformy, które chcesz obsługiwać: 
      * **Android**: [Android SDK](http://developer.android.com) - **Uwaga** to narzędzie nie będzie działać, chyba że masz absolutną najnowsze aktualizacje dla wszystkich składników Android SDK. Także trzeba będzie SDK `tools` i `platform-tools` katalogi na wsparcie inaczej Android **ścieżka systemu** nie powiedzie się.
      * **Amazonka fireos**: [Amazon ogień OS SDK](https://developer.amazon.com/public/solutions/platforms/android-fireos/docs/building-and-testing-your-hybrid-app) - **Uwaga** to narzędzie nie będzie działać, chyba że masz Android SDK zainstalowany i ścieżki są aktualizowane, jak wspomniano powyżej. Ponadto musisz zainstalować AmazonWebView SDK i skopiuj awv_interface.jar do folderu ~/.nodekit/lib/commonlibs w systemie **Mac/Linux** lub **Windows** %USERPROFILE%/.nodekit/lib/coomonlibs. Jeśli commonlibs folder nie istnieje, a następnie utworzyć jeden.
      * [Windows Phone SDK](http://dev.windowsphone.com/en-us/downloadsdk) - **Uwaga** to narzędzie nie będzie działać, chyba że masz `msbuild` na twój **system ścieżka** w przeciwnym razie nie będzie wsparcie Windows Phone (`msbuild.exe` zwykle znajduje się w `C:\Windows\Microsoft.NET\Framework\v4.0.30319`).
      * **BlackBerry 10**: [BlackBerry 10 WebWorks SDK](http://developer.blackberry.com/html5/download/). Upewnij się, że masz `dependencies/tools/bin` folder wewnątrz katalogu SDK dodaje do Twojej ścieżki!
      * **iOS**: [iOS SDK](http://developer.apple.com) z najnowszych `Xcode` i `Narzędzi wiersza polecenia Xcode`
      * **Windows Phone**: [Windows Phone SDK](http://dev.windowsphone.com/en-us/downloadsdk) - **Uwaga** to narzędzie nie będzie działać, chyba że masz `msbuild` na twój **system ścieżka** w przeciwnym razie nie będzie wsparcie Windows Phone (`msbuild.exe` zwykle znajduje się w `C:\Windows\Microsoft.NET\Framework\v4.0.30319`).

`NodeKit-cli` został przetestowany na **Mac OS X**, **Linux**, **Windows 7**i **Windows 8**.

Należy pamiętać, że niektóre platformy mogą posiadać ograniczenia OS. Na przykład nie można budować dla Windows Phone 8 na Mac OS X lub Windows 8, ani nie można zbudować dla iOS na Windows.

# Zainstalować

Ubuntu pakiety są dostępne w PPA 13.10 Ubuntu (pyskaty) (obecnym wydaniu), a także 14.04 (sprawdzony) (w budowie).

    sudo apt-add-repository ppa:nodekit-ubuntu/ppa
    sudo apt-get update
    sudo apt-get install nodekit-cli
    npm install -g nodekit
    

Do budowania aplikacji na platformie Ubuntu, wymagane są następujące pakiety dodatkowe:

    sudo apt-get install cmake debhelper libx11-dev libicu-dev pkg-config qtbase5-dev qtchooser qtdeclarative5-dev qtfeedback5-dev qtlocation5-dev qtmultimedia5-dev qtpim5-dev qtsensors5-dev qtsystems5-dev
    

## Rata od mistrza

Będziesz musiał zainstalować [CLI](https://git-wip-us.apache.org/repos/asf/nodekit-cli.git) i [Plugman](https://git-wip-us.apache.org/repos/asf/nodekit-plugman.git) z `git`. Systemem *npm wersja* jeden i *wersją główną (git)* innych jest prawdopodobnie do końca z Tobą cierpienia.

Aby unikać sudo, zobacz [uzyskać od sudo: npm bez głównego](http://justjs.com/posts/npm-link-developing-your-own-npm-modules-without-tears).

Uruchom następujące polecenia:

    git clone https://git-wip-us.apache.org/repos/asf/nodekit-plugman.git
    cd nodekit-plugman
    npm install
    sudo npm link
    cd ..
    git clone https://git-wip-us.apache.org/repos/asf/nodekit-cli.git
    cd nodekit-cli
    npm install
    sudo npm link
    npm link plugman
    

Teraz `nodekit` i `plugman` w ścieżce są wersje lokalne git. Nie zapomnij, aby utrzymać je na bieżąco!

## Instalacja na Ubuntu

    apt-get install nodekit-cli
    

# Pierwsze kroki

`NodeKit-cli` ma jeden globalny `utworzyć` polecenia, który tworzy nowe projekty NodeKit do określonego katalogu. Po utworzeniu projektu, `cd` do niego i być może wykonać różne polecenia na poziomie projektu. Całkowicie inspirowane przez interfejs git.

## Polecenia globalne

  * `help` wyświetlana strona pomocy z wszystkich dostępnych poleceń
  * `create <directory> [<id> [<name>]]` tworzenie nowego projektu NodeKit z opcjonalną nazwę i identyfikator (Nazwa pakietu, styl domeny odwrotnej)

<a name="project_commands" />

## Projektu polecenia

  * `platform [ls | list]` listę wszystkich platform, które zbuduje projektu
  * `platform add <platform> [<platform> ...]` dodać jeden (lub więcej) platformy jako cel budowania projektu
  * `platform [rm | remove] <platform> [<platform> ...]` usuwa jeden (lub więcej) cele budowy platformy z projektu
  * `platform [up | update] <platform>` -aktualizacje wersji NodeKit, stosowany dla danej platformy
  * `plugin [ls | list]` listy wszystkie pluginy zawarte w projekcie
  * `plugin add <path-to-plugin> [<path-to-plugin> ...]` dodać jeden (lub więcej) wtyczki do projektu
  * `plugin [rm | remove] <plugin-name> [<plugin-name> ...]` Usuń jeden (lub więcej) wtyczki z projektu.
  * `plugin search [<keyword1> <keyword2> ...]` Szukaj rejestru plugin dla wtyczek pasujących na liście słów kluczowych
  * `prepare [platform...]` kopiuje pliki do określonej platformy, lub wszystkich platform. To jest gotowy do budynku przez `Eclipse`, `Xcode`, itp.
  * `compile [platform...]` kompiluje aplikacji do binarny dla każdej z platform docelowych. Bez parametrów, buduje dla wszystkich platform, w przeciwnym razie buduje dla określonej platformy.
  * `build [<platform> [<platform> [...]]]` alias dla `nodekit przygotować` a następnie `skompilować nodekit`
  * `emulate [<platform> [<platform> [...]]]` uruchomić emulatory i wdrożenie aplikacji do nich. Bez parametrów emuluje dla wszystkich platform dodany do projektu, w przeciwnym razie emuluje dla określonej platformy
  * `serve [port]` wprowadzić na rynek lokalny serwer app pozwala na dostęp do każdej platformy app katalog na danym porcie (domyślnie 8000).

### Opcjonalne flagi

  * `-d` lub `--verbose` rur będzie się bardziej gadatliwe wyjście do skorupy. Możesz również subskrybować zdarzenia `dziennika` i `ostrzec` jeśli jesteś czasochłonne `nodekit-cli` jako moduł węzła przez wywołanie `nodekit.on ('log', function() {})` lub `nodekit.on ("warn", function() {})`.
  * `-v` lub `--version` zainstaluje wydrukować wersję swojego `nodekit-cli` .

# Strukturę katalogów dla projektu

Aplikacją NodeKit, zbudowany z `nodekit-cli` będą miały następującą strukturę katalogów:

    myApp/
    |-- nodekit.json
    |-- hooks/
    |-- merges/
    | | |-- android/
    | | |-- blackberry10/
    | | `-- ios/
    |-- app/
    |-- platforms/
    | |-- android/
    | |-- blackberry10/
    | `-- ios/
    `-- plugins/
    

## hooks/

W tym katalogu mogą zawiera skrypty używane do dostosowywania poleceń nodekit cli. W tym katalogu użyta do istnieje w `.nodekit/hooks`, ale teraz został przeniesiony do katalogu głównego projektu. Skrypty, które można dodać do tych katalogów zostanie wykonana przed i po poleceniach odpowiadającą nazwę katalogu. Przydatne dla integracji systemów budować lub integracji z systemami kontroli wersji.

Odnoszą się do Haki Przewodnik</a> dla więcej informacji.

## merges/

Aktywa poszczególnych platform internetowych (HTML, CSS i JavaScript pliki) są zawarte w odpowiednich podfolderach w tym katalogu. Są one rozmieszczone podczas `prepare` do odpowiedniego katalogu macierzystego. Pliki umieszczone pod `merges/` zastąpi pasujące pliki w `app /` folder dla odpowiednich platformy. Szybki przykład, zakładając, że struktury projektu:

    merges/
    |-- ios/
    | `-- app.js
    |-- android/
    | `-- android.js
    app/
    `-- app.js
    

Po budynku projekty Android i iOS, Android aplikacja będzie zawierać zarówno `app.js` i `android.js`. Jednakże, iOS aplikacji będzie zawierać tylko `app.js`, i będzie to jeden z `merges/ios/app.js`, zastępując "wspólne" `app.js` znajdujące się wewnątrz `app /`.

## app/

Zawiera projekt web artefaktów, takich jak pliki HTML, CSS i js. Są to główne aktywa. Oni zostaną skopiowane na `nodekit przygotować` do każdej platformy app katalog.

### Koc: plik nodekit.json

Ten plik jest, co powinno edycji do modyfikowania metadanych aplikacji. Każdym razem, gdy można uruchomić polecenia nodekit-cli, narzędzie będzie spojrzeć na zawartość `pliku nodekit.json` i korzystać wszystkie istotne informacje z tego pliku do definiowania informacji o rodzimych aplikacji. NodeKit-cli obsługuje zmianę danych aplikacji za pośrednictwem następujących elementów wewnątrz pliku `nodekit.json` :

  * Nazwa użytkownika-od strony mogą być modyfikowane przez zawartość elementu `< nazwa >` .
  * Nazwa pakietu (AKA pakiet identyfikator lub aplikacji id) mogą być modyfikowane za pomocą atrybutu `id` element najwyższego poziomu `< widżet >` .
  * Wersja mogą być modyfikowane za pomocą atrybutu element najwyższego poziomu `< widżet >` na `wersji` .
  * Białej listy mogą być modyfikowane przy użyciu elementów `< access >` . Upewnij się, że `pochodzenie` atrybut punktów elementu `< access >` prawidłowy adres URL (można użyć `*` jako symbolu wieloznacznego). Aby uzyskać więcej informacji o składni białą zobacz [docs.phonegap.com](http://docs.phonegap.com/en/2.2.0/guide_whitelist_index.md.html#Domain%20Whitelist%20Guide). Można użyć atrybut `uri` ([BlackBerry własności](https://developer.blackberry.com/html5/documentation/access_element_834677_11.html)) lub `origin` ([zgodnych ze standardami](http://w3.org/TR/widgets-access/#attributes)) dla oznaczenia domeny.
  * Ustawienia specyficzne dla platformy mogą być dostosowane przez Tagi `< preference >` . Zobacz [docs.phonegap.com](http://docs.phonegap.com/en/2.3.0/guide_project-settings_index.md.html#Project%20Settings) aby uzyskać listę preferencji, które można użyć.
  * Stronie wpis przed rozpoczęciem aplikacji mogą być definiowane za pomocą atrybutu + `< zawartości src >` element.

## platforms/

Dodawane do aplikacji platformy mają native stosowania projektu struktury określonymi w tym katalogu.

## plugins/

Wszelkie dodatkowe pluginy zostaną wyodrębnione lub skopiowane do tego katalogu.

# Hooks

Projekty tworzone przez nodekit-cli mają `before` i `after` haki na każdego [project command](#project_commands).

Istnieją dwa typy haków: te specyficzne dla projektu i poziom modułu ci. Oba typy haków otrzymują folderu głównego projektu jako parametr.

## Haki specyficznych dla projektu

Znajdują się one w katalogu `hooks` w katalogu głównym projektu NodeKit. Skrypty, które można dodać do tych katalogów zostanie wykonana przed i po odpowiednie komendy. Przydatne dla integracji systemów budować lub integracji z systemami kontroli wersji. **Pamiętaj**: zrobić skryptów wykonywalnych. Odnoszą się do [Haki Przewodnik](http://nodekit.io/docs/en/edge/guide_appdev_hooks_index.md.html#Hooks%20Guide) dla więcej informacji.

### Przykłady

  * [ `before_build` hak na kompie jade szablon](https://gist.github.com/4100866) dzięki uprzejmości [dpogue](http://github.com/dpogue)

## Moduł poziom haki

Jeśli używasz nodekit-cli jako moduł w większych aplikacji **węzła** , można również użyć standardowych metod `EventEmitter` dołączyć do wydarzeń. Zdarzenia obejmują `before_build`, `before_compile`, `before_docs`, `before_emulate`, `before_run`, `before_platform_add`, `before_library_download`, `before_platform_ls`, `before_platform_rm`, `before_plugin_add`, `before_plugin_ls`, `before_plugin_rm` i `before_prepare`. Istnieje również `library_download` zdarzenie progress. Dodatkowo istnieją `after_` smaków wszystkich powyższych zdarzeń.

Raz ci `require('nodekit')` w projekcie węzła, będziesz miał zwykle `EventEmitter` dostępnych metod (`na`, `wyłączyć` lub `removeListener`, `removeAllListeners`i `emitują` lub `wyzwalacza`).

# Przykłady

## Tworzenie nowego projektu NodeKit

Ten przykład pokazuje jak stworzyć projekt od nowa o nazwie KewlApp z iOS i Android platforma wsparcia i zawiera wtyczkę o nazwie Kewlio. Projekt będzie żyć w ~/KewlApp

    nodekit create ~/KewlApp KewlApp
    cd ~/KewlApp
    nodekit platform add ios android
    nodekit plugin add http://example.org/Kewlio-1.2.3.tar.gz
    nodekit build
    

W strukturze katalogów KewlApp teraz wygląda to tak:

    KewlApp/
    |-- hooks/
    |-- merges/
    | |-- android/
    | `-- ios/
    |-- app/
    | `-- index.html
    |-- platforms/
    | |-- android/
    | | `-- …
    | `-- ios/
    |   `-- …
    `-- plugins/
      `-- Kewlio/
    

# Przyczyniając się

## Wykonywanie testów

    npm test
    

## Pobierz raporty z badań zasięgu

    npm run cover
    

## Do zrobienia + problemy

Proszę sprawdzić [NodeKit problemów przy użyciu składnika CLI](http://issues.nodekit.io). Jeśli znajdziesz problemy za pomocą tego narzędzia, należy tak uprzejmy aby zawierać istotne informacje potrzebne do debugowania problemów takich jak:

  * Twój system operacyjny i wersja
  * Nazwa aplikacji, katalogu i identyfikator używany z `tworzenia`
  * Których mobilnych SDK zainstalowano oraz ich wersje. Związanych z tym: jaką wersję `Xcode` jeśli przesyłasz kwestie związane z iOS
  * Żadnych śladów stosu błędów, które otrzymałeś

## Współpracownicy

Dzięki wszystkim za wkład! Lista osób biorących udział można znaleźć w pliku `package.json` .

# Znane problemy i ich rozwiązywanie

## Wszelki OS

### Ustawienia serwera proxy

`NodeKit-cli` będzie używać ustawień serwera proxy `npm`. Jeśli pobrano nodekit-cli przez `npm` i są za pośrednictwem serwera proxy, są szanse, że nodekit-cli powinny pracować dla Ciebie, jak to będzie korzystać z tych ustawień w pierwszej kolejności. Upewnij się, że zmiennych config npm `https proxy` i `serwera proxy` są prawidłowo ustawione. Zobacz [npm w dokumentacji konfiguracji](https://npmjs.org/doc/config.html) dla więcej informacji.

## Windows

### Dodawanie Android jako platforma

Podczas trudny wobec dodać pewien platforma na komputerze z systemem Windows, jeśli napotkasz następujący komunikat o błędzie: Biblioteka NodeKit "Android" już istnieje. Nie ma potrzeby pobierania. Kontynuacja. Sprawdzanie, czy platforma "android" przechodzi minimalne wymagania... Sprawdzanie wymagań Android... Kolejny "android listy cel" (wyjście do naśladowania)

    Error: The command `android` failed. Make sure you have the latest Android SDK installed, and the `android` command (inside the tools/ folder) added t
    o your path. Output:
    at C:\Users\me\AppData\Roaming\npm\node_modules\nodekit\src\platform.js:185:42
    at C:\Users\me\AppData\Roaming\npm\node_modules\nodekit\src\metadata\android_parser.js:50:13
    at C:\Users\me\AppData\Roaming\npm\node_modules\nodekit\node_modules\shelljs\shell.js:1707:7
    at exithandler (child_process.js:633:7)
    at ChildProcess.errorhandler (child_process.js:649:5)
    at ChildProcess.EventEmitter.emit (events.js:95:17)
    at Process.ChildProcess._handle.onexit (child_process.js:787:12)
    

Uruchom polecenie `android list target`. Jeśli widzisz:

    'xcopy' is not recognized as an internal or external command,
    operable program or batch file.
    

na początku dane wyjściowe polecenia, to oznacza, że musisz naprawić Twoje zmienna ścieżka Windows obejmują xcopy. Lokalizacja ta jest zazwyczaj C:\Windows\System32.

## Windows 8

Obsługa systemu Windows 8 nie obejmują możliwość uruchomienia/run/emulacja, więc trzeba będzie otworzyć **Programu Visual Studio** , aby zobaczyć swoją aplikację na żywo. Jesteś jeszcze w stanie windows8 za pomocą następujących poleceń:

  * `platform add windows8`
  * `platform remove windows8`
  * `prepare windows8`
  * `compile windows8`
  * `build windows8`

Aby uruchomić aplikację, trzeba będzie otworzyć `.sln` w folderze `platform/windows8` przy użyciu **Visual Studio 2012**.

**Visual Studio** powie, aby ponownie załadować projekt po uruchomieniu dowolnego z powyższych poleceń, podczas gdy projekt jest ładowany.

## Amazon Fire OS

Amazon ogień OS nie obejmują zdolność do naśladowania. Nadal można użyć następujących poleceń z Amazon ogień OS

  * `platform add amazon-fireos`
  * `platform remove amazon-fireos`
  * `prepare amazon-fireos`
  * `compile amazon-fireos`
  * `build amazon-fireos`

## Ubuntu

Początkowej wersji nodekit-Ubuntu nie obsługuje budowanie aplikacji dla urządzeń armhf automatycznie. Istnieje możliwość produkcji aplikacji i kliknij przycisk pakiety w kilku krokach choć.

Ten raport dokumentów problemu i rozwiązania to: https://bugs.launchpad.net/ubuntu/+source/nodekit-ubuntu/+bug/1260500 przyszłej wersji będzie niech deweloperzy cross kompilacji armhf kliknij przycisk pakiety bezpośrednio z pulpitu x 86.

## Firefox OS

Firefox OS nie obejmują możliwość naśladować, biegać i służyć. Po budynku, trzeba będzie otworzyć katalogu platformy aplikacji `firefoxos` w [WebIDE](https://developer.mozilla.org/docs/Tools/WebIDE) , że pochodzi z każdej przeglądarki Firefox. Można zachować otwarte okno i kliknij na przycisk "play" za każdym razem możesz zakończeniu budowy aplikacji.