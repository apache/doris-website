// Validate the real frame translation script against visible English labels.
// The build-time DOM stub exercises text translation; real SVG sizing/theme
// behavior stays in Chromium acceptance. No browser debug data is published.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cheerio = require('cheerio');
const retained = new Set(['Apache Doris', 'Kafka', 'CDC', 'BI', 'QPS', 'MB/s',
    'MATCH + COSINE_SIMILARITY + VECTOR_SEARCH']);
function validateEmbeddedMessages(root, files, locale) {
    if (locale === 'en') return;
    const frames = files.filter(file => /^static\/home-next\/[^/]+\.html$/.test(file));
    if (!frames.length) return;
    const script = fs.readFileSync(path.join(root, 'static/js/embedded-locale.js'), 'utf8');
    for (const frame of frames) {
        const $ = cheerio.load(fs.readFileSync(path.join(root, frame), 'utf8'));
        $('script,style').remove();
        const labels = [...new Set($('*').contents().filter((_, node) => node.type === 'text')
            .map((_, node) => $(node).text().trim()).get().filter(label => /[A-Za-z]/.test(label)))];
        const nodes = labels.map(label => ({nodeValue: label, parentElement: {tagName: 'BODY'}}));
        const document = {documentElement: {lang: 'en'}, createTreeWalker() {
            let index = -1;
            return {nextNode() {return ++index < nodes.length;}, get currentNode() {return nodes[index];}};
        }};
        vm.runInNewContext(script, {window: {location: {search: '?locale=' + locale}}, document,
            URLSearchParams, NodeFilter: {SHOW_TEXT: 4}}, {timeout: 1000});
        if (document.documentElement.lang !== locale) throw new Error(`Missing embedded locale: ${frame}/${locale}`);
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            if (retained.has(label) || /^\d+(?:[.,]\d+)?s$/.test(label)) continue;
            if (!nodes[i].nodeValue.trim() || nodes[i].nodeValue === label)
                throw new Error(`Incomplete embedded message: ${frame}/${locale}/${label}`);
        }
    }
}
module.exports = {validateEmbeddedMessages};
