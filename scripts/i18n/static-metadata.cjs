const {Parser} = require('htmlparser2');

// Read only the assertions' scalar fields. Constructing a complete Cheerio DOM
// for each page also parses large sidebars and hydration payloads we never use.
function readMetadata(html) {
    const result = {headingIds: [], alternates: new Map(), canonicals: [], htmlLang: undefined, bodyLang: undefined,
        translationStatus: undefined, robots: undefined, ogUrl: undefined, ogLocale: undefined};
    const stack = [];
    const first = new Set();
    let documentDepth = 0;
    const once = (key, value) => {if (!first.has(key)) {first.add(key); result[key] = value;}};
    const parser = new Parser({
        onopentag(name, attributes) {
            const classes = (attributes.class ?? '').split(/\s+/);
            if (name === 'html') once('htmlLang', attributes.lang);
            if (classes.includes('theme-doc-markdown') || classes.includes('course-doc-content')) once('bodyLang', attributes.lang);
            if ('data-translation-status' in attributes) once('translationStatus', attributes['data-translation-status']);
            if (documentDepth && /^h[1-6]$/.test(name)) result.headingIds.push(attributes.id ?? '');
            if (name === 'link') {
                if (attributes.rel === 'canonical') result.canonicals.push(attributes.href);
                if (attributes.rel === 'alternate' && 'hreflang' in attributes) {
                    if (!result.alternates.has(attributes.hreflang)) result.alternates.set(attributes.hreflang, []);
                    result.alternates.get(attributes.hreflang).push(attributes.href);
                }
            }
            if (name === 'meta') {
                if (attributes.name === 'robots') once('robots', attributes.content);
                if (attributes.property === 'og:url') once('ogUrl', attributes.content);
                if (attributes.property === 'og:locale') once('ogLocale', attributes.content);
            }
            const document = classes.includes('theme-doc-markdown');
            stack.push({name, document});
            if (document) documentDepth++;
        },
        onclosetag(name) {
            let position = stack.length - 1;
            while (position >= 0 && stack[position].name !== name) position--;
            if (position < 0) return;
            for (const entry of stack.splice(position)) if (entry.document) documentDepth--;
        },
    }, {decodeEntities: true});
    parser.end(html);
    return result;
}
module.exports = {readMetadata};
