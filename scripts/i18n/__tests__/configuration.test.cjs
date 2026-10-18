const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {checkConfiguration} = require('../check-configuration.cjs');

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-config-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, value) => {
        const target = path.join(root, file);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, JSON.stringify(value));
    };
    write('translations/config.json', {schemaVersion: 1, locales: Object.fromEntries(['ja','ko'].map(locale => [locale,
        {sourceLocale: 'en', sourceOverrides: [], languageName: locale === 'ko' ? 'Korean' : 'Japanese', scriptPattern: '[a-z]'}]))});
    const scope = {schemaVersion: 1, locale: 'ko', maxBatchPages: 20,
        groups: [{id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'}], retainEnglish: [], retainSidebarLabels: []};
    const glossary = {schemaVersion: 1, version: '1', keep: ['Doris'], terms: [{source: 'table', target: '테이블'}]};
    for (const locale of ['ja','ko']) {
        write(`translations/scope/${locale}.json`, {...scope, locale});
        write(`translations/glossary/${locale}.json`, glossary);
    }
    return {root, write, scope, glossary};
}

test('scope and glossary checks need no site, inventory or credentials and isolate the selected locale', t => {
    const {root, write} = fixture(t);
    assert.equal(checkConfiguration(root, 'ja').groups, 1);
    assert.equal(checkConfiguration(root, 'ko').maxBatchPages, 20);
    write('translations/glossary/ko.json', {schemaVersion: 1, version: '1', keep: 'Doris', terms: []});
    assert.throws(() => checkConfiguration(root, 'ko'), /keep terms/);
    assert.equal(checkConfiguration(root, 'ja').locale, 'ja');
});

test('invalid or cross-locale scope and sidebar exceptions fail offline', t => {
    const {root, write, scope} = fixture(t);
    write('translations/scope/ko.json', {...scope, locale: 'ja'});
    assert.throws(() => checkConfiguration(root, 'ko'), /scope locale/);
    write('translations/scope/ko.json', {...scope, maxBatchPages: 21});
    assert.throws(() => checkConfiguration(root, 'ko'), /Batch limit/);
    const entry = {pluginId:'default', version:'current', key:'sidebar.docs.category.SQL', reason:'SQL identifier'};
    write('translations/scope/ko.json', {...scope, retainSidebarLabels:[entry,entry]});
    assert.throws(() => checkConfiguration(root, 'ko'), /sidebar label/);
});

test('glossary duplicates, malformed terms and incomplete reasons fail before generation', t => {
    const {root, write, glossary} = fixture(t);
    for (const changed of [{keep:['Doris','Doris']}, {terms:[{source:'table',target:''}]},
        {terms:[{source:'table',target:'테이블',required:'true'}]}, {keepReasons:{}}]) {
        write('translations/glossary/ko.json', {...glossary,...changed});
        assert.throws(() => checkConfiguration(root, 'ko'), /glossary|keepReasons/);
    }
    write('translations/glossary/ko.json', {...glossary,keepReasons:{Doris:'Product name'}});
    assert.equal(checkConfiguration(root, 'ko').keepTerms, 1);
});
