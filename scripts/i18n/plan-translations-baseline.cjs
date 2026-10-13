const fs = require('node:fs');
const path = require('node:path');

// T03 inventory is a historical comparison only. Never use it to filter the
// native current-page enumeration.
function baselineEntries(directory = path.resolve(__dirname, '../../translations/inventory/ja/2026-10-12')) {
    return ['dev', '4x', 'community'].flatMap(group => {
        const metadata = JSON.parse(fs.readFileSync(path.join(directory, `${group}.json`), 'utf8'));
        return metadata.entryFiles.flatMap(shard => JSON.parse(fs.readFileSync(path.join(directory, shard), 'utf8')).entries);
    });
}

module.exports = {baselineEntries};
