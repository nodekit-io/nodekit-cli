/*
 Licensed to OffGrid Networks (OGN) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  OGN licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "NSDictionary+NodeKitPreferences.h"
#import <Foundation/Foundation.h>

@implementation NSDictionary (NodeKitPreferences)

- (id)nodekitSettingForKey:(NSString*)key
{
    return [self objectForKey:[key lowercaseString]];
}

- (BOOL)nodekitBoolSettingForKey:(NSString*)key defaultValue:(BOOL)defaultValue
{
    BOOL value = defaultValue;
    id prefObj = [self nodekitSettingForKey:key];

    if (prefObj != nil) {
        value = [(NSNumber*)prefObj boolValue];
    }

    return value;
}

- (CGFloat)nodekitFloatSettingForKey:(NSString*)key defaultValue:(CGFloat)defaultValue
{
    CGFloat value = defaultValue;
    id prefObj = [self nodekitSettingForKey:key];

    if (prefObj != nil) {
        value = [prefObj floatValue];
    }

    return value;
}

@end

@implementation NSMutableDictionary (NodeKitPreferences)

- (void)setNodeKitSetting:(id)value forKey:(NSString*)key
{
    [self setObject:value forKey:[key lowercaseString]];
}

@end
