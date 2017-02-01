/*
 *
 * Copyright 2013 Canonical Ltd.
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
#ifndef QMLPLUGIN_H_SDASDAS
#define QMLPLUGIN_H_SDASDAS

#include <QtCore>
#include <QtQuick>
#include <cassert>

#include "nodekit.h"

class NodeKitWrapper: public QQuickItem {
    Q_OBJECT
    Q_PROPERTY(QString appDir READ appDir WRITE setAppDir SCRIPTABLE true FINAL)
    Q_PROPERTY(QString mainUrl READ mainUrl CONSTANT)
public:
    NodeKitWrapper() = default;

    QString appDir() {
        if (!_nodekit.data()) {
            return "";
        }
        return _appDir;
    }

    void setAppDir(const QString &app) {
        _appDir = app;

        initialize();
    }

    Q_INVOKABLE QString getSplashscreenPath() {
        assert(_nodekit.data());
        return _nodekit->getSplashscreenPath();
    }

    Q_INVOKABLE static QString getDataLocation() {
        return QStandardPaths::writableLocation(QStandardPaths::DataLocation);
    }

    QString mainUrl() {
        if (!_nodekit.data()) {
            return "";
        }
        return _nodekit->mainUrl();
    }

    Q_INVOKABLE bool isUrlWhiteListed(const QString &uri) {
        if (!_nodekit.data()) {
            return true;
        }
        return _nodekit->config().whitelist().isUrlWhiteListed(uri);
    }

    Q_INVOKABLE NodeKitInternal::Config* config() const {
        assert(_nodekit.data());

        //FIXME:
        NodeKitInternal::Config *config = const_cast<NodeKitInternal::Config*>(&_nodekit->config());
        QQmlEngine::setObjectOwnership(config, QQmlEngine::CppOwnership);
        return config;
    }

signals:
    void javaScriptExecNeeded(const QString &js);
    void pluginWantsToBeAdded(const QString &pluginName, QObject *pluginObject, const QString &pluginShortName);
    void qmlExecNeeded(const QString &src);
public slots:
    void setTitle(const QString &title) {
        if (!_nodekit.data() || !_nodekit->rootObject()) {
            return;
        }
        return _nodekit->setTitle(title);
    }

    void loadFinished(bool b) {
        if (!_nodekit.data()) {
            return;
        }
        return _nodekit->loadFinished(b);
    }
    void appLoaded() {
        assert(_nodekit.data());
        return _nodekit->appLoaded();
    }

private:
    void initialize() {
        assert(!_nodekit.data());

        if (!_appDir.size())
            return;

        _nodekit = QSharedPointer<NodeKit>(new NodeKit(QDir(_appDir), this));

        connect(_nodekit.data(), &NodeKit::javaScriptExecNeeded, [&] (const QString &js) {
            emit javaScriptExecNeeded(js);
        });
        connect(_nodekit.data(), &NodeKit::qmlExecNeeded, [&] (const QString &src) {
            emit qmlExecNeeded(src);
        });
        connect(_nodekit.data(), &NodeKit::pluginWantsToBeAdded, [&] (const QString &pluginName, QObject *pluginObject, const QString &pluginShortName) {
            emit pluginWantsToBeAdded(pluginName, pluginObject, pluginShortName);
        });
    }

    QSharedPointer<NodeKit> _nodekit;
    QString _appDir;
};

class NodeKitUbuntuPlugin: public QQmlExtensionPlugin {
    Q_OBJECT
    Q_PLUGIN_METADATA(IID "org.qt-project.Qt.QQmlExtensionInterface")

public:
    void registerTypes(const char *uri);
};

#endif
