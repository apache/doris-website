const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {createHash} = require('node:crypto');
const {verifyPublicIdentity} = require('../verify-first-release.cjs');
test('public acceptance binds a clean complete optimized artifact to deployment identities', t => {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'release-identity-'));
    t.after(() => fs.rmSync(site, {recursive: true, force: true}));
    const sha = 'a'.repeat(40), empty = createHash('sha256').update('').digest('hex');
    const options = {publicOrigin: 'https://doris.apache.org', landingOnly: false, sourceSha: sha, sha, asfSha: 'b'.repeat(40),
        runUrl: 'https://github.com/apache/doris-website/actions/runs/123', site,
        report: {success: true, source: {sha, trackedDiffHash: empty}, locales: ['en', 'zh-CN', 'ja', 'ko', 'ru'].map(locale => ({locale})), optimization: {verification: {files: 100}}}};
    assert.doesNotThrow(() => verifyPublicIdentity(options));
    assert.throws(() => verifyPublicIdentity({...options, landingOnly: true}), /complete artifact/);
    assert.throws(() => verifyPublicIdentity({...options, sha: 'c'.repeat(40)}));
    assert.throws(() => verifyPublicIdentity({...options, report: {...options.report, validation: {mode: 'sample'}}}), /Sample compilation/);
    assert.throws(() => verifyPublicIdentity({...options, report: {...options.report, source: {sha, trackedDiffHash: 'dirty'}}}), /clean/);
    fs.writeFileSync(path.join(site, '.ci-validation.json'), '{}');
    assert.throws(() => verifyPublicIdentity(options), /sample cannot establish/i);
});
