const assert = require('node:assert/strict');
const test = require('node:test');
const createRedirect = require('@docusaurus/plugin-client-redirects/lib/createRedirectPageContent.js').default;
const {verifyRedirect} = require('../verify-doc-navigation.cjs');
const target = '/ja/docs/4.x/getting-started/what-is-apache-doris/';

test('accepts the real native redirect template with relative canonical and no anchor', () => {
    const html = createRedirect({toUrl: target});
    assert.doesNotMatch(html, /<a(?:\s|>)/);
    verifyRedirect(html, target);
});

test('accepts the same native redirect with an absolute target', () => {
    verifyRedirect(createRedirect({toUrl: `https://doris.apache.org${target}`}), target);
});

test('rejects a different destination, missing redirect, or inconsistent meta target', () => {
    assert.throws(() => verifyRedirect(createRedirect({toUrl: '/ja/community/feedback/'}), target));
    const html = createRedirect({toUrl: target});
    assert.throws(() => verifyRedirect(html.replace(/<meta[^>]+>/g, ''), target), /Missing immediate/);
    assert.throws(() => verifyRedirect(html.replace(`0; url=${target}`, '0; url=/'), target));
});

test('navigation samples a native sidebar member when a current standalone doc sorts first', t => {
    const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
    const {verify} = require('../verify-doc-navigation.cjs');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ru-navigation-'));
    t.after(() => fs.rmSync(root, {recursive:true,force:true}));
    const write = (file, value) => {const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
    write('snapshot/summary.json', JSON.stringify({locale:'ru',sourceCommit:'a'.repeat(40)}));
    const page = (pluginId,version,id) => ({pluginId,version,docId:id,locale:'ru',status:'current',indexable:true,
        contentLocale:'ru',permalink:pluginId === 'community' ? `/ru/community/${id}/` : `/ru/docs/${version === 'current' ? 'dev' : version}/${id}/`});
    const pages=[page('default','current','standalone'),page('default','current','intro'),page('default','4.x','intro'),page('community','current','intro')];
    write('manifest.json', JSON.stringify({locale:'ru',pages}));
    for (const doc of pages) {
        const navigation=doc.docId === 'standalone' ? '' : `<aside class="theme-doc-sidebar-container"><a href="${doc.permalink}">Документ</a></aside>`
            + (doc.pluginId === 'default' ? `<nav aria-label="Разделы документации"><details><a href="${doc.permalink}">Раздел</a></details></nav>` : '');
        write(`site${doc.permalink}index.html`, `<article class="theme-doc-markdown" lang="ru">Документ</article>${navigation}`);
    }
    write('site/ru/docs/index.html', createRedirect({toUrl:pages[2].permalink}));
    const result=verify({site:path.join(root,'site'),locale:'ru',snapshot:path.join(root,'snapshot'),manifest:path.join(root,'manifest.json')});
    assert.equal(result.routes,4);
    assert.equal(result.checks.find(check=>check.group === 'DEV').sample,pages[1].permalink);
});
