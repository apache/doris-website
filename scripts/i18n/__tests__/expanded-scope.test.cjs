const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity, stateFileFor} = require('../state.cjs');
const {structure} = require('../structure.cjs');
const {protectionSignature} = require('../protection.cjs');
const {extractUnits, translateDocument, managedPath} = require('../translation-engine.cjs');
const {contentGroups, sourceFiles, hasProse, pageFor, collectSources, translatedContentPages} = require('../source-groups.cjs');
const {localizedSource} = require('../content-loader.cjs');
const {relevantPush} = require('../workflow-scan.cjs');
const {collect} = require('../inventory.cjs');
const {audit} = require('../audit-coverage.cjs');
const {plan} = require('../plan-translations.cjs');
const {prepare, readState, applyCandidates, targetFor} = require('../translate-docs.cjs');
const {managedTarget} = require('../workflow-prs.cjs');

const repo = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(repo, file), 'utf8');
const glossary = {schemaVersion: 1, version: 'fixture', keep: [], terms: []};
const adapter = {model: 'fixture', async translate({units}) {
    return {translations: units.map(unit => ({id: unit.id, text: `日本語 ${unit.text}`}))};
}};
const translate = (source, extension) => translateDocument({source, extension, adapter, glossary,
    targetLocale: 'ja', targetScriptPattern: '[日]', maxDocumentChars: 300000});

test('all existing course modules, course/Hackathon UI and weekly reports translate without changing code', async () => {
    const groups = contentGroups(repo, 'ja');
    const files = groups.flatMap(group => sourceFiles(repo, group).filter(file => hasProse(repo, group, file)))
        .concat(fs.readdirSync(path.join(repo, 'course/101')).map(name => `course/101/${name}`));
    assert(files.some(file => file.endsWith('CourseLanding.tsx')));
    assert(files.some(file => file.endsWith('a1HybridSearch.tsx')));
    assert(!files.some(file => file.includes('_TEMPLATE') || /\.test\./.test(file)));
    for (const file of files) {
        const source = read(file), extension = path.extname(file);
        const result = await translate(source, extension);
        assert(result.targetChanged, file);
        assert.equal(protectionSignature(await structure(result.target, extension)),
            protectionSignature(await structure(source, extension)), file);
    }
});

test('JSX text is escaped, object keys/URLs/SQL/logic are immutable, and updates reuse unchanged units', async () => {
    const source = `import React from 'react';
const data = {"title": "A title", href: '/course/101/start', sql: 'SELECT 1;', count: 3};
export default function Page(){ return <section className={'fixed'} aria-label="A label"><h1>Start here</h1><code>SELECT 1;</code><p>{data.title}</p></section>; }
`;
    const units = await extractUnits(source, '.tsx');
    assert.deepEqual(units.map(unit => unit.text), ['A title', 'A label', 'Start here']);
    const result = await translateDocument({source, extension: '.tsx', glossary, targetLocale: 'ja', targetScriptPattern: '[日]',
        adapter: {async translate({units}) {return {translations: units.map(unit => ({id: unit.id, text: `日本語 <>&{}" ${unit.text}`}))};}}});
    assert(result.target.includes('&lt;&gt;&amp;&#123;&#125;&quot;'));
    assert(result.target.includes('"title":'));
    for (const change of [text => text.replace('SELECT 1;', 'SELECT 2;'), text => text.replace("'/course/101/start'", "'/evil'"),
        text => text.replace("className={'fixed'}", "className={'changed'}"), text => text.replace('count: 3', 'count: 4')]) {
        assert.notEqual(protectionSignature(await structure(change(result.target), '.tsx')), protectionSignature(await structure(source, '.tsx')));
    }
    const updated = source.replace('Start here', 'Continue here');
    let requested;
    const next = await translateDocument({source: updated, extension: '.tsx', previousSource: source, previousTarget: result.target,
        glossary, targetLocale: 'ja', targetScriptPattern: '[日]', adapter: {async translate({units}) {
            requested = units; return {translations: units.map(unit => ({id: unit.id, text: `日本語 ${unit.text}`}))};
        }}});
    assert.deepEqual(requested.map(unit => unit.text), ['Continue here']);
    assert.equal(next.reusedUnits, 2);
});

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'expanded-translation-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, text) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), text);};
    fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'));
    write('translations/config.json', read('translations/config.json'));
    for (const locale of ['ja', 'ko', 'ru']) {
        const scope = JSON.parse(read(`translations/scope/${locale}.json`));
        scope.groups = scope.groups.filter(group => !['DEV', '4X', 'COMMUNITY'].includes(group.id));
        scope.retainSidebarLabels = [];
        write(`translations/scope/${locale}.json`, JSON.stringify(scope));
        write(`translations/state/${locale}/docs.json`, '{"schemaVersion":1,"pages":[]}');
        write(`translations/state/${locale}/resolved-deletions.json`, '{"schemaVersion":1,"deletions":[]}');
    }
    write('course/lesson.mdx', '---\ntitle: Course\n---\n\nLearn Doris.\n');
    write('releasenotes/release.md', '---\ntitle: Release\n---\n\nRelease details.\n');
    write('src/components/course/CourseLanding.tsx', "import React from 'react'; export default function Course(){return <h1>Learn Doris</h1>;}\n");
    write('src/components/community-report-next/Report.tsx', "import React from 'react'; export default function Report(){return <h1>Weekly report</h1>;}\n");
    write('src/pages/community-report/_reports/2026-10-12.mdx', 'export const label = "Week 42";\n\nexport const report = {summary:{lead:"This week"},refs:[{num:123,url:"https://github.com/apache/doris/pull/123",title:"A feature"}]};\n');
    write('src/pages/community-report/_reports/_TEMPLATE.mdx', 'Not published.\n');
    write('src/pages/index.tsx', "import React from 'react'; import Course from '../components/course/CourseLanding'; export default function Home(){return <Course/>;}\n");
    write('versions.json', '[]');
    for (const file of ['sidebars.ts', 'sidebarsCommunity.json', 'sidebarsCourse.ts', 'sidebarsReleases.json', 'versioned_sidebars/version-4.x-sidebars.json']) write(file, '{}');
    write('docusaurus.config.js', `module.exports={title:'Fixture',url:'https://doris.apache.org',baseUrl:'/',trailingSlash:true,
i18n:{defaultLocale:'en',locales:['en','zh-CN','ja','ko','ru']},
plugins:[require(${JSON.stringify(path.join(repo, 'scripts/i18n/content-plugin.cjs'))}),
[require(${JSON.stringify(path.join(repo, 'scripts/i18n/docs-plugin.cjs'))}),{id:'course',path:'course',routeBasePath:'course',sidebarPath:false}],
[require(${JSON.stringify(path.join(repo, 'scripts/i18n/docs-plugin.cjs'))}),{id:'releases',path:'releasenotes',routeBasePath:'releases',sidebarPath:false}]],
presets:[['classic',{docs:false,blog:false}]]};\n`);
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.com');
    const commit = () => {git('add', '.'); git('commit', '-qm', 'fixture'); return git('rev-parse', 'HEAD');};
    return {root, write, git, commit};
}

