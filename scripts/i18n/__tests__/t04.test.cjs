const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {buildScope} = require('../build-scope.cjs');
const {localizedPages} = require('../search-plugin.cjs');
const {sidebarAudit} = require('../audit-coverage.cjs');
const {structure,alignHeadings} = require('../structure.cjs');
const {protectionSignature} = require('../protection.cjs');
const versions = ['4.x','3.x','2.1'];

test('PR build scope separates content locales, shared inputs, and retired versions', () => {
    const managed = ['ja'];
    assert.deepEqual(buildScope(['docs/a.md'],versions).locales,['en']);
    assert.deepEqual(buildScope(['i18n/zh-CN/docusaurus-plugin-content-docs/current/a.md'],versions).locales,['zh-CN']);
    const japanese = buildScope(['i18n/ja/docusaurus-plugin-content-docs/version-4.x/a.md'],versions,managed);
    assert.deepEqual(japanese.locales,['ja']);
    assert.equal(japanese.docs_versions,'4.x');
    assert.equal(japanese.enabled_locales,'ja');
    // A Japanese-only change builds Japanese alone, so cross-locale
    // verification must know the artifact is a subset.
    assert.equal(japanese.partial_build,true);
    assert.equal(buildScope(['docs/a.md'],versions).partial_build,true);
    assert.equal(buildScope(['sidebars.ts'],versions).partial_build,false);
    const shard = 'translations/state/ja/pages/default/4.x/guide.json';
    const stateOnly = buildScope([shard],versions,managed);
    assert.deepEqual(stateOnly.locales,['ja']);
    assert.equal(stateOnly.docs_versions,'4.x');
    assert.deepEqual(stateOnly.json,[shard]);
    assert.deepEqual(buildScope(['sidebars.ts'],versions).locales,['en','zh-CN','ja']);
    assert.deepEqual(buildScope(['.github/workflows/cron-deploy-website.yml'],versions).locales,['en','zh-CN','ja']);
    assert.deepEqual(buildScope(['.github/workflows/manual-deploy-website.yml'],versions).locales,['en','zh-CN','ja']);
    assert.equal(buildScope(['versions.json'],versions).need_full_build,true);
    assert.deepEqual(buildScope(['versioned_docs/version-1.2/a.md'],versions).retired,['1.2']);
    // Only a managed locale renders dictionary changes, so only its dictionary
    // change needs a build.
    assert.equal(buildScope(['i18n/ja/code.json'],versions,managed).skip_build,false);
    assert.equal(buildScope(['i18n/ja/code.json'],versions).skip_build,true);
    assert.equal(buildScope(['i18n/zh-CN/code.json'],versions,managed).skip_build,true);
    assert.deepEqual(buildScope(['translations/config.json'],versions,managed).locales,['ja']);
    assert.throws(() => buildScope(['i18n/fr/docusaurus-plugin-content-docs/current/a.md'],versions),/Unconfigured/);
    assert.throws(() => buildScope(['translations/state/fr/docs.json'],versions,managed),/Unconfigured/);
});

test('publication changes exercise the complete optimized artifact on CI', () => {
    for (const file of ['scripts/publish/optimize.cjs','scripts/build-locales.cjs',
        'config/ssrTemplate.js','static/js/brand-theme-bootstrap.js']) {
        const scope = buildScope([file],versions,['ja']);
        assert.equal(scope.optimize_publish,true,file);
        assert.equal(scope.docs_versions,'',file);
        assert.equal(scope.need_full_build,true,file);
        assert.deepEqual(scope.locales,['en','zh-CN','ja']);
    }
    assert.equal(buildScope(['docs/example.md'],versions).optimize_publish,false);
});

test('A localized index admits only current, reviewed and in-scope native targets', () => {
    const page = (pluginId,version,status='current',indexable=true,locale='ja') => ({pluginId,version,status,indexable,useTarget:true,locale,
        permalink:`/${locale}/${pluginId}/${version}/${status}/${indexable}/`});
    const pages = [page('default','current'),page('default','4.x'),page('community','current'),
        page('default','3.x'),page('default','current','stale_unknown'),page('default','current','current',false)];
    const found = localizedPages([{name:'docusaurus-plugin-content-docs',content:{translationManifest:{pages}}}],'ja');
    assert.deepEqual([...found.values()],['docs/dev','docs/4.x','community']);
    // Another locale's pages never enter this locale's index.
    assert.equal(localizedPages([{name:'docusaurus-plugin-content-docs',content:{translationManifest:{pages:pages.concat(page('default','current','current',true,'ko'))}}}],'ja').size,3);
    assert.equal(localizedPages([{name:'docusaurus-plugin-content-docs',content:{translationManifest:{pages}}}],'ko').size,0);
});

