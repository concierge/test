const cline = require('cline'),
    chalk = require('chalk');

class TestIntegrationApi extends shim {
    constructor (config) {
        super(config.commandPrefix);
        this._config = config;
    }

    sendMessage (text) {
        console.info(chalk.bold(`\r${text}`));
    }

    getUsers (thread) {
        const obj = {};
        if (thread == this._config.threadId) {
            obj[this._config.senderId] = {
                name: this._config.senderName
            };
        }
        return obj;
    }
};

class TestIntegration {
    constructor () {
        this._receivedCallback = null;
        this._cli = null;
        this._api = null;
        this._hasStartedShutdown = false;
        this._history = null;
    }

    static _ensureConfig (config, property, defaultValue) {
        if (!config[property]) {
            config[property] = defaultValue;
        }
    }

    start (callback) {
        TestIntegration._ensureConfig(this.config, 'threadId', 1);
        TestIntegration._ensureConfig(this.config, 'senderId', 0);
        TestIntegration._ensureConfig(this.config, 'historySize', 1024);
        TestIntegration._ensureConfig(this.config, 'commandHistory', []);
        TestIntegration._ensureConfig(this.config, 'senderName', 'TESTING');
        this.config.commandHistory = this.config.commandHistory.filter((i, p, a) => p === 0 || i !== a[p - 1]);
        this._history = this.config.commandHistory.slice(0);

        this._receivedCallback = callback;
        this._api = new TestIntegrationApi(this.config);

        this._cli = cline();
        this._cli.command('*', this._commandAny.bind(this));
        this._cli.command('history', this._commandHistory.bind(this));
        this._cli.on('close', this._onClose.bind(this));
        this._cli.history(this._history);
        setTimeout(() => this._cli.interact(`${this.platform.packageInfo.name}> `), 100);
    }

    stop () {
        this._hasStartedShutdown = true;
        this._cli.close();
    }

    _boundArray (input) {
        if (input) {
            this.config.commandHistory.push(input);
        }
        this.config.commandHistory.splice(0, this.config.commandHistory.length - this.config.historySize);
    }

    _commandAny (input) {
        if (/^set (senderName)|(senderId)|(threadId)|(logLevel) [^ ].*$/.test(input)) {
            const spl = input.split(' '),
                val = spl.slice(2).join(' ');
            if (spl[1] === 'logLevel')
                console.setLogLevel(val);
            else
                this.config[spl[1]] = val;
            this._api.sendMessage(`Set ${spl[1]} to "${val}"`, this.config.threadId);
            this._history.push(input);
        }
        else {
            const event = shim.createEvent(this.config.threadId, this.config.senderId, this.config.senderName, input);
            this._receivedCallback(this._api, event);
        }
        input = input.trim();
        const hist = this.config.commandHistory;
        if (!!input && input !== 'exit' && !this._hasStartedShutdown && hist[hist.length - 1] !== input) {
            this._boundArray(input);
        }
    }

    _commandHistory () {
        this._boundArray('history');
        const hist = this.config.commandHistory.join('\n');
        return this._api.sendMessage(hist, this.config.threadId);
    }

    _onClose () {
        if (!this._hasStartedShutdown) {
            this._hasStartedShutdown = true;
            this.platform.shutdown();
        }
    }

    getApi () {
        return this._api;
    }
};

module.exports = new TestIntegration();
