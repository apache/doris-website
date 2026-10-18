const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {buildLocales, selectLocales} = require('../build-locales.cjs');

function fixture(t, locales = ['en','zh-CN','ja']) {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(),'doris-locale-build-'));
    t.after(() => fs.rmSync(siteDir,{recursive:true,force:true}));
    const outDir = path.join(siteDir,'build');
    fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir,'previous.txt'),'previous complete site');
    const calls = [];
    const stamp = () => ({sha:'same-sha',trackedDiffHash:'same-inputs'});
    const run = async args => {
        calls.push(args);
        if (args[0] === 'plan') {
            fs.writeFileSync(args[3],JSON.stringify({defaultLocale:'en',locales:locales.map(locale => ({locale,
                directory:locale==='en'?'.':locale,baseUrl:locale==='en'?'/':`/${locale}/`}))}));
        } else {
            const directory = path.join(args[2],args[3]==='en'?'.':args[3]);
            fs.mkdirSync(directory,{recursive:true});
            fs.writeFileSync(path.join(directory,'index.html'),args[3]);
            fs.writeFileSync(path.join(directory,'.htaccess'),`${args[3]} controls`);
            fs.writeFileSync(path.join(directory,'sitemap.xml'),`${args[3]} sitemap`);
        }
        return {pid:100+calls.length};
    };
    return {siteDir,outDir,run,stamp,calls};
}

test('ordered locale assembly retains root controls and exactly one localized prefix', async t => {
    const data = fixture(t);
    const report = await buildLocales(data);
    assert.deepEqual(report.locales.map(item => item.locale),['en','zh-CN','ja']);
    assert.equal(new Set(report.locales.map(item => item.pid)).size,3);
    assert.equal(fs.readFileSync(path.join(data.outDir,'.htaccess'),'utf8'),'en controls');
    assert.equal(fs.readFileSync(path.join(data.outDir,'sitemap.xml'),'utf8'),'en sitemap');
    assert.equal(fs.readFileSync(path.join(data.outDir,'ja/index.html'),'utf8'),'ja');
    assert(!fs.existsSync(path.join(data.outDir,'ja/ja')));
    assert(!fs.existsSync(path.join(data.outDir,'previous.txt')));
    assert.equal(report.success,true);
});

test('disabled Japanese stays absent from the configured build plan', async t => {
    const data = fixture(t,['en','zh-CN']);
    await buildLocales(data);
    assert.deepEqual(data.calls.filter(args => args[0]==='build').map(args => args[3]),['en','zh-CN']);
    assert(!fs.existsSync(path.join(data.outDir,'ja')));
});

test('a failed locale preserves the previous complete artifact and stops subsequent builds', async t => {
    const data = fixture(t);
    const run = async args => {
        if (args[3] === 'zh-CN') throw new Error('locale failed');
        return data.run(args);
    };
    await assert.rejects(buildLocales({...data,run}),/locale failed/);
    assert.equal(fs.readFileSync(path.join(data.outDir,'previous.txt'),'utf8'),'previous complete site');
    assert(!fs.existsSync(path.join(data.outDir,'index.html')));
    assert(!data.calls.some(args => args[3]==='ja'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(data.siteDir,'.i18n-build/build-result.json'),'utf8')).success,false);
});

test('a source change cannot publish mixed locale artifacts', async t => {
    const data = fixture(t);
    let modified = false;
    const run = async args => {
        const result = await data.run(args);
        if (args[3] === 'en') modified = true;
        return result;
    };
    await assert.rejects(buildLocales({...data,run,stamp:()=>({sha:'same-sha',trackedDiffHash:modified?'new-inputs':'same-inputs'})}),/Source changed/);
    assert.equal(fs.readFileSync(path.join(data.outDir,'previous.txt'),'utf8'),'previous complete site');
});

