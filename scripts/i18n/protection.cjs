const cheerio = require('cheerio');
const {hash} = require('./state.cjs');
const translatable = new Set(['title', 'description', 'sidebar_label', 'keywords', 'language']);
const visibleAttribute = name => ['alt', 'title', 'aria-label', 'description', 'label', 'caption'].includes(name);

// Keep the T02 freshness hash unchanged. This separate signature permits prose
// in HTML and visible string attributes while protecting executable MDX.
function protectionSignature(parsed) {
    const nodes = [], numbers = [];
    for (const node of parsed.protectedNodes) {
        if (node[0] === 'numbers') {numbers.push(...node[1]); continue;}
        if (node[0] === 'html' && !node[3].trim().startsWith('<!--')) {
            const $ = cheerio.load(node[3], {decodeEntities:false}, false);
            $('*').contents().each((i, child) => {
                if (child.type === 'text') {
                    numbers.push(...(child.data.match(/\d+(?:\.\d+)*/g) || []));
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
    return hash(JSON.stringify([Object.fromEntries(Object.entries(parsed.technicalMetadata).filter(([key]) => !translatable.has(key))),
        nodes, numbers.sort(), parsed.headings.map(({depth,id}) => ({depth,id}))]));
}
module.exports = {protectionSignature};
