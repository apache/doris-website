const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const fs = require('node:fs');
const {inventory} = require('./inventory.cjs');
const redirects = require('../../config/archived-docs-redirects.cjs');
const {normalize} = require('./generate.cjs');
const root = path.resolve(__dirname, '../..');

test('every historical source page has a redirect; active versions have none', () => {
    for (const locale of ['en', 'zh-CN']) {
        const prefix = locale === 'en' ? '' : '/zh-CN';
        const targets = new Set(redirects(`${prefix}/archived-docs/`));
        for (const version of ['2.1', '2.0', '1.2']) {
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

test('printing expands all tabs and details without changing fenced SQL or shell examples', () => {
    const code = '```sql\nSELECT "<Tabs>";\n```\n\n```sh\nexport JAVA_TOOL_OPTIONS="x"\n```';
    const result = normalize('import Tabs from "@theme/Tabs";\n<Tabs>\n<TabItem value="a" label="S3">\nAWS\n</TabItem>\n<TabItem value="b" label="OSS">\nAliyun\n</TabItem>\n</Tabs>\n<details>\n<summary>More</summary>\nHidden\n</details>\n' + code);
    assert(result.includes('### S3'));
    assert(result.includes('### OSS'));
    assert(result.includes('Hidden'));
    assert(result.includes(code));
    assert(!result.includes('import Tabs'));
    assert(!result.includes('<TabItem'));
    assert.equal(normalize('Type: <INT>; literal: `<INT>`'), 'Type: &lt;INT&gt;; literal: `<INT>`');
});