test('a locale-only subset keeps every built locale behind its own prefix', async t => {
    const data = fixture(t,['en','zh-CN']);
    const report = await buildLocales({...data, locales:['zh-CN']});
    assert.deepEqual(report.locales.map(item => item.locale),['zh-CN']);
    assert.deepEqual(report.requested,['zh-CN']);
    assert.deepEqual(data.calls.filter(args => args[0]==='build').map(args => args[3]),['zh-CN']);
    assert.equal(fs.readFileSync(path.join(data.outDir,'zh-CN/index.html'),'utf8'),'zh-CN');
    assert(!fs.existsSync(path.join(data.outDir,'index.html')));
    assert(!fs.existsSync(path.join(data.outDir,'.htaccess')));
    assert(!fs.existsSync(path.join(data.outDir,'previous.txt')));
    assert.equal(report.success,true);
});

test('a subset containing the default locale keeps the root controls', async t => {
    const data = fixture(t);
    const report = await buildLocales({...data, locales:['ja','en']});
    // The configured order decides, so the default locale still builds first.
    assert.deepEqual(data.calls.filter(args => args[0]==='build').map(args => args[3]),['en','ja']);
    assert.equal(fs.readFileSync(path.join(data.outDir,'.htaccess'),'utf8'),'en controls');
    assert.equal(fs.readFileSync(path.join(data.outDir,'sitemap.xml'),'utf8'),'en sitemap');
    assert.equal(fs.readFileSync(path.join(data.outDir,'ja/index.html'),'utf8'),'ja');
    assert(!fs.existsSync(path.join(data.outDir,'zh-CN')));
    assert.equal(report.success,true);
});

test('an unusable locale selection is rejected before any build starts', async t => {
    const data = fixture(t);
    await assert.rejects(buildLocales({...data, locales:['ko']}),/not configured: ko/);
    await assert.rejects(buildLocales({...data, locales:['ja','ja']}),/unique locales/);
    await assert.rejects(buildLocales({...data, locales:[]}),/non-empty/);
    assert(!data.calls.some(args => args[0]==='build'));
    assert.equal(fs.readFileSync(path.join(data.outDir,'previous.txt'),'utf8'),'previous complete site');
});

test('the locale selection keeps the configured plan order', () => {
    const plan = {defaultLocale:'en',locales:[{locale:'en',directory:'.'},{locale:'zh-CN',directory:'zh-CN'},{locale:'ja',directory:'ja'}]};
    assert.deepEqual(selectLocales(plan,undefined).map(item => item.locale),['en','zh-CN','ja']);
    assert.deepEqual(selectLocales(plan,['ja','zh-CN']).map(item => item.locale),['zh-CN','ja']);
    assert.throws(() => selectLocales({defaultLocale:'en',locales:[{locale:'zh-CN',directory:'zh-CN'},{locale:'en',directory:'.'}]},undefined),/Default locale must be first/);
});

test('an unsafe locale path is rejected before building it', async t => {
    const data = fixture(t,['en','../escape']);
    await assert.rejects(buildLocales(data),/Unsafe locale/);
    assert.equal(fs.readFileSync(path.join(data.outDir,'previous.txt'),'utf8'),'previous complete site');
});

test('failed optimized resource verification preserves the previous complete artifact', async t => {
    const previous = process.env.DORIS_OPTIMIZE_PUBLISH;
    process.env.DORIS_OPTIMIZE_PUBLISH = 'true';
    t.after(() => {
        if (previous === undefined) delete process.env.DORIS_OPTIMIZE_PUBLISH;
        else process.env.DORIS_OPTIMIZE_PUBLISH = previous;
    });
    const data = fixture(t,['en']);
    const run = async args => {
        const result = await data.run(args);
        if (args[0] === 'build') fs.writeFileSync(path.join(args[2],'index.html'),
            '<script src=/assets/js/missing.js></script>');
        return result;
    };
    await assert.rejects(buildLocales({...data,run}),/Missing compiled asset/);
    assert.equal(fs.readFileSync(path.join(data.outDir,'previous.txt'),'utf8'),'previous complete site');
});
