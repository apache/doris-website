const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const {isDownloadAvailable, migrateDownloadUrls, missingDownloads} = require('../../src/utils/download-recovery');
const defaults = require('../../config/download-recovery.json');

function messages(siteDir, locale) {
    if (!/^[a-z]{2}(?:-[A-Za-z]+)?$/.test(locale)) throw new Error('Invalid recovery-message locale');
    const file = path.join(siteDir, 'i18n', locale, 'code.json');
    const dictionary = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    return {
        label: dictionary['landing.download.unavailable']?.message ?? 'Unavailable',
        notice: dictionary['landing.download.documentUnavailableNote']?.message
            ?? 'Some package downloads in this document are currently unavailable. The related download commands may not work until the files are restored.',
    };
}

function downloadRecovery({catalog = defaults, locale = 'en', label = 'Unavailable', notice = messages(path.resolve(__dirname, '../..'), 'en').notice} = {}) {
    return tree => {
        if (tree.data?.downloadRecovery) return;
        tree.data = {...tree.data, downloadRecovery: true};
        let missing = false;
        const rewrite = value => {
            const result = migrateDownloadUrls(value, catalog);
            if (missingDownloads(result, catalog).length) missing = true;
            return result;
        };
        const escape = value => String(value).replace(/[&<>"']/g, character =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
        const rawLinks = value => value.replace(/<a\b[^>]*>/gi, tag => {
            const attributes = cheerio.load(tag, {}, false)('a').first().attr();
            if (!attributes?.href || !missingDownloads(attributes.href, catalog).length) return tag;
            for (const name of Object.keys(attributes))
                if (['href','target','download','rel','tabindex'].includes(name) || name.startsWith('on')) delete attributes[name];
            Object.assign(attributes, {role:'link','aria-disabled':'true',title:label,lang:locale});
            return '<a ' + Object.entries(attributes).map(([name, value]) => `${name}="${escape(value)}"`).join(' ')
                + '>(' + escape(label) + ') ';
        });
        function walk(node) {
            if (['yaml', 'toml'].includes(node.type)) return;
            if (['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(node.type)) {
                if (node.value && migrateDownloadUrls(node.value, catalog) !== node.value)
                    throw new Error('Use a static URL for a migrated download, rather than an MDX expression');
                return;
            }
            if (typeof node.url === 'string') node.url = rewrite(node.url);
            if (['text', 'code', 'html'].includes(node.type) && typeof node.value === 'string') node.value = rewrite(node.value);
            if (node.type === 'html') node.value = rawLinks(node.value);
            for (const attribute of node.attributes ?? []) {
                if (typeof attribute.value === 'string') attribute.value = rewrite(attribute.value);
                else if (attribute.value?.value && (migrateDownloadUrls(attribute.value.value, catalog) !== attribute.value.value
                    || missingDownloads(attribute.value.value, catalog).length)) {
                    const expression = attribute.value.data?.estree?.body?.[0]?.expression;
                    if (expression?.type !== 'Literal' || typeof expression.value !== 'string')
                        throw new Error('Use a static attribute for a migrated download');
                    attribute.value = rewrite(expression.value);
                }
            }
            const href = node.type === 'link' ? node.url : ['a', 'Link'].includes(node.name)
                ? node.attributes?.find(attribute => ['href', 'to'].includes(attribute.name))?.value : null;
            if (typeof href === 'string' && missingDownloads(href, catalog).length && !isDownloadAvailable(href, catalog)) {
                if (node.type === 'link') {
                    node.type = 'emphasis';
                    node.data = {...node.data, hName:'span', hProperties:{role:'link','aria-disabled':'true',title:label,lang:locale}};
                } else {
                    node.type = 'mdxJsxTextElement';
                    node.name = 'span';
                    node.attributes = [...(node.attributes ?? []).filter(attribute =>
                        !['href', 'to', 'target', 'download', 'rel', 'role', 'aria-disabled', 'title', 'lang'].includes(attribute.name)
                        && !attribute.name?.startsWith('on')),
                    ...['role', 'aria-disabled', 'title', 'lang'].map((name, index) =>
                        ({type: 'mdxJsxAttribute', name, value: ['link', 'true', label, locale][index]}))];
                }
                delete node.url; delete node.title;
                node.children.push({type: 'text', value: ` (${label})`});
            }
            for (const child of node.children ?? []) walk(child);
        }
        walk(tree);
        if (missing) {
            const firstHeading = tree.children.findIndex(node => node.type === 'heading' && node.depth === 1);
            const position = firstHeading >= 0 ? firstHeading + 1 : tree.children.findIndex(node => !['yaml', 'toml', 'mdxjsEsm'].includes(node.type));
            tree.children.splice(Math.max(0, position), 0, {type: 'blockquote', data: {hProperties: {role: 'note', lang: locale}}, children: [
                {type: 'paragraph', children: [{type: 'strong', children: [{type: 'text', value: label}]}]},
                {type: 'paragraph', children: [{type: 'text', value: notice}]},
            ]});
        }
    };
}

module.exports = downloadRecovery;
module.exports.messages = messages;
