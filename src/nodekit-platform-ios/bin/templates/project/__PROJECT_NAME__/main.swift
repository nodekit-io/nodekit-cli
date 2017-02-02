/*
 * nodekit.io
 *
 * Copyright (c) 2016-7 OffGrid Networks. All Rights Reserved.
 * Portions Copyright 2012 The Apache Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Foundation
import NodeKit

class myNKDelegate: NSObject, NKScriptContextDelegate {
     
    override init () {
         super.init()
    }
    
    func NKScriptEngineDidLoad(context: NKScriptContext) -> Void {

     }
    
    func NKScriptEngineReady(context: NKScriptContext) -> Void {
        NKEventEmitter.global.emit("nk.jsApplicationReady", "" as AnyObject)
    }
}

NSUserDefaults.standardUserDefaults().setBool(true, forKey: "WebKitDeveloperExtras")
NSUserDefaults.standardUserDefaults().setBool(true, forKey: "WebKitStoreWebDataForBackup")
NSUserDefaults.standardUserDefaults().synchronize()

NKElectroHost.start([
    "nk.allowCustomProtocol": false,
    "nk.NoSplash": true,
    "nk.NoTaskBar": true,
    "preloadURL": "app://localhost/index.html",
    "Engine" : NKEngineType.JavaScriptCore.rawValue
    ], delegate: myNKDelegate() )
