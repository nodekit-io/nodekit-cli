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

#import "CDVAvailabilityDeprecated.h"

#define __NODEKIT_IOS__

#define __NODEKIT_0_9_6 906
#define __NODEKIT_1_0_0 10000
#define __NODEKIT_1_1_0 10100
#define __NODEKIT_1_2_0 10200
#define __NODEKIT_1_3_0 10300
#define __NODEKIT_1_4_0 10400
#define __NODEKIT_1_4_1 10401
#define __NODEKIT_1_5_0 10500
#define __NODEKIT_1_6_0 10600
#define __NODEKIT_1_6_1 10601
#define __NODEKIT_1_7_0 10700
#define __NODEKIT_1_8_0 10800
#define __NODEKIT_1_8_1 10801
#define __NODEKIT_1_9_0 10900
#define __NODEKIT_2_0_0 20000
#define __NODEKIT_2_1_0 20100
#define __NODEKIT_2_2_0 20200
#define __NODEKIT_2_3_0 20300
#define __NODEKIT_2_4_0 20400
#define __NODEKIT_2_5_0 20500
#define __NODEKIT_2_6_0 20600
#define __NODEKIT_2_7_0 20700
#define __NODEKIT_2_8_0 20800
#define __NODEKIT_2_9_0 20900
#define __NODEKIT_3_0_0 30000
#define __NODEKIT_3_1_0 30100
#define __NODEKIT_3_2_0 30200
#define __NODEKIT_3_3_0 30300
#define __NODEKIT_3_4_0 30400
#define __NODEKIT_3_4_1 30401
#define __NODEKIT_3_5_0 30500
#define __NODEKIT_3_6_0 30600
#define __NODEKIT_3_7_0 30700
#define __NODEKIT_3_8_0 30800
#define __NODEKIT_3_9_0 30900
#define __NODEKIT_3_9_1 30901
#define __NODEKIT_3_9_2 30902
#define __NODEKIT_4_0_0 40000
#define __NODEKIT_4_0_1 40001
#define __NODEKIT_4_1_0 40100
#define __NODEKIT_4_1_1 40101
#define __NODEKIT_4_2_0 40200
#define __NODEKIT_4_2_1 40201
#define __NODEKIT_4_3_0 40300
#define __NODEKIT_4_3_1 40301
/* coho:next-version,insert-before */
#define __NODEKIT_NA 99999      /* not available */

/*
 #if NODEKIT_VERSION_MIN_REQUIRED >= __NODEKIT_4_0_0
    // do something when its at least 4.0.0
 #else
    // do something else (non 4.0.0)
 #endif
 */
#ifndef NODEKIT_VERSION_MIN_REQUIRED
    /* coho:next-version-min-required,replace-after */
    #define NODEKIT_VERSION_MIN_REQUIRED __NODEKIT_4_3_1
#endif

/*
 Returns YES if it is at least version specified as NSString(X)
 Usage:
     if (IsAtLeastiOSVersion(@"5.1")) {
         // do something for iOS 5.1 or greater
     }
 */
#define IsAtLeastiOSVersion(X) ([[[UIDevice currentDevice] systemVersion] compare:X options:NSNumericSearch] != NSOrderedAscending)

/* Return the string version of the decimal version */
#define CDV_VERSION [NSString stringWithFormat:@"%d.%d.%d", \
    (NODEKIT_VERSION_MIN_REQUIRED / 10000),                 \
    (NODEKIT_VERSION_MIN_REQUIRED % 10000) / 100,           \
    (NODEKIT_VERSION_MIN_REQUIRED % 10000) % 100]

// Enable this to log all exec() calls.
#define CDV_ENABLE_EXEC_LOGGING 0
#if CDV_ENABLE_EXEC_LOGGING
    #define CDV_EXEC_LOG NSLog
#else
    #define CDV_EXEC_LOG(...) do { \
} while (NO)
#endif
