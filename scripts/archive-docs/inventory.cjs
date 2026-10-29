const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const getSlug = require('@docusaurus/plugin-content-docs/lib/slug.js').default;
const {DefaultNumberPrefixParser, stripPathNumberPrefixes} = require('@docusaurus/plugin-content-docs/lib/numberPrefix.js');

function inventory(root, version, locale) {
    const directory = path.join(root, locale === 'en' ? 'versioned_docs'
        : `i18n/${locale}/docusaurus-plugin-content-docs`, `version-${version}`);
    const docs = [];
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(file);
            else if (/\.mdx?$/.test(entry.name)) {
                const source = path.relative(directory, file).split(path.sep).join('/');
                const {data, content} = matter(fs.readFileSync(file, 'utf8'));
                const basename = path.basename(source).replace(/\.mdx?$/, '');
                const baseID = data.id ?? (data.parse_number_prefixes === false ? basename : DefaultNumberPrefixParser(basename).filename);
                const sourceDirName = path.posix.dirname(source);
                const dirname = data.parse_number_prefixes === false ? sourceDirName : stripPathNumberPrefixes(sourceDirName, DefaultNumberPrefixParser);
                const id = [sourceDirName === '.' ? '' : dirname, baseID].filter(Boolean).join('/');
                const slug = getSlug({baseID, frontMatterSlug: data.slug, source, sourceDirName,
                    stripDirNumberPrefixes: data.parse_number_prefixes !== false});
                const prefix = locale === 'en' ? '' : `/${locale}`;
                docs.push({source, file, id, title: String(data.title ?? content.match(/^#\s+(.+)$/m)?.[1] ?? baseID),
                    content, route: `${prefix}/docs/${version}${slug}`.replace(/\/$/, '')});
            }
        }
    }
    walk(directory);
    const sidebar = JSON.parse(fs.readFileSync(path.join(root, `versioned_sidebars/version-${version}-sidebars.json`), 'utf8'));
    const order = new Map();
    function visit(value) {
        if (typeof value === 'string' && !order.has(value)) order.set(value, order.size);
        else if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') {
            if (value.type === 'doc') visit(value.id);
            if (value.link?.type === 'doc') visit(value.link.id);
            if (value.items) visit(value.items);
            else if (!value.type) Object.values(value).forEach(visit);
        }
    }
    visit(sidebar);
    return docs.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity) || a.source.localeCompare(b.source, 'en'));
}

const filename = (version, locale) => `apache-doris-${version}-${locale}.pdf`;
module.exports = {inventory, filename};
