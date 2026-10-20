const test = require('node:test');
const assert = require('node:assert/strict');
const {render} = require('eta');
const cheerio = require('cheerio');
const {ssrTemplate} = require('../../../config/ssrTemplate');

test('the SSR container contains exactly React markup without extra hydration text nodes', () => {
    const appHtml = '<main>Русский текст</main><footer>Footer</footer>';
    const html = render(ssrTemplate, {htmlAttributes:'lang="ru"',bodyAttributes:'',version:'3.6.3',baseUrl:'/ru/',
        headTags:'',metaAttributes:[],preBodyTags:'',postBodyTags:'',appHtml,noIndex:false,stylesheets:[],scripts:[]});
    const $ = cheerio.load(html);
    assert(html.includes(`<div id="__docusaurus">${appHtml}</div>`));
    assert.equal($('#__docusaurus main').text(), 'Русский текст');
    assert.deepEqual($('#__docusaurus').contents().toArray().map(node => node.type), ['tag','tag']);
});
