// A native document is identified by plugin, version and doc ID. Each managed
// locale contributes only its own indexable route to that document's group.
// Use the same complete group in doc metadata, manifests and browser data.
function mergeAlternates(pages) {
    const groups = new Map();
    const key = page => JSON.stringify([page.pluginId, page.version, page.docId]);
    for (const page of pages) {
        const id = key(page);
        if (!groups.has(id)) groups.set(id, {});
        const group = groups.get(id);
        for (const locale of ['en', 'zh-CN']) {
            if (page.alternates[locale]) group[locale] = page.alternates[locale];
        }
        if (page.indexable && page.alternates[page.locale]) group[page.locale] = page.alternates[page.locale];
    }
    for (const page of pages) page.alternates = groups.get(key(page));
}
module.exports = {mergeAlternates};
