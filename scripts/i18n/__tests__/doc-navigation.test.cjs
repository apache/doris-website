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
