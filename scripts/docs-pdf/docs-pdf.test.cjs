const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const test = require('node:test');
const {parseOptions} = require('./cli.cjs');
const {normalize, addHeadingTargets} = require('./generate.cjs');
const cheerio = require('cheerio');
const {availableVersions, inventory, filename} = require('../docs-inventory.cjs');
const root = path.resolve(__dirname, '../..');
function fixture(t) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-pdf-test-'));
    t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
    const write = (file, text) => {const full = path.join(directory, file); fs.mkdirSync(path.dirname(full), {recursive: true}); fs.writeFileSync(full, text);};
    for (const locale of ['en', 'zh-CN']) {
        const current = locale === 'en' ? 'docs' : 'i18n/zh-CN/docusaurus-plugin-content-docs/current';
        const versioned = locale === 'en' ? 'versioned_docs/version-4.x' : 'i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x';
        for (const base of [current, versioned]) {
            write(`${base}/intro.md`, '---\ntitle: Intro\n---\nWelcome');
            write(`${base}/01-topic.md`, '---\ntitle: Topic\nslug: /custom-topic\n---\nTopic');
            write(`${base}/99-extra.md`, '# Extra\nOutside the sidebar');
        }
    }
    write('sidebars.ts', "const sidebars = {docs: [{type: 'category', label: 'Start', link: {type: 'doc', id: 'intro'}, items: ['topic']}]}; export default sidebars;");
    write('versioned_sidebars/version-4.x-sidebars.json', JSON.stringify({docs: ['intro', 'topic']}));
    return {directory, write};
}

test('version discovery and current alias use the actual local source roots', t => {
    const {directory} = fixture(t);
    assert.deepEqual(availableVersions(directory), ['dev', '4.x']);
    for (const version of ['dev', 'current', '4.x']) for (const locale of ['en', 'zh-CN']) {
        const docs = inventory(directory, version, locale);
        assert.deepEqual(docs.map(doc => doc.id), ['intro', 'topic', 'extra']);
        assert.equal(docs[1].route, `${locale === 'en' ? '' : '/zh-CN'}/docs/${version === 'current' ? 'dev' : version}/custom-topic`);
    }
    assert.equal(filename('current', 'zh-CN'), 'apache-doris-dev-zh-CN.pdf');
});

test('explicit CLI selection, locale subsets, output paths, and samples are retained', t => {
    const {directory} = fixture(t);
    const options = parseOptions(['--version', 'current', '--locale', 'zh-CN', '--output', 'folder with spaces', '--limit', '2', '--resume'], directory);
    assert.equal(options.version, 'dev');
    assert.deepEqual(options.locales, ['zh-CN']);
    assert.equal(options.limit, 2);
    assert.equal(options.resume, true);
    assert.equal(options.output, path.resolve('folder with spaces'));
    assert.deepEqual(parseOptions(['--version', '4.x'], directory).locales, ['en', 'zh-CN']);
});

test('invalid selections fail without creating files', t => {
    const {directory} = fixture(t);
    for (const args of [[], ['--version', '9.x'], ['--version', '../4.x'], ['--version', '4.x', '--locale', 'ja'],
        ['--version', '4.x', '--locale', 'en,en'], ['--version', '4.x', '--limit', '2'],
        ['--version', '4.x', '--limit', '-1', '--output', 'sample'], ['--version', '4.x', '--typo']]) assert.throws(() => parseOptions(args, directory));
    fs.rmSync(path.join(directory, 'i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x'), {recursive: true});
    assert.throws(() => parseOptions(['--version', '4.x'], directory), /Missing zh-CN source/);
    assert(!fs.existsSync(path.join(directory, 'output')));
    assert(!fs.existsSync(path.join(directory, 'tmp')));
});

test('CLI help and version listing do not load the renderer or create outputs', () => {
    const cli = path.join(__dirname, 'cli.cjs');
    const help = execFileSync(process.execPath, [cli, '--help'], {encoding: 'utf8'});
    assert(help.includes('--version'));
    const versions = execFileSync(process.execPath, [cli, '--list-versions'], {encoding: 'utf8'}).trim().split('\n');
    assert(versions.includes('dev') && versions.includes('4.x') && versions.includes('2.1'));
    const invalid = spawnSync(process.execPath, [cli, '--version', 'missing'], {encoding: 'utf8'});
    assert.equal(invalid.status, 1);
    assert(invalid.stderr.includes('Unknown documentation version'));
});

test('printing retains every tab/detail body and preserves fenced and inline examples', () => {
    const code = '```sql\nSELECT "<Tabs>";\n```\n\n```sh\nexport JAVA_TOOL_OPTIONS="x"\n```';
    const result = normalize('import Tabs from "@theme/Tabs";\n<Tabs>\n<TabItem label="S3">\nAWS\n</TabItem>\n<TabItem label="OSS">\nAliyun\n</TabItem>\n</Tabs>\n<details><summary>More</summary>\nHidden\n</details>\n' + code);
    assert(result.includes('### S3') && result.includes('### OSS') && result.includes('Hidden'));
    assert(result.includes(code));
    assert(!result.includes('import Tabs') && !result.includes('<TabItem'));
    assert.equal(normalize('Type: <INT>; literal: `<INT>`'), 'Type: &lt;INT&gt;; literal: `<INT>`');
});

test('current-version cards preserve titles/descriptions/links; animations remain usable links', () => {
    const result = normalize(`import GettingStartedCard from '@site/src/components/card';\n<GettingStartedCard title="What's Doris" description="Core features" link="quick-start" />\n<iframe src="/animations/intro.html" title="Doris animation"></iframe>`);
    assert(result.includes('What&#39;s Doris') && result.includes('Core features') && result.includes('(quick-start)'));
    assert(result.includes('[Doris animation](/animations/intro.html)'));
    assert(!result.includes('<GettingStartedCard') && !result.includes('<iframe'));
    assert.throws(() => normalize('import Widget from "./widget";\n<Widget />'), /Unsupported MDX component Widget/);
});

test('real current/active/historical inventories keep sidebar entries and outside-sidebar sources', () => {
    for (const version of availableVersions(root)) for (const locale of ['en', 'zh-CN']) {
        const docs = inventory(root, version, locale);
        assert(docs.length > 700);
        assert.equal(docs.length, new Set(docs.map(doc => doc.source)).size);
        assert(docs[0].id.includes('intro') || docs[0].id.includes('what-is-apache-doris'));
    }
});

test('custom heading IDs remain destinations and card links are not nested inside marker links', () => {
    const $ = cheerio.load('<article><h1>Title</h1><h2 id="stable-anchor">New heading</h2><h3 id="card"><a href="quick-start">Quick Start</a></h3></article>');
    const aliases = {};
    addHeadingTargets($, $('article'), 'doc-1', aliases);
    assert.equal(aliases['doc-1#stable-anchor'], 'doc-1#new-heading');
    assert.equal(aliases['doc-1#card'], 'doc-1#quick-start');
    assert.equal($('a[href="quick-start"]').length, 1);
    assert.equal($('a a').length, 0);
    assert.equal($('a[href^="https://archive.invalid/start/"]').length, 3);
});