test('sidebar audit discovers new native keys without a snapshot allowlist', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(),'japanese-sidebar-test-'));
    try {
        const dir = path.join(root,'i18n/ja/docusaurus-plugin-content-docs');
        fs.mkdirSync(dir,{recursive:true});
        fs.writeFileSync(path.join(dir,'current.json'),JSON.stringify({'sidebar.docs.category.Existing':{message:'既存'}}));
        const native = {labels:[{pluginId:'default',files:[{path:'current',content:{
            'sidebar.docs.category.Existing':{message:'Existing'},'sidebar.docs.category.New':{message:'New'}}}]}]};
        const entries = sidebarAudit(native,root,{groups:[{id:'DEV',pluginId:'default',version:'current'}]});
        assert.equal(entries.length,2);
        assert.equal(entries.find(entry => entry.key.endsWith('.New')).state,'missing');
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('protected Japanese changes reject SQL and route edits but allow translated prose', async () => {
    const en = '---\ntitle: English\nlanguage: en\n---\n\n# Overview\n\nHello [guide](next.md).\n\n```sql\nSELECT 1;\n```\n';
    const ja = '---\ntitle: 日本語\nlanguage: ja\n---\n\n# 概要 {#overview}\n\nこんにちは [ガイド](next.md)。\n\n```sql\nSELECT 1;\n```\n';
    const source = await structure(en,'.md');
    const candidate = await structure(await alignHeadings(source,ja,'.md'),'.md');
    assert.equal(protectionSignature(candidate),protectionSignature(source));
    const broken = await structure(await alignHeadings(source,ja.replace('SELECT 1','SELECT 2'),'.md'),'.md');
    assert.notEqual(protectionSignature(broken),protectionSignature(source));
    const wrongLink = await structure(await alignHeadings(source,ja.replace('next.md','other.md'),'.md'),'.md');
    assert.notEqual(protectionSignature(wrongLink),protectionSignature(source));
});

test('translated heading IDs follow native directive parsing', async () => {
    for (const extension of ['.md', '.mdx']) {
        const source = await structure('## SSL error:protocol version mismatch\n', extension);
        assert.equal(source.headings[0].id, 'ssl-error-version-mismatch');
        const target = await alignHeadings(source, '## SSL 接続エラー\n', extension);
        assert.equal((await structure(target, extension)).headings[0].id, source.headings[0].id);
        const ordinary = await structure('## SSL error: protocol version mismatch\n', extension);
        assert.equal(ordinary.headings[0].id, 'ssl-error-protocol-version-mismatch');
    }
});

test('directive-like prose preserves protected technical numbers', async () => {
    const source = await structure('## Options\n\n- `s3.region`:s3 region\n', '.md');
    const target = await structure(await alignHeadings(source, '## オプション\n\n- `s3.region`: s3 リージョン\n', '.md'), '.md');
    assert.equal(protectionSignature(target), protectionSignature(source));
    assert(source.protectedNodes.some(node => node[0] === 'numbers' && node[1].includes('3')));
});

test('full audit finds documents and sidebar keys added after the T03 snapshot', async () => {
    const {execFileSync} = require('node:child_process');
    const {hash} = require('../state.cjs');
    const {audit} = require('../audit-coverage.cjs');
    const root = fs.mkdtempSync(path.join(os.tmpdir(),'japanese-audit-test-'));
    const baseline = path.join(root,'baseline');
    const write = (file,content) => {
        const target = path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);
    };
    try {
        fs.mkdirSync(baseline);
        for (const group of ['dev','4x','community']) fs.writeFileSync(path.join(baseline,`${group}.json`),JSON.stringify({entryFiles:[]}));
        fs.writeFileSync(path.join(baseline,'summary.json'),JSON.stringify({sourceCommit:'t03'}));
        const groups = [
            {id:'DEV',pluginId:'default',version:'current',sourceRoot:'docs',file:'docs/new.md'},
            {id:'4X',pluginId:'default',version:'4.x',sourceRoot:'versioned_docs/version-4.x',file:'versioned_docs/version-4.x/new.md'},
            {id:'COMMUNITY',pluginId:'community',version:'current',sourceRoot:'community',file:'community/new.md'},
        ];
        write('translations/scope/ja.json',JSON.stringify({schemaVersion:1,locale:'ja',maxBatchPages:20,groups,retainEnglish:[]}));
        write('translations/config.json',JSON.stringify({schemaVersion:1,locales:{ja:{sourceLocale:'en',
            sourceOverrides:[],languageName:'Japanese',scriptPattern:'[\\u3040-\\u30ff\\u3400-\\u9fff]'}}}));
        write('translations/state/ja/docs.json',JSON.stringify({schemaVersion:1,pages:[]}));
        write('translations/state/ja/resolved-deletions.json',JSON.stringify({schemaVersion:1,deletions:[]}));
        for (const file of ['docusaurus.config.js','versions.json','sidebars.ts','sidebarsCommunity.json','versioned_sidebars/version-4.x-sidebars.json'])
            write(file,file+'\n');
        const pages = groups.map(group => {
            const content = '# Newly registered\n';write(group.file,content);
            return {pluginId:group.pluginId,version:group.version,docId:'new',englishPath:group.file,sourcePath:group.file,
                sourceHash:hash(content),targetPath:`i18n/ja/${group.id}/new.md`,targetHash:null,
                status:'untranslated',reviewStatus:'unverified',useTarget:false,draft:false,permalink:`/ja/${group.id}/new/`};
        });
        pages[0].status = 'current';
        pages[0].reviewStatus = 'unverified';
        pages[0].useTarget = true;
        execFileSync('git',['init','-q'],{cwd:root});
        execFileSync('git',['add','.'],{cwd:root});
        execFileSync('git',['-c','user.name=T04 Test','-c','user.email=t04@example.com','commit','-qm','candidate scope'],{cwd:root});
        const native = {pages,reports:[],labels:[
            {pluginId:'default',files:[{path:'current',content:{'sidebar.docs.category.New':{message:'New'}}},
                {path:'version-4.x',content:{'sidebar.docs.category.New':{message:'New'}}}]},
            {pluginId:'community',files:[{path:'current',content:{'sidebar.community.category.New':{message:'New'}}}]},
        ]};
        const report = await audit({root,sourceRef:'HEAD',baseline,native});
        assert.deepEqual(report.groups.map(group => group.counts.new),[1,1,1]);
        assert.deepEqual(report.groups.map(group => group.counts.pending),[1,1,1]);
        assert.equal(report.groups[0].entries[0].state,'unverified');
        assert.equal(report.labels.missing,3);
        assert.equal(report.removed.length,0);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('source-only edits report stale Japanese content; edited stale targets are blocked', async () => {
    const {checkTranslations} = require('../check-translations.cjs');
    const page = {pluginId:'default',version:'current',docId:'test',locale:'ja',status:'stale_unknown',
        sourcePath:'docs/test.md',targetPath:'i18n/ja/docusaurus-plugin-content-docs/current/getting-started/intro.mdx'};
    const root = path.resolve(__dirname,'../../..');
    const sourceEdit = await checkTranslations({root,pages:[page],files:['docs/test.md'],records:new Map()});
    assert.equal(sourceEdit.checked,0);
    assert.deepEqual(sourceEdit.errors,[]);
    const targetEdit = await checkTranslations({root,pages:[page],files:[page.targetPath],records:new Map()});
    assert.equal(targetEdit.checked,1);
    assert.match(targetEdit.errors[0].message,/current source\/state/);
});

test('required legacy link gate follows Japanese fallback in the same version', () => {
    const {existingLocalTarget} = require('../../check_move.js');
    for (const version of ['current','version-4.x']) {
        const file = `i18n/ja/docusaurus-plugin-content-docs/${version}/getting-started/what-is-apache-doris.md`;
        assert.equal(existingLocalTarget(file,'../ai/ai-overview.md'),true);
        assert.equal(existingLocalTarget(file,'../ai/not-a-page-t04.md'),false);
    }
});