test('native discovery, scheduling, planning and generation recognize all three content classes and source updates', async t => {
    const {root, write, git, commit} = fixture(t);
    const previousLocale = process.env.I18N_LOCALE;
    process.env.I18N_LOCALE = 'ja';
    t.after(() => {if (previousLocale === undefined) delete process.env.I18N_LOCALE; else process.env.I18N_LOCALE = previousLocale;});
    const sourceCommit = commit();
    const baseline = path.join(root, 'baseline');
    write('baseline/summary.json', JSON.stringify({sourceCommit}));
    for (const name of ['dev', '4x', 'community']) write(`baseline/${name}.json`, '{"entryFiles":[]}');
    const scope = JSON.parse(fs.readFileSync(path.join(root, 'translations/scope/ja.json'), 'utf8'));
    const native = await collect(root);
    assert.deepEqual(new Set(native.pages.map(page => page.pluginId)), new Set(scope.groups.map(group => group.pluginId)));
    let report = await audit({root, sourceRef: sourceCommit, baseline, native});
    const options = {scope, records: new Map(), active: {schemaVersion: 1, candidates: []},
        readCurrent: file => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : null,
        readAt: (ref, file) => {try {return git('show', `${ref}:${file}`) + '\n';} catch {return null;}}};
    let planned = await plan({...options, report});
    assert.equal(planned.selected.length, 5);
    for (const task of planned.tasks) {
        assert(relevantPush([task.sourcePath], report, scope), task.sourcePath);
        assert(managedTarget(scope, task.targetPath), task.targetPath);
        assert.equal(managedPath(scope, task), task.targetPath);
    }
    const task = planned.tasks.find(task => task.pluginId === 'community-report');
    const state = readState(root, 'ja');
    const candidate = await prepare({root, plan: planned, taskId: task.id, scope, state, adapter,
        glossary, target: targetFor(root, 'ja')});
    applyCandidates(state, [candidate]);
    assert(candidate.target.includes('日本語 This week'));
    assert(candidate.target.includes('num:123'));
    assert(candidate.target.includes('https://github.com/apache/doris/pull/123'));
    commit();
    const source = fs.readFileSync(path.join(root, task.sourcePath), 'utf8');
    write(task.sourcePath, source.replace('This week', 'A new development this week'));
    const changedCommit = commit();
    report = await audit({root, sourceRef: changedCommit, baseline, native: await collect(root)});
    planned = await plan({...options, report, records: new Map([[identity(candidate.record), candidate.record]])});
    assert.equal(planned.tasks.find(item => item.sourcePath === task.sourcePath).kind, 'update');
    assert(relevantPush([task.sourcePath], report, scope));
});

