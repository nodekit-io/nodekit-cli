/*
 *  Copyright 2013 Canonical Ltd.
 *  Copyright 2011 Wolfgang Koller - http://gofg.at/
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

#include "nodekit.h"

#include <QtGui>

#include <QApplication>
#include <QQuickView>
#include <QQuickItem>
#include <QQmlContext>

NodeKit::NodeKit(const QDir &appDir, QQuickItem *item, QObject *parent)
    : QObject(parent), _item(item), _app(appDir),
      _config(_app.absoluteFilePath("../config.xml")) {

    qDebug() << "Work directory: " << _app.absolutePath();

    if (_config.content().contains(QRegExp("^(http://)"))) {
        _mainUrl = QString(_config.content());
    } else if (!_app.exists(_config.content())) {
        qCritical() << _config.content() << "does not exist";
    } else {
        _mainUrl = QUrl::fromLocalFile(_app.absoluteFilePath(_config.content()))
	  .toString();
    }

    qDebug() << "Main URL: " << _mainUrl;
}

void NodeKit::appLoaded() {
    initPlugins();
    for (QSharedPointer<CPlugin> &plugin: _plugins) {
        plugin->onAppLoaded();
    }
}

QString NodeKit::get_app_dir() {
    return _app.absolutePath();
}

struct Splash {
    double rating;
    QString path;
};

QString NodeKit::getSplashscreenPath() {
    double ratio = (double)_item->width() / _item->height();

    QDir dir(get_app_dir());
    if (!dir.cd("splashscreen"))
        return "";

    QList<Splash> images;
    for (QFileInfo info: dir.entryInfoList()) {
        QImage image(info.absoluteFilePath());
        if (image.isNull())
            continue;
        Splash t;
        t.path = info.absoluteFilePath();
        t.rating = std::abs((image.width() / (double)_item->width()) * ((image.width() / image.height()) / ratio) - 1);
        images.push_back(t);
    }
    std::min_element(images.begin(), images.end(), [](Splash &f, Splash &s) {
        return f.rating < s.rating;
    });
    if (!images.empty())
      return images.first().path;
    return "";
}

const NodeKitInternal::Config& NodeKit::config() const {
    return _config;}


void NodeKit::initPlugins() {
    QList<QDir> searchPath = {get_app_dir()};

    _plugins.clear();
    for (QDir pluginsDir: searchPath) {
        for (const QString &fileName: pluginsDir.entryList(QDir::Files)) {
            QString path = pluginsDir.absoluteFilePath(fileName);
            qDebug() << "Testing" << path;

            if (!QLibrary::isLibrary(path))
                continue;

            NodeKitGetPluginInstances loader = (NodeKitGetPluginInstances) QLibrary::resolve(path, "nodekitGetPluginInstances");
            if (!loader) {
                qCritical() << "Missing nodekitGetPluginInstances symbol in" << path;
                continue;
            }

            auto plugins = (*loader)(this);

            for (QSharedPointer<CPlugin> plugin: plugins) {
                qDebug() << "Enable plugin" << plugin->fullName();
                emit pluginWantsToBeAdded(plugin->fullName(), plugin.data(), plugin->shortName());
            }
            _plugins += plugins;
        }
    }
}

void NodeKit::loadFinished(bool ok) {
    Q_UNUSED(ok)

    initPlugins();
}

void NodeKit::execQML(const QString &src) {
    emit qmlExecNeeded(src);
}

void NodeKit::execJS(const QString &js) {
    emit javaScriptExecNeeded(js);
}

QString NodeKit::mainUrl() const {
    return _mainUrl;
}

QObject *NodeKit::topLevelEventsReceiver() {
    return dynamic_cast<QQuickWindow*>(_item->window());
}

QQuickItem *NodeKit::rootObject() {
    return _item->parentItem();
}

void NodeKit::setTitle(const QString &title) {
    dynamic_cast<QQuickWindow*>(_item->window())->setTitle(title);
}

void NodeKit::pushViewState(const QString &state) {
    if (_states.empty()) {
        rootObject()->setState(state);
    }
    _states.push_front(state);
}

void NodeKit::popViewState(const QString &state) {
    if (!_states.removeOne(state))
        qDebug() << "WARNING: incorrect view states order";

    if (_states.empty()) {
        rootObject()->setState("main");
    } else {
        rootObject()->setState(_states.front());
    }
}
