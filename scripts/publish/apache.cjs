// A real Apache probe for the generated .htaccess, isolated on a loopback port.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const {spawn} = require('node:child_process');

async function apache(site, {binary = process.platform === 'darwin' ? '/usr/sbin/httpd' : '/usr/sbin/apache2'} = {}) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(),'doris-publish-apache-'));
    const socket = net.createServer();
    await new Promise(resolve => socket.listen(0,'127.0.0.1',resolve));
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    const moduleDir = process.platform === 'darwin' ? '/usr/libexec/apache2' : '/usr/lib/apache2/modules';
    const modules = ['mpm_event','unixd','authz_core','authz_host','mime','dir','rewrite','headers'];
    const config = [
        `ServerRoot "${directory}"`, `DefaultRuntimeDir "${directory}"`, `PidFile "${directory}/httpd.pid"`,
        `Listen 127.0.0.1:${port}`, 'ServerName 127.0.0.1',
        ...modules.filter(name => fs.existsSync(path.join(moduleDir,`mod_${name}.so`)))
            .map(name => `LoadModule ${name}_module "${moduleDir}/mod_${name}.so"`),
        `User ${os.userInfo().username}`, `Group #${process.getgid()}`, `ErrorLog "${directory}/error.log"`,
        'LogLevel warn', 'StartServers 1','ServerLimit 1','ThreadsPerChild 8','MaxRequestWorkers 8',
        `TypesConfig ${process.platform === 'darwin' ? '/etc/apache2/mime.types' : '/etc/mime.types'}`, `DocumentRoot "${path.resolve(site)}"`,
        `<Directory "${path.resolve(site)}">`, 'AllowOverride All','Require all granted','DirectoryIndex index.html','</Directory>',
    ].join('\n');
    const configFile = path.join(directory,'httpd.conf');
    fs.writeFileSync(configFile,config);
    const child = spawn(binary,['-f',configFile,'-D','FOREGROUND'],{stdio:['ignore','ignore','pipe']});
    let stderr = '', spawnError;
    const exited = new Promise(resolve => {
        child.once('exit', resolve);
        child.once('error', error => {spawnError = error; resolve();});
    });
    child.stderr.on('data',data => {stderr += data;});
    const origin = `http://127.0.0.1:${port}`;
    const close = async () => {
        if (!spawnError && child.exitCode === null && child.signalCode === null) {
            child.kill('SIGTERM');
            await exited;
        }
        fs.rmSync(directory,{recursive:true,force:true});
    };
    try {
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
            if (spawnError || child.exitCode !== null || child.signalCode !== null) throw new Error('Apache failed to start');
            try {
                await fetch(origin, {method: 'HEAD', signal: AbortSignal.timeout(250)});
                return {origin, directory, close};
            } catch {}
            await new Promise(resolve => setTimeout(resolve,50));
        }
        throw new Error('Apache did not respond within 5 seconds');
    } catch (error) {
        const log = path.join(directory, 'error.log');
        const diagnostic = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').slice(-8192) : '';
        await close();
        throw new Error([error.message, spawnError?.message, stderr.trim(), diagnostic.trim()].filter(Boolean).join('\n'));
    }
}
module.exports = {apache};