test('the render loader uses only current reviewed translations, watches missing targets and rejects executable changes', async t => {
    const {root, write} = fixture(t);
    const group = contentGroups(root, 'ja').find(group => group.pluginId === 'course-ui');
    const sourcePath = 'src/components/course/CourseLanding.tsx';
    const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
    const page = pageFor(group, sourcePath, 'ja');
    const input = {root, locale: 'ja', file: path.join(root, sourcePath), source};
    const dependencies = [];
    assert.equal(await localizedSource({...input, dependency: file => dependencies.push(file)}), source);
    assert(dependencies.includes(path.join(root, page.targetPath)));
    const target = (await translate(source, '.tsx')).target;
    const record = {...page, sourceHash: hash(source), targetHash: hash(target), sourceCommit: 'a'.repeat(40),
        sourceTechnicalHash: (await structure(source, '.tsx')).technicalHash, reviewStatus: 'machine', ownership: 'machine',
        translatedAt: '2026-10-23T00:00:00Z', glossaryVersion: 'fixture'};
    write(page.targetPath, target);
    const save = () => write(stateFileFor(page), JSON.stringify({schemaVersion: 1, page: record}));
    save();
    assert.equal(await localizedSource(input), target);
    assert(translatedContentPages(root, 'ja').includes('/course'));
    assert.equal(await localizedSource({...input, source: source.replace('Learn Doris', 'Learn more')}), source.replace('Learn Doris', 'Learn more'));
    assert.equal(await localizedSource({...input, locale: 'en'}), source);
    const tampered = target.replace('<h1>', '<h1 onClick={() => alert(1)}>');
    write(page.targetPath, tampered); record.targetHash = hash(tampered); save();
    await assert.rejects(() => localizedSource(input), /Protected executable content/);
});

test('a later scan discovers new report dates and course route modules while keeping other site pages outside the scope', async t => {
    const {root, write} = fixture(t);
    const before = await collectSources(root, 'ja');
    write('src/pages/course/new-task.tsx', "export default function Task(){return <h1>A new task</h1>;}\n");
    write('src/pages/community-report/_reports/2026-10-19.mdx', 'export const label = "Week 43";\n\nexport const report = {summary:{lead:"Next week"}};\n');
    write('src/pages/unrelated.tsx', "export default function Page(){return <h1>Outside the scope</h1>;}\n");
    const after = await collectSources(root, 'ja');
    const added = after.pages.filter(page => !before.pages.some(previous => identity(previous) === identity(page)));
    assert.deepEqual(new Set(added.map(page => page.sourcePath)), new Set([
        'src/pages/course/new-task.tsx', 'src/pages/community-report/_reports/2026-10-19.mdx']));
    assert(added.every(page => page.status === 'untranslated'));
    const scope = JSON.parse(fs.readFileSync(path.join(root, 'translations/scope/ja.json'), 'utf8'));
    assert.throws(() => managedPath(scope, {...added[0], sourcePath: 'src/pages/unrelated.tsx'}), /managed include/);
});

test('production builds render translated course TSX and report exports without changing the English build',
    {skip: process.env.I18N_VERIFY_CONTENT_BUILD !== 'true'}, async t => {
        const {root, write} = fixture(t);
        write('src/pages/index.tsx', `import React from 'react';
import Course from '../components/course/CourseLanding';
import Report from '../components/community-report-next/Report';
import {report} from './community-report/_reports/2026-10-12.mdx';
export default function Home(){return <main><Course/><Report/><p>{report.summary.lead}</p></main>;}\n`);
        for (const group of contentGroups(root, 'ja')) for (const file of sourceFiles(root, group)) {
            const source = fs.readFileSync(path.join(root, file), 'utf8');
            const page = pageFor(group, file, 'ja'), target = (await translate(source, path.extname(file))).target;
            write(page.targetPath, target);
            const record = {...page, sourceHash: hash(source), targetHash: hash(target), sourceCommit: 'a'.repeat(40),
                sourceTechnicalHash: (await structure(source, path.extname(file))).technicalHash,
                reviewStatus: 'machine', ownership: 'machine', translatedAt: '2026-10-23T00:00:00Z', glossaryVersion: 'fixture'};
            write(stateFileFor(page), JSON.stringify({schemaVersion: 1, page: record}));
        }
        for (const locale of ['ja', 'en']) {
            const output = path.join(root, `build-${locale}`);
            const result = require('node:child_process').spawnSync(process.execPath,
                [path.join(repo, 'node_modules/@docusaurus/core/bin/docusaurus.mjs'), 'build', root, '--locale', locale, '--out-dir', output],
                {cwd: root, encoding: 'utf8', env: {...process.env, NODE_ENV: 'production'}, maxBuffer: 16 * 1024 * 1024});
            assert.equal(result.status, 0, (result.stdout + result.stderr).slice(-12000));
            const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
            for (const message of ['Learn Doris', 'Weekly report', 'This week'])
                assert(html.includes(locale === 'ja' ? `日本語 ${message}` : message), `${locale}: ${message}`);
            if (locale === 'en') assert(!html.includes('日本語'));
        }
    });
