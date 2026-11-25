const recovery = require('../../config/download-recovery.json');
const archive = require('../../config/archived-docs.json');
const retiredHost = /https?:\/\/apache-doris-releases\.oss[^.\s/]*\.aliyuncs\.com(?=\/|[\s"'`]|$)/g;
const retiredArchive = /https?:\/\/apache-doris-releases\.oss[^.\s/]*\.aliyuncs\.com\/archived-docs(?=\/|[\s"'`]|$)/g;

function migrateDownloadUrls(value, catalog = recovery) {
    return value.replace(retiredArchive, archive.baseUrl.replace(/\/$/, ''))
        .replace(retiredHost, catalog.baseUrl.replace(/\/$/, ''));
}

function missingDownloads(value, catalog = recovery) {
    const escaped = catalog.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const urls = migrateDownloadUrls(value, catalog).match(new RegExp(escaped + '[^\\s"\'`<>\\])]+', 'g')) ?? [];
    return urls.map(url => url.replace(/[.,;:]+$/, '')).filter(url => !isDownloadAvailable(url, catalog));
}

// Apply the configured availability policy only to our distribution storage. Other publishers' source,
// Maven and GitHub URLs retain their existing behavior.
function isDownloadAvailable(value, catalog = recovery) {
    if (!value || typeof value !== 'string') return false;
    let url, base;
    try {url = new URL(value); base = new URL(catalog.baseUrl);} catch {return false;}
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (/^apache-doris-releases\.oss[^.]*\.aliyuncs\.com$/.test(url.hostname)) return false;
    if (url.hostname !== base.hostname) return true;
    if (url.origin !== base.origin || !value.startsWith(catalog.baseUrl) || url.search || url.hash) return false;
    const key = value.slice(catalog.baseUrl.length);
    if (!key || key.endsWith('/')) return false;
    if (catalog.availability === 'public') return true;
    if (!catalog.objects || !Object.prototype.hasOwnProperty.call(catalog.objects, key)) return false;
    const object = catalog.objects[key];
    return object?.verified === true && Number.isSafeInteger(object.bytes) && object.bytes > 0
        && typeof object.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(object.sha256);
}

module.exports = {isDownloadAvailable, migrateDownloadUrls, missingDownloads};
