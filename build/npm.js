const spawn = require('child_process').spawn;

const npm = {
    cmd: 'npm',
    args: [],
    spawn: function (cwd = __dirname) {
        const promise = new Promise((resolve, reject) => {
            const call = spawn(this.cmd, this.args, {env: process.env, shell: true, stdio: 'inherit', cwd});
            this.args = [];
            call.on('exit', function (code) {
                console.log(`${this.cmd} exited with code ` + code.toString());
                if (code === 0) {
                    resolve(0);
                } else {
                    reject(code);
                }
            });

            return call;
        });

        return promise;
    }
};

Object.defineProperty(npm, 'run', {
    get: function () {
        this.args.push('run');
        return this;
    }
});

Object.defineProperty(npm, 'compile', {
    get: function () {
        this.args.push('compile');
        return this;
    }
});

Object.defineProperty(npm, 'test', {
    get: function () {
        this.args.push('test');
        return this;
    }
});

Object.defineProperty(npm, 'prefix',
    {
        value: function (p) {
            this.args.push('--prefix');
            this.args.push(p);
            return this;
        }
    }
);

module.exports = npm;