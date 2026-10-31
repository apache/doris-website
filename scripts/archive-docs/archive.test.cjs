const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const {availableVersions, contentDirectory, inventory} = require('../docs-inventory.cjs');
const {versions, locales} = require('../../config/archived-docs.json');
const redirects = require('../../config/archived-docs-redirects.cjs');
const root = path.resolve(__dirname, '../..');

test('archived sources and metadata are kept outside active documentation trees', () => {
    for (const version of versions) {
        assert(availableVersions(root).includes(version));
        const sidebar = `versioned_sidebars/version-${version}-sidebars.json`;
        assert(!fs.existsSync(path.join(root, sidebar)), sidebar);
        assert(fs.existsSync(path.join(root, 'archived_docs', sidebar)), sidebar);
        const translation = `i18n/zh-CN/docusaurus-plugin-content-docs/version-${version}.json`;
        assert(!fs.existsSync(path.join(root, translation)), translation);
        assert(fs.existsSync(path.join(root, 'archived_docs', translation)), translation);
        for (const locale of locales) {
            const source = locale === 'en' ? `versioned_docs/version-${version}`
                : `i18n/${locale}/docusaurus-plugin-content-docs/version-${version}`;
            assert(!fs.existsSync(path.join(root, source)), source);
            const archived = path.join(root, 'archived_docs', source);
            assert(fs.statSync(archived).isDirectory());
            assert.equal(contentDirectory(root, version, locale), archived);
        }
    }
});

test('every historical source page has a redirect; active versions have none', () => {
    for (const locale of locales) {
        const prefix = locale === 'en' ? '' : '/zh-CN';
        const targets = new Set(redirects(`${prefix}/archived-docs/`));
        for (const version of versions) {
            const docs = inventory(root, version, locale);
            assert(docs.length > 700);
            assert.equal(docs.length, new Set(docs.map(doc => doc.source)).size);
            for (const doc of docs) assert(targets.has(doc.route), doc.route);
            assert(targets.has(`${prefix}/docs/${version}`));
            assert(targets.has(`${prefix}/docs/${version}/gettingStarted/what-is-new`));
        }
        assert(![...targets].some(route => /\/docs\/(?:dev|4\.x|3\.x)(?:\/|$)/.test(route)));
    }
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'versions.json'))), ['4.x', '3.x']);
});
