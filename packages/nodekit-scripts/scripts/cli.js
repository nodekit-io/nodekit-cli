/**
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

/* jshint node:true, bitwise:true, undef:true, trailing:true, quotmark:true,
          indent:4, unused:vars, latedef:nofunc,
          laxcomma:true
*/


var path = require('path'),
    help = require('./help'),
    nopt,
    _,
    updateNotifier,
    pkg = require('../package.json'),
    telemetry = require('./telemetry'),
    Q = require('q');

var nodekit_lib = require('nodekit-scripts').lib,
    NodeKitError = nodekit_lib.NodeKitError,
    nodekit = nodekit_lib.nodekit,
    events = nodekit_lib.events,
    logger = require('nodekit-scripts').common.NodeKitLogger.get();

var msg,
    badPlatforms;


/*
 * init
 *
 * initializes nopt and underscore
 * nopt and underscore are require()d in try-catch below to print a nice error
 * message if one of them is not installed.
 */
function init() {
    try {
        nopt = require('nopt');
        _ = require('underscore');
        updateNotifier = require('update-notifier');
    } catch (e) {
        console.error(
            'Please run npm install from this directory:\n\t' +
            path.dirname(__dirname)
        );
        process.exit(2);
    }
}

function checkForUpdates() {
    try {
        // Checks for available update and returns an instance
        var notifier = updateNotifier({
            pkg: pkg
        });

        // Notify using the built-in convenience method
        notifier.notify();
    } catch (e) {
        // https://issues.apache.org/jira/browse/CB-10062
        if (e && e.message && /EACCES/.test(e.message)) {
            console.log('Update notifier was not able to access the config file.\n' +
                'You may grant permissions to the file: \'sudo chmod 744 ~/.config/configstore/update-notifier-nodekit.json\'');
        } else {
            throw e;
        }
    }
}

var shouldCollectTelemetry = false;
module.exports = function (inputArgs, cb) {
    
    /**
     * mainly used for testing.
     */
    cb = cb || function(){};
    
    init();
    
    // If no inputArgs given, use process.argv.
    inputArgs = inputArgs || process.argv;
    var cmd = inputArgs[2]; // e.g: inputArgs= 'node nodekit run ios'
    var subcommand = getSubCommand(inputArgs, cmd);
    var isTelemetryCmd = (cmd === 'telemetry');

    // ToDO: Move nopt-based parsing of args up here
    if(cmd === '--version' || cmd === '-v') {
        cmd = 'version';
    } else if(!cmd || cmd === '--help' || cmd === 'h') {
        cmd = 'help';
    }
            
    Q().then(function() {
        
        /**
         * Skip telemetry prompt if:
         * - CI environment variable is present
         * - Command is run with `--no-telemetry` flag
         * - Command ran is: `nodekit telemetry on | off | ...`
         */
        
        if(telemetry.isCI(process.env) || telemetry.isNoTelemetryFlag(inputArgs)) {
            return Q(false);
        }
        
        /**
         * We shouldn't prompt for telemetry if user issues a command of the form: `nodekit telemetry on | off | ...x`
         * Also, if the user has already been prompted and made a decision, use his saved answer
         */
        if(isTelemetryCmd) {
            var isOptedIn = telemetry.isOptedIn();
            return handleTelemetryCmd(subcommand, isOptedIn);
        }
        
        if(telemetry.hasUserOptedInOrOut()) {
            return Q(telemetry.isOptedIn());
        }
        
        /**
         * Otherwise, prompt user to opt-in or out
         * Note: the prompt is shown for 30 seconds. If no choice is made by that time, User is considered to have opted out.
         */
        return telemetry.showPrompt();
    }).then(function (collectTelemetry) {
        shouldCollectTelemetry = collectTelemetry;
        if(isTelemetryCmd) {
            return Q();
        }
        return cli(inputArgs);
    }).then(function () {
        if (shouldCollectTelemetry && !isTelemetryCmd) {
            telemetry.track(cmd, subcommand, 'successful');
        }
        // call cb with error as arg if something failed
        cb(null);
    }).fail(function (err) {
        if (shouldCollectTelemetry && !isTelemetryCmd) {
            telemetry.track(cmd, subcommand, 'unsuccessful');
        }
        // call cb with error as arg if something failed
        cb(err);
        throw err;
    }).done();
};

function getSubCommand(args, cmd) {
    if(cmd === 'platform' || cmd === 'platforms' || cmd === 'plugin' || cmd === 'plugins' || cmd === 'telemetry') {
        return args[3]; // e.g: args='node nodekit platform rm ios', 'node nodekit telemetry on'
    }
    return null;
}

