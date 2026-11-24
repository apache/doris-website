const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {isDownloadAvailable, migrateDownloadUrls, missingDownloads} = require('../../../src/utils/download-recovery');
const recovery = require('../../../config/download-recovery.json');
const key = 'apache-doris-4.1.5-bin-x64.tar.gz';

test('unrestored distributions remain unavailable until their exact file is verified', () => {
    assert.equal(isDownloadAvailable(recovery.baseUrl + key), false);
    const valid = {bytes: 123, sha256: 'a'.repeat(64), verified: true};
    const catalog = {...recovery, objects: {[key]: valid}};
    assert.equal(isDownloadAvailable(recovery.baseUrl + key, catalog), true);
    assert.equal(isDownloadAvailable(recovery.baseUrl + key + '.asc', catalog), false);
    for (const change of [{verified: false}, {verified: 'true'}, {bytes: 0}, {bytes: -1}, {sha256: 'unknown'}]) {
        assert.equal(isDownloadAvailable(recovery.baseUrl + key,
            {...catalog, objects: {[key]: {...valid, ...change}}}), false);
    }
});

test('retired storage and unexpected managed URLs cannot become active download links', () => {
    for (const url of [undefined, '', 'not a URL', 'javascript:alert(1)',
        'https://apache-doris-releases.oss-accelerate.aliyuncs.com/' + key,
        'http://apache-doris-releases.oss-cn-hangzhou.aliyuncs.com/' + key,
        recovery.baseUrl.replace('https:', 'http:') + key,
        'https://assets-cdn.selectdb.com/wrong/' + key,
        recovery.baseUrl + key + '?token=unused', recovery.baseUrl + key + '#fragment']) {
        assert.equal(isDownloadAvailable(url), false, String(url));
    }
});

test('independent source and Maven downloads retain their existing behavior', () => {
    for (const url of ['https://downloads.apache.org/doris/4.1/4.1.5/apache-doris-4.1.5-rc03-src.tar.gz',
        'https://repository.apache.org/content/repositories/releases/org/apache/doris/example.jar']) {
        assert.equal(isDownloadAvailable(url), true);
    }
});

test('the catalogue and recovery receipts use the same distribution base URL', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../src/constant/download.data.ts'), 'utf8');
    assert.equal(source.match(/export const ORIGIN = '([^']+)'/)[1], recovery.baseUrl);
});

test('archive PDFs retain their independent prefix rather than becoming release-package links', () => {
    const old = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/archived-docs/apache-doris-2.1-en.pdf';
    const current = migrateDownloadUrls(old);
    assert.equal(current, 'https://assets-cdn.selectdb.com/downloads/archived-docs/apache-doris-2.1-en.pdf');
    assert.deepEqual(missingDownloads(current), []);
});
