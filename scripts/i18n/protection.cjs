const cheerio = require('cheerio');
const {hash} = require('./state.cjs');
const {textFields, containers, canonicalScript, reportEsm} = require('./code-prose.cjs');
const translatable = new Set(['title', 'description', 'sidebar_label', 'keywords', 'language']);
const visibleAttribute = name => ['alt', 'title', 'aria-label', 'description', 'label', 'caption'].includes(name);

function normalizedNumbers(text) {
    return text.normalize('NFKC').replace(/(?<=\d),(?=\d{3}(?:,\d{3})*(?!\d))/g, '')
        .match(/\d+(?:\.\d+)*/g) || [];
}

// Keep the T02 freshness hash unchanged. This separate signature permits prose
// in HTML and visible string attributes while protecting executable MDX.
function protectedContent(parsed, {normalizeProseNumbers = false} = {}) {
    const nodes = [], numbers = [];
    for (const node of parsed.protectedNodes) {
        if (node[0] === 'numbers') {if (!normalizeProseNumbers) numbers.push(...node[1]); continue;}
        if (node[0] === 'script' || node[0] === 'mdxjsEsm' && reportEsm(node[3])) {
            const canonical = canonicalScript(node[3], {report: node[0] === 'mdxjsEsm'});
            numbers.push(...canonical.prose.flatMap(normalizedNumbers));
            nodes.push([...node.slice(0, 3), canonical.code, canonical.protectedText]);
            continue;
        }
        if (node[0] === 'html' && !node[3].trim().startsWith('<!--')) {
            const $ = cheerio.load(node[3], {decodeEntities:false}, false);
            $('*').contents().each((i, child) => {
                if (child.type === 'text') {
                    numbers.push(...(normalizeProseNumbers ? normalizedNumbers(child.data)
                        : child.data.match(/\d+(?:\.\d+)*/g) || []));
                    child.data = '';
                }
            });
            $('*').each((i, element) => Object.keys(element.attribs).forEach(name => {
                if (visibleAttribute(name)) element.attribs[name] = '';
            }));
            nodes.push(['html', $.html()]);
        } else if (node[0].startsWith('mdxJsx')) {
            const course = node[1]?.startsWith('Course');
            nodes.push([...node.slice(0,2), node[2].map(attribute => {
                const visible = visibleAttribute(attribute.name) || course && (textFields.has(attribute.name) || containers.has(attribute.name));
                if (!visible) return attribute;
                if (typeof attribute.value === 'string') {
                    if (course) numbers.push(...normalizedNumbers(attribute.value));
                    return {...attribute, value: ''};
                }
                if (attribute.value?.type === 'mdxJsxAttributeValueExpression') {
                    const canonical = canonicalScript(attribute.value.value, {expression: true});
                    numbers.push(...canonical.prose.flatMap(normalizedNumbers));
                    return {...attribute, value: {type: attribute.value.type, value: canonical.code, protectedText: canonical.protectedText}};
                }
                return attribute;
            })]);
        } else nodes.push(node);
    }
    return [Object.fromEntries(Object.entries(parsed.technicalMetadata).filter(([key]) => !translatable.has(key))),
        nodes, [...numbers, ...(normalizeProseNumbers ? parsed.proseNumbers || [] : [])].sort(),
        parsed.headings.map(({depth,id}) => ({depth,id}))];
}
function protectionSignature(parsed, options) {
    return hash(JSON.stringify(protectedContent(parsed, options)));
}
module.exports = {protectionSignature, protectedContent, normalizedNumbers};
