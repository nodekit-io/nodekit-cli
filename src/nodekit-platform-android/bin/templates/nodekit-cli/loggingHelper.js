var NodeKitLogger = require('nodekit-cli')['nodekit-cli-common'].NodeKitLogger;

module.exports = {
    adjustLoggerLevel: function (opts) {
        if (opts instanceof Array) {
            opts.silent = opts.indexOf('--silent') !== -1;
            opts.verbose = opts.indexOf('--verbose') !== -1;
        }

        if (opts.silent) {
            NodeKitLogger.get().setLevel('error');
        }

        if (opts.verbose) {
            NodeKitLogger.get().setLevel('verbose');
        }
    }
};