function handleTelemetryCmd(subcommand, isOptedIn) {
    
    if (subcommand !== 'on' && subcommand !== 'off') {
        logger.subscribe(events);
        return help(['telemetry']);
    }
    
    var turnOn = subcommand === 'on' ? true : false;
    var cmdSuccess = true;

    // turn telemetry on or off
    try {
        if (turnOn) {
            telemetry.turnOn();
            console.log('Thanks for opting into telemetry to help us improve nodekit.');
        } else {
            telemetry.turnOff();
            console.log('You have been opted out of telemetry. To change this, run: nodekit telemetry on.');
        }
    } catch (ex) {
        cmdSuccess = false;
    }

    // track or not track ?, that is the question

    if (!turnOn) {
        // Always track telemetry opt-outs (whether user opted out or not!)
        telemetry.track('telemetry', 'off', 'via-nodekit-telemetry-cmd', cmdSuccess ? 'successful': 'unsuccessful');
        return Q();
    }
    
    if(isOptedIn) {
        telemetry.track('telemetry', 'on', 'via-nodekit-telemetry-cmd', cmdSuccess ? 'successful' : 'unsuccessful');
    }
    
    return Q();
}

function cli(inputArgs) {
    // When changing command line arguments, update doc/help.txt accordingly.
    var knownOpts =
        { 'verbose' : Boolean
        , 'version' : Boolean
        , 'help' : Boolean
        , 'silent' : Boolean
        , 'experimental' : Boolean
        , 'noregistry' : Boolean
        , 'nohooks': Array
        , 'shrinkwrap' : Boolean
        , 'copy-from' : String
        , 'link-to' : path
        , 'searchpath' : String
        , 'variable' : Array
        , 'link': Boolean
        , 'force': Boolean
        // Flags to be passed to `nodekit build/run/emulate`
        , 'debug' : Boolean
        , 'release' : Boolean
        , 'archs' : String
        , 'device' : Boolean
        , 'emulator': Boolean
        , 'target' : String
        , 'browserify': Boolean
        , 'noprepare': Boolean
        , 'fetch': Boolean
        , 'nobuild': Boolean
        , 'list': Boolean
        , 'buildConfig' : String
        , 'template' : String
        };

    var shortHands =
        { 'd' : '--verbose'
        , 'v' : '--version'
        , 'h' : '--help'
        , 'src' : '--copy-from'
        , 't' : '--template'
        };

    checkForUpdates();

    var args = nopt(knownOpts, shortHands, inputArgs);

    // For NodeKitError print only the message without stack trace unless we
    // are in a verbose mode.
    process.on('uncaughtException', function(err) {
        logger.error(err);
        // Don't send exception details, just send that it happened
        if(shouldCollectTelemetry) {
            telemetry.track('uncaughtException');
        }
        process.exit(1);
    });

    logger.subscribe(events);

    if (args.silent) {
        logger.setLevel('error');
    }

    if (args.verbose) {
        logger.setLevel('verbose');
    }

    var cliVersion = require('../package').version;
    // TODO: Use semver.prerelease when it gets released
    var usingPrerelease = /-nightly|-dev$/.exec(cliVersion);
    if (args.version || usingPrerelease) {
        var libVersion = require('nodekit-lib/package').version;
        var toPrint = cliVersion;
        if (cliVersion != libVersion || usingPrerelease) {
            toPrint += ' (nodekit-lib@' + libVersion + ')';
        }

        if (args.version) {
            logger.results(toPrint);
            return Q();
        } else {
            // Show a warning and continue
            logger.warn('Warning: using prerelease version ' + toPrint);
        }
    }

    if (/^v0.\d+[.\d+]*/.exec(process.version)) { // matches v0.* 
        msg = 'Warning: using node version ' + process.version +
                ' which has been deprecated. Please upgrade to the latest node version available (v6.x is recommended).';
        logger.warn(msg);
    }

    // If there were arguments protected from nopt with a double dash, keep
    // them in unparsedArgs. For example:
    // nodekit build ios -- --verbose --whatever
    // In this case "--verbose" is not parsed by nopt and args.vergbose will be
    // false, the unparsed args after -- are kept in unparsedArgs and can be
    // passed downstream to some scripts invoked by NodeKit.
    var unparsedArgs = [];
    var parseStopperIdx =  args.argv.original.indexOf('--');
    if (parseStopperIdx != -1) {
        unparsedArgs = args.argv.original.slice(parseStopperIdx + 1);
    }

    // args.argv.remain contains both the undashed args (like platform names)
    // and whatever unparsed args that were protected by " -- ".
    // "undashed" stores only the undashed args without those after " -- " .
    var remain = args.argv.remain;
    var undashed = remain.slice(0, remain.length - unparsedArgs.length);
    var cmd = undashed[0];
    var subcommand;
    var known_platforms = Object.keys(nodekit_lib.nodekit_platforms);
    msg = '';

    if ( !cmd || cmd == 'help' || args.help ) {
        if (!args.help && remain[0] == 'help') {
            remain.shift();
        }
        return help(remain);
    }

    if ( !nodekit.hasOwnProperty(cmd) ) {
        msg =
            'NodeKit does not know ' + cmd + '; try `' + nodekit_lib.binname +
            ' help` for a list of all the available commands.';
        throw new NodeKitError(msg);
    }

    var opts = {
        platforms: [],
        options: [],
        verbose: args.verbose || false,
        silent: args.silent || false,
        browserify: args.browserify || false,
        fetch: args.fetch || false,
        nohooks: args.nohooks || [],
        searchpath : args.searchpath
    };


    if (cmd == 'emulate' || cmd == 'build' || cmd == 'prepare' || cmd == 'compile' || cmd == 'run' || cmd === 'clean') {
        // All options without dashes are assumed to be platform names
        opts.platforms = undashed.slice(1);
        badPlatforms = _.difference(opts.platforms, known_platforms);
        if( !_.isEmpty(badPlatforms) ) {
            msg = 'Unknown platforms: ' + badPlatforms.join(', ');
            throw new NodeKitError(msg);
        }

        // Pass nopt-parsed args to PlatformApi through opts.options
        opts.options = args;
        opts.options.argv = unparsedArgs;

        if (cmd === 'run' && args.list && nodekit.raw.targets) {
            return nodekit.raw.targets.call(null, opts);
        }

        return nodekit.raw[cmd].call(null, opts);
    } else if (cmd === 'requirements') {
        // All options without dashes are assumed to be platform names
        opts.platforms = undashed.slice(1);
        badPlatforms = _.difference(opts.platforms, known_platforms);
        if( !_.isEmpty(badPlatforms) ) {
            msg = 'Unknown platforms: ' + badPlatforms.join(', ');
            throw new NodeKitError(msg);
        }

        return nodekit.raw[cmd].call(null, opts.platforms)
            .then(function(platformChecks) {

                var someChecksFailed = Object.keys(platformChecks).map(function(platformName) {
                    events.emit('log', '\nRequirements check results for ' + platformName + ':');
                    var platformCheck = platformChecks[platformName];
                    if (platformCheck instanceof NodeKitError) {
                        events.emit('warn', 'Check failed for ' + platformName + ' due to ' + platformCheck);
                        return true;
                    }

                    var someChecksFailed = false;
                    platformCheck.forEach(function(checkItem) {
                        var checkSummary = checkItem.name + ': ' +
                            (checkItem.installed ? 'installed ' : 'not installed ') +
                            (checkItem.metadata.version || '');
                        events.emit('log', checkSummary);
                        if (!checkItem.installed) {
                            someChecksFailed = true;
                            events.emit('warn', checkItem.metadata.reason);
                        }
                    });

                    return someChecksFailed;
                }).some(function(isCheckFailedForPlatform) {
                    return isCheckFailedForPlatform;
                });

                if (someChecksFailed) throw new NodeKitError('Some of requirements check failed');
            });
    } else if (cmd == 'serve') {
        var port = undashed[1];
        return nodekit.raw.serve(port);
    } else if (cmd == 'create') {
        return create();
    } else {
        // platform/plugins add/rm [target(s)]
        subcommand = undashed[1]; // sub-command like "add", "ls", "rm" etc.
        var targets = undashed.slice(2); // array of targets, either platforms or plugins
        var cli_vars = {};
        if (args.variable) {
            args.variable.forEach(function (s) {
                // CB-9171
                var eq = s.indexOf('=');
                if (eq == -1)
                    throw new NodeKitError('invalid variable format: ' + s);
                var key = s.substr(0, eq).toUpperCase();
                var val = s.substr(eq + 1, s.length);
                cli_vars[key] = val;
            });
        }
        var download_opts = { searchpath : args.searchpath
                            , noregistry : args.noregistry
                            , nohooks : args.nohooks
                            , cli_variables : cli_vars
                            , browserify: args.browserify || false
                            , fetch: args.fetch || false
                            , link: args.link || false
                            , save: args.save || false
                            , shrinkwrap: args.shrinkwrap || false
                            , force: args.force || false
                            };
        return nodekit.raw[cmd](subcommand, targets, download_opts);
    }

    function create() {
        var cfg;            // Create config
        var customApp;      // Template path
        var appCfg;         // Template config

        // If we got a fourth parameter, consider it to be JSON to init the config.
        if (undashed[4])
            cfg = JSON.parse(undashed[4]);
        else
            cfg = {};

        customApp = args['copy-from'] || args['link-to'] || args.template;

        if (customApp) {
            if (!args.template && !args['copy-from'] && customApp.indexOf('http') === 0) {
                throw new NodeKitError(
                    'Only local paths for custom app assets are supported for linking' + customApp
                );
            }

            // Resolve tilda
            if (customApp.substr(0,1) === '~')
                customApp = path.join(process.env.HOME,  customApp.substr(1));

            appCfg = {
                url: customApp,
                template: false,
                link: false
            };

            if (args['link-to']) {
                appCfg.link = true;
            }
            if (args.template) {
                appCfg.template = true;
            } else if (args['copy-from']) {
                logger.warn('Warning: --copy-from option is being deprecated. Consider using --template instead.');
                appCfg.template = true;
            }

            cfg.lib = cfg.lib || {};
            cfg.lib.app = appCfg;
        }
        return nodekit.raw.create( undashed[1]  // dir to create the project in
            , undashed[2] || 'org.example.' + undashed[1]  // App id
            , undashed[3] || undashed[1]  // App name
            , cfg
            , events || undefined
        );
    }
}
