const spawn = require('child_process').spawn;

const _cmd = {
    cmd: '',
    args: [],
    spawn: function (cwd = process.cwd()) {
        const promise = new Promise((resolve, reject) => {
            const _name = this.toString();
            console.log(`spawning:: ${_name}`);
            const call = spawn(this.cmd, this.args, {env: process.env, shell: true, stdio: 'inherit', cwd});
            this.args = [];
            call.on('exit', (code) => {
                console.log(`spawning:: ${_name} code::${code}`);
                if (code === 0) {
                    resolve(0);
                } else {
                    reject(code);
                }
            });
            return call;
        });

        return promise;
    },
    toString: function () {
        return `${this.cmd} ${this.args.join(' ')}`;
    }
};

function npm () {

    const _npm = Object.create(_cmd);
    _npm.cmd = 'npm';

    // no-args
    const noargs = ['run', 'test'];
    noargs.forEach((m) => {
        Object.defineProperty(_npm, m, {
            get: function () {
                this.args.push(m);
                return this;
            }
        });
    });

    // single-arg fn
    ['prefix'].forEach((m) => {
        Object.defineProperty(_npm, m, {
            value: function (p) {
                this.args.push(`--${m}`, p);
                return this;
            }
        });

    });

    _npm.useScript = (...scripts) => {
        scripts.forEach((m) => {
            Object.defineProperty(_npm, m, {
                get: function () {
                    this.args.push(m);
                    return this;
                }
            });
        });
    };

    return _npm;
}

module.exports = npm;
module.exports.npm = npm();