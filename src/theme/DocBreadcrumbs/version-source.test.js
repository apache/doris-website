const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sourcePath = path.join(__dirname, 'index.tsx');

test('doc breadcrumb version comes from the current docs page context', () => {
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /useDocsVersion/);
    assert.doesNotMatch(source, /useActivePluginAndVersion/);
});
