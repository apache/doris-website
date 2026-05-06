const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');
const matter = require('gray-matter');

function parseEntry(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
        return null;
    }
    const fm = parsed.data;
    return {
        slug: fm.slug || path.basename(filePath, path.extname(filePath)),
        title: fm.title,
        summary: fm.summary,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
    };
}

function plugin(context) {
    const glossaryDir = path.join(context.siteDir, 'key-features-docs', 'glossary');

    return {
        name: 'key-features-glossary-index',

        getPathsToWatch() {
            return [path.join(glossaryDir, '**/*.md')];
        },

        async loadContent() {
            if (!fs.existsSync(glossaryDir)) return [];
            const files = glob.sync(path.join(glossaryDir, '*.md'));
            return files
                .map(parseEntry)
                .filter(entry => entry !== null && entry.title);
        },

        async contentLoaded({ content, actions }) {
            const sorted = [...content].sort((a, b) => a.title.localeCompare(b.title));
            actions.setGlobalData({ entries: sorted });
        },
    };
}

module.exports = plugin;
module.exports.parseEntry = parseEntry;
