const cheerio = require('cheerio');
const {hash} = require('./state.cjs');
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
            nodes.push([...node.slice(0,2), node[2].map(attribute => visibleAttribute(attribute.name)
                && typeof attribute.value === 'string' ? {...attribute, value:''} : attribute)]);
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
