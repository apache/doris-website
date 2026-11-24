const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {isDownloadAvailable, migrateDownloadUrls, missingDownloads} = require('../../../src/utils/download-recovery');
const recovery = require('../../../config/download-recovery.json');
const key = 'apache-doris-4.1.5-bin-x64.tar.gz';
const staged = {...recovery, baseUrl: 'https://assets-cdn.selectdb.com/downloads/releases/',
    availability: 'verified', objects: {}};

test('unrestored distributions remain unavailable until their exact file is verified', () => {
    assert.equal(isDownloadAvailable(staged.baseUrl + key, staged), false);
    const valid = {bytes: 123, sha256: 'a'.repeat(64), verified: true};
    const catalog = {...staged, objects: {[key]: valid}};
    assert.equal(isDownloadAvailable(staged.baseUrl + key, catalog), true);
    assert.equal(isDownloadAvailable(staged.baseUrl + key + '.asc', catalog), false);
    for (const change of [{verified: false}, {verified: 'true'}, {bytes: 0}, {bytes: -1}, {sha256: 'unknown'}]) {
        assert.equal(isDownloadAvailable(staged.baseUrl + key,
            {...catalog, objects: {[key]: {...valid, ...change}}}), false);
    }
});

test('the public release mirror restores package, signature, checksum and tool links without per-file receipts', () => {
    assert.equal(recovery.baseUrl, 'https://apache-doris-downloads.oss-accelerate.aliyuncs.com/');
    assert.equal(recovery.availability, 'public');
    for (const file of [key, key + '.asc', key + '.sha512', 'extension/logstash-output-doris-1.2.0.gem']) {
        assert.equal(isDownloadAvailable(recovery.baseUrl + file), true, file);
    }
    assert.deepEqual(missingDownloads('wget https://apache-doris-releases.oss-accelerate.aliyuncs.com/' + key), []);
});

test('retired storage and unexpected managed URLs cannot become active download links', () => {
    for (const url of [undefined, '', 'not a URL', 'javascript:alert(1)',
        'https://apache-doris-releases.oss-accelerate.aliyuncs.com/' + key,
        'http://apache-doris-releases.oss-cn-hangzhou.aliyuncs.com/' + key,
        staged.baseUrl.replace('https:', 'http:') + key,
        'https://assets-cdn.selectdb.com/wrong/' + key,
        staged.baseUrl + key + '?token=unused', staged.baseUrl + key + '#fragment']) {
        assert.equal(isDownloadAvailable(url, staged), false, String(url));
    }
});

test('public mirror links still reject empty paths, directory listings and unexpected URL components', () => {
    for (const url of [undefined, '', recovery.baseUrl, recovery.baseUrl + 'extension/',
        recovery.baseUrl.replace('https:', 'http:') + key,
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
    assert.equal(current, 'https://apache-doris-downloads.oss-accelerate.aliyuncs.com/doris-website/docs/archived/apache-doris-2.1-en.pdf');
    assert.deepEqual(missingDownloads(current), []);
});
