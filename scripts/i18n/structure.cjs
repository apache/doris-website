const matter = require('gray-matter');
const {hash} = require('./state.cjs');
const headingsPlugin = require('@docusaurus/mdx-loader/lib/remark/headings').default;
const {escapeMarkdownHeadingIds} = require('@docusaurus/utils');
const {getFormat} = require('@docusaurus/mdx-loader/lib/format.js');

function withoutPositions(value) {
    if (Array.isArray(value)) return value.map(withoutPositions);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !['position', 'start', 'end', 'loc', 'range'].includes(key))
        .map(([key, child]) => [key, withoutPositions(child)]));
    return value;
}

async function structure(raw, extension, anchorsMaintainCase = false) {
    const [{unified}, {default: parse}, {default: gfm}, {default: mdx}, {visit}] = await Promise.all([
        import('unified'), import('remark-parse'), import('remark-gfm'), import('remark-mdx'), import('unist-util-visit'),
    ]);
    // Use native format detection, including front-matter MDX overrides.
    const {data, content} = matter(raw, {});
    const format = getFormat({filePath: `doc${extension}`, frontMatterFormat: data.mdx?.format, markdownConfigFormat: 'detect'});
    const processor = unified().use(parse).use(gfm);
    if (format === 'mdx') processor.use(mdx);
    const parseContent = format === 'mdx' ? escapeMarkdownHeadingIds(content) : content;
    const offsets = [];
    let originalOffset = 0;
    for (let i = 0; i < parseContent.length; i++) {
        offsets[i] = originalOffset;
        if (parseContent[i] === content[originalOffset]) originalOffset++;
        else if (parseContent[i] !== '\\') throw new Error('Unexpected heading preprocessing change');
    }
    offsets[parseContent.length] = content.length;
    const tree = processor.parse(parseContent);
    const headings = [];
    // Use the installed framework's heading transform, including its duplicate
    // slug order and explicit-ID behavior, instead of a second slug algorithm.
    await headingsPlugin({anchorsMaintainCase})(tree);
    visit(tree, 'heading', node => {
        headings.push({depth: node.depth, id: node.data.id, position: {
            start: {...node.position.start, offset: offsets[node.position.start.offset]},
            end: {...node.position.end, offset: offsets[node.position.end.offset]},
        }});
    });
    const protectedNodes = [];
    visit(tree, node => {
        if (['code', 'inlineCode', 'html', 'mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(node.type)) {
            protectedNodes.push([node.type, node.lang ?? null, node.meta ?? null, node.value]);
        }
        if (['link', 'image', 'definition', 'linkReference', 'imageReference'].includes(node.type)) {
            protectedNodes.push([node.type, node.url ?? null, node.identifier ?? null]);
        }
        if (node.type.startsWith('mdxJsx')) protectedNodes.push([node.type, node.name, withoutPositions(node.attributes)]);
        if (node.type === 'text') {
            const numbers = node.value.match(/\d+(?:\.\d+)*/g);
            if (numbers) protectedNodes.push(['numbers', numbers]);
        }
    });
    // Only title, description and sidebar_label are prose. Treat every other
    // front-matter change conservatively, including explicit last_update.
    const technicalMetadata = Object.fromEntries(Object.entries(data)
        .filter(([key]) => !['title', 'description', 'sidebar_label'].includes(key))
        .sort(([a], [b]) => a.localeCompare(b)));
    return {
        content, headings, format, protectedNodes, technicalMetadata,
        technicalHash: hash(JSON.stringify([technicalMetadata, protectedNodes, headings.map(({depth, id}) => ({depth, id}))])),
        // A secondary comparison for planning only. The state sourceHash stays
        // byte-sensitive, so a formatting edit still needs an explicit review.
        semanticHash: hash(JSON.stringify([Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b))),
            withoutPositions(tree)])),
    };
}

async function alignHeadings(sourceStructure, target, extension, maintainCase = false) {
    const parsed = await structure(target, extension, maintainCase);
    if (parsed.headings.length !== sourceStructure.headings.length
        || parsed.headings.some((heading, i) => heading.depth !== sourceStructure.headings[i].depth)) {
        throw new Error('Translation heading structure differs from its current source');
    }
    let content = parsed.content;
    for (let i = parsed.headings.length - 1; i >= 0; i--) {
        const heading = parsed.headings[i];
        const {start, end} = heading.position;
        const original = content.slice(start.offset, end.offset);
        const id = sourceStructure.headings[i].id;
        // ATX and setext headings both receive the source ID in their text.
        const lines = original.split('\n');
        const textLine = /^\s{0,3}(?:=+|-+)\s*$/.test(lines[lines.length - 1]) ? lines.length - 2 : lines.length - 1;
        const marker = parsed.format === 'mdx' && textLine !== lines.length - 1 ? ` \\{#${id}}` : ` {#${id}}`;
        lines[textLine] = lines[textLine].replace(/\s*\\?\{#[^}]+\}\s*(?:#+\s*)?$/, '').replace(/\s+#+\s*$/, '') + marker;
        content = content.slice(0, start.offset) + lines.join('\n') + content.slice(end.offset);
    }
    // Keep original front matter bytes (and raw targetHash). Only the ignored
    // view is changed; committed Japanese documents are never rewritten.
    const prefix = target.slice(0, target.length - parsed.content.length);
    return prefix + content;
}

module.exports = {structure, alignHeadings};
