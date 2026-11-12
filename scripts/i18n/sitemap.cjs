const fs = require('node:fs');
const path = require('node:path');
function filterContentSitemap(items, root, locale, baseUrl = '/') {
    const filename = path.join(root, '.i18n-build/content-manifests', locale + '.json');
    // This runs after allContentLoaded; a missing decision is a build failure.
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const pages = new Map(manifest.pages.map(page => [page.route.replace(/\/+$/, ''), page]));
    return items.filter(item => {
        const pathname = new URL(item.url).pathname.replace(/\/+$/, '');
        const page = pages.get(pathname);
        if (page) return page.indexable;
        const relative = pathname.slice(baseUrl.replace(/\/$/, '').length);
        return locale === 'en' || !/^\/blog(?:\/|$)/.test(relative);
    });
}
module.exports = {filterContentSitemap};
