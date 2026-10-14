const fs = require('node:fs');
const path = require('node:path');
const {inventoryBaseline, pipelineLocale} = require('./state.cjs');

const root = path.resolve(__dirname, '../..');

// T03 inventory is a historical comparison only. Never use it to filter the
// native current-page enumeration. Each locale has its own snapshot, resolved
// from the translation configuration.
function baselineEntries(directory = inventoryBaseline(root, pipelineLocale(root))) {
    return ['dev', '4x', 'community'].flatMap(group => {
        const metadata = JSON.parse(fs.readFileSync(path.join(directory, `${group}.json`), 'utf8'));
        return metadata.entryFiles.flatMap(shard => JSON.parse(fs.readFileSync(path.join(directory, shard), 'utf8')).entries);
    });
}

module.exports = {baselineEntries};
