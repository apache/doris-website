const assets = require('../../config/restored-assets.json');
const path = require('node:path');
const {migrateDownloadUrls, missingDownloads} = require('../../src/utils/download-recovery');
const {messages} = require('../i18n/download-recovery-remark.cjs');

function rewriteAssetReferences(markdown, {locale = 'en'} = {}) {
    let result = markdown;
    for (const [previous, current] of Object.entries(assets)) {
        result = result.replaceAll(previous, current)
            .replaceAll(previous.replace(/^https:/, 'http:'), current);
    }
    // The recovered window-function fixture is an uncompressed TAR. Adjust
    // only its download pipeline, without editing the archived source snapshot.
    result = result.split('\n').map(line => line.includes('/media/static/doc_ddl_dir_d27a752a7b.tar')
        ? line.replace(/\btar(\s+-[A-Za-z]*J[A-Za-z]*)\b/g, (_, flags) => 'tar' + flags.replaceAll('J', ''))
        : line).join('\n');
    result = migrateDownloadUrls(result);
    if (missingDownloads(result).length) {
        const text = messages(path.resolve(__dirname, '../..'), locale);
        result = `> **${text.label}**\n>\n> ${text.notice}\n\n${result}`;
    }
    return result;
}

module.exports = {rewriteAssetReferences};
