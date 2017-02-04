/*
 *
 * Copyright 2013-2016 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/
import QtQuick 2.0
import com.canonical.Oxide 1.9
import "nodekit_wrapper.js" as NodeKitWrapper
import Ubuntu.Components 1.0
import Ubuntu.Components.Popups 1.0

OrientationHelper {
    id: root

    anchors.fill: parent

    state: "main"
    signal completed

    property string splashscreenPath
    property bool disallowOverscroll
    property var mainWebview

    function exec(plugin, func, args) {
        NodeKitWrapper.execMethod(plugin, func, args);
    }
    function plugin(plugin) {
        return NodeKitWrapper.pluginObjects[plugin];
    }
    property string usContext: "oxide://main-world"

    Rectangle {
        id: webViewContainer
        anchors.fill: parent
        WebView {
            id: webView
            anchors.fill: parent
            objectName: "webView"

            onNavigationRequested: {
                if (nodekit.isUrlWhiteListed(request.url))
                    request.action = NavigationRequest.ActionAccept;
                else
                    request.action = NavigationRequest.ActionReject;
            }

            popupMenu: ItemSelector {
                automaticOrientation: false
            }

            preferences.remoteFontsEnabled: true
            preferences.javascriptCanAccessClipboard: true
            preferences.canDisplayInsecureContent: true
            preferences.canRunInsecureContent: true

            preferences.allowUniversalAccessFromFileUrls: true
            preferences.allowFileAccessFromFileUrls: true

            preferences.localStorageEnabled: true
            preferences.appCacheEnabled: true

//            boundsBehavior: disallowOverscroll ? Flickable.StopAtBounds : Flickable.DragAndOvershootBounds
            property string scheme: "file"

            property var currentDialog: null

            // FIXME: remove code from geolocation plugin
            onGeolocationPermissionRequested: {
                request.accept();
            }

            onJavaScriptConsoleMessage: {
                var msg = "[JS] (%1:%2) %3".arg(sourceId).arg(lineNumber).arg(message)
                if (level === WebView.LogSeverityVerbose) {
                    console.log(msg)
                } else if (level === WebView.LogSeverityInfo) {
                    console.info(msg)
                } else if (level === WebView.LogSeverityWarning) {
                    console.warn(msg)
                } else if ((level === WebView.LogSeverityError) ||
                           (level === WebView.LogSeverityErrorReport) ||
                           (level === WebView.LogSeverityFatal)) {
                    console.error(msg)
                }
            }

            context: WebContext {
                id: webcontext

                devtoolsEnabled: debuggingEnabled
                devtoolsIp: debuggingDevtoolsIp
                devtoolsPort: debuggingEnabled ? debuggingDevtoolsPort : -1

                userScripts: [
                    UserScript {
                        context: usContext
                        emulateGreasemonkey: true
                        url: "escape.js"
                    }
                ]
                sessionCookieMode: {
                    if (typeof webContextSessionCookieMode !== 'undefined') {
                        if (webContextSessionCookieMode === "persistent") {
                            return WebContext.SessionCookieModePersistent
                        } else if (webContextSessionCookieMode === "restored") {
                            return WebContext.SessionCookieModeRestored
                        }
                    }
                    return WebContext.SessionCookieModeEphemeral
                }
                dataPath: nodekit.getDataLocation()
            }

            messageHandlers: [
                ScriptMessageHandler {
                    msgId: "from-nodekit"
                    contexts: [usContext]
                    callback: function(msg, frame) {
                        NodeKitWrapper.messageHandler(msg.payload)
                        console.log('Message payload', JSON.stringify(msg.payload))
                    }
                }
            ]

            Component.onCompleted: {
                root.mainWebview = webView;
                nodekit.appLoaded();
                webView.url = nodekit.mainUrl;
            }

            onTitleChanged: {
                nodekit.setTitle(webView.title)
            }

            onLoadingStateChanged: {
                if (!webView.loading) {
                    root.completed()
                    nodekit.loadFinished(true)
                }
            }
            Connections {
                target: nodekit
                onJavaScriptExecNeeded: {
                      webView.rootFrame.sendMessage(usContext, "EXECUTE", {code: js});
                }
                onQmlExecNeeded: {
                    eval(src);
                }
                onPluginWantsToBeAdded: {
                    NodeKitWrapper.addPlugin(pluginName, pluginObject)
                }
            }
        }
    }

    Image {
        id: splashscreen
        anchors.fill: parent
        source: splashscreenPath
        visible: false
        smooth: true
        fillMode: Image.PreserveAspectFit
    }

    states: [
        State {
            name: "main"
            PropertyChanges {
                target: webViewContainer
                visible: true
            }
            PropertyChanges {
                target: splashscreen
                visible: false
            }
        },
        State {
            name: "splashscreen"
            PropertyChanges {
                target: webViewContainer
                visible: false
            }
            PropertyChanges {
                target: splashscreen
                visible: true
            }
        }
    ]
    transitions: Transition {
        RotationAnimation { duration: 500; direction: RotationAnimation.Shortest }
    }
}
