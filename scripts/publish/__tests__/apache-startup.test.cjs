const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {apache} = require('../apache.cjs');

test('Apache startup failures expose the error log and clean up their runtime directory', async t => {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'apache-startup-test-'));
    t.after(() => fs.rmSync(site, {recursive: true, force: true}));
    const binary = path.join(site, 'fake-apache');
    const captured = path.join(site, 'runtime-directory');
    fs.writeFileSync(binary, `#!${process.execPath}
const fs = require('node:fs'), path = require('node:path');
const config = fs.readFileSync(process.argv[process.argv.indexOf('-f') + 1], 'utf8');
const log = config.match(/ErrorLog "([^"]+)"/)[1];
fs.writeFileSync(${JSON.stringify(captured)}, path.dirname(log));
fs.writeFileSync(log, 'AH01597: missing MIME configuration');
process.exit(1);
`, {mode: 0o755});
    await assert.rejects(apache(site, {binary}), /AH01597: missing MIME configuration/);
    assert.equal(fs.existsSync(fs.readFileSync(captured, 'utf8')), false);
});
