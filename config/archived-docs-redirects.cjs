const path = require('node:path');
const {inventory} = require('../scripts/archive-docs/inventory.cjs');
const {versions} = require('./archived-docs.json');
const cache = new Map();

module.exports = function archivedDocRedirects(existingPath) {
    const match = existingPath.replace(/\/$/, '').match(/^(.*?)\/archived-docs$/);
    if (!match) return [];
    const prefix = match[1];
    if (!cache.has(prefix)) {
        const root = path.resolve(__dirname, '..');
        const locale = prefix === '/zh-CN' ? 'zh-CN' : 'en';
        const routes = new Set();
        for (const version of versions) {
            routes.add(`${prefix}/docs/${version}`);
            for (const doc of inventory(root, version, locale)) {
                const route = prefix + doc.route.replace(/^\/zh-CN/, '');
                routes.add(route);
                if (route.endsWith('/gettingStarted/what-is-apache-doris'))
                    routes.add(route.replace(/what-is-apache-doris$/, 'what-is-new'));
            }
        }
        cache.set(prefix, [...routes]);
    }
    return cache.get(prefix);
};
