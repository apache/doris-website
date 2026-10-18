const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {checkIndexes} = require('../verify-search.cjs');

function fixture(t) {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'ko-index-check-'));
    t.after(() => fs.rmSync(site, {recursive:true,force:true}));
    const write = (file, data) => {
        const target = path.join(site, 'ko', file);
        fs.mkdirSync(path.dirname(target), {recursive:true});
        fs.writeFileSync(target, JSON.stringify(data));
    };
    const pages = [
        {pluginId:'default',version:'current',permalink:'/ko/docs/dev/current/'},
        {pluginId:'default',version:'4.x',permalink:'/ko/docs/4.x/current/'},
        {pluginId:'community',version:'current',permalink:'/ko/community/current/'},
    ].map(page => ({...page,locale:'ko',status:'current',indexable:true,useTarget:true}));
    const index = url => [{documents:[{u:url}]}];
    write('ko-search-summary.json', {locale:'ko',indexedPages:3,contexts:{'docs/dev':1,'docs/4.x':1,community:1}});
    write('search-index.json', [{documents:[]}]);
    write('search-index-docs-dev.json', index(pages[0].permalink));
    write('search-index-docs-4.x.json', index(pages[1].permalink));
    write('search-index-community.json', index(pages[2].permalink));
    return {site,write,pages,index};
}

test('Korean index verification agrees with current native targets and an empty root union', t => {
    const {site,pages} = fixture(t);
    assert.equal(checkIndexes({site,locale:'ko',manifest:{pages}}).summary.indexedPages, 3);
});

test('fallback, stale, unlisted and unverified targets cannot enter the Korean index', t => {
    const {site,pages,write,index} = fixture(t);
    for (const changed of [{status:'untranslated'}, {status:'stale_technical'}, {indexable:false}, {status:'unverified'}]) {
        const candidate = {...pages[0],...changed,permalink:'/ko/docs/dev/invalid/'};
        write('search-index-docs-dev.json', index(candidate.permalink));
        assert.throws(() => checkIndexes({site,locale:'ko',manifest:{pages:[...pages,candidate]}}), /Invalid\/fallback/);
    }
});

test('wrong-locale, external and duplicate union data fail publication verification', t => {
    const {site,pages,write,index} = fixture(t);
    for (const url of ['/ja/docs/dev/current/','https://example.com/ko/docs/dev/current/']) {
        write('search-index-docs-dev.json',index(url));
        assert.throws(() => checkIndexes({site,locale:'ko',manifest:{pages}}), /Cross-locale/);
    }
    write('search-index-docs-dev.json',index(pages[0].permalink));
    write('search-index.json',index(pages[0].permalink));
    assert.throws(() => checkIndexes({site,locale:'ko',manifest:{pages}}), /Root index repeats/);
});
