var cline = require('cline'),
    chalk = require('chalk'),
    historySize = 1024,
    receivedCallback = null,
    cli = null,
    api = null,
    hasStartedShutdown = false;

exports.getApi = function() {
    return api;
};

exports.start = function (callback) {
    receivedCallback = callback;

    if (!exports.config.threadId) {
        exports.config.threadId = 1;
    }
    if (!exports.config.senderId) {
        exports.config.senderId = 0;
    }
    if (!exports.config.senderName) {
        exports.config.senderName = 'TESTING';
    }
    if (!exports.config.commandHistory) {
        exports.config.commandHistory = [];
    }

    class TestIntegration extends shim {
        sendMessage(text) {
            console.log(chalk.bold('\r' + text));
        }

        getUsers(thread) {
            let obj = {};
            if (thread == exports.config.threadId) {
                obj[exports.config.senderId] = {
                    name: exports.config.senderName
                }
            }
            return obj;
        }
    }
    api = new TestIntegration(exports.config.commandPrefix);

    cli = cline();
    cli.command('*', function (input) {
        if (/^set (senderName)|(senderId)|(threadId) [^ ].*$/.test(input)) {
            var spl = input.split(' ');
            exports.config[spl[1]] = spl.slice(2).join(' ');
            return api.sendMessage('Set ' + spl[1] + ' to "' + exports.config[spl[1]] + '"', 'null');
        }

        var event = shim.createEvent(exports.config.threadId, exports.config.senderId, exports.config.senderName, input);
        receivedCallback(api, event);
        input = input.trim();
        if (input.length > 0 && input !== 'exit' && input !== 'history' && !hasStartedShutdown) {
            exports.config.commandHistory.push(input);
        }
    });

    cli.command('history', function () {
        var hist = exports.config.commandHistory,
            results = '';
        for (var i = 0; i < hist.length; i++) {
            results += hist[i] + (i + 1 === hist.length ? '' : '\n');
        }
        return api.sendMessage(results, exports.config.thread);
    });

    cli.on('close', function () {
        if (hasStartedShutdown) {
            return;
        }
        hasStartedShutdown = true;
        exports.platform.shutdown();
    });

    cli.history(exports.config.commandHistory.slice(0));
    setTimeout(function () {
        cli.interact(exports.platform.packageInfo.name + '> ');
    }, 100);
};

exports.stop = function () {
    hasStartedShutdown = true;
    cli.close();
    if (exports.config.commandHistory.length > historySize) {
        exports.config.commandHistory.splice(0, exports.config.commandHistory.length - historySize);
    }
};
