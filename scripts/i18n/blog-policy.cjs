// Keep native parsing and routing. Aggregate availability never changes the
// translation decision for an individual article.
const assert = require('node:assert/strict');
const path = require('node:path');
const {buildAllRoutes} = require('@docusaurus/plugin-content-blog/lib/routes.js');
const {localizedContext} = require('./native-context.cjs');
const {hash} = require('./state.cjs');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const clean = route => decodeURI(route).replace(/\/+$/, '') || '/';
const listed = post => !post.metadata.unlisted && !post.metadata.frontMatter.draft;
function stableMetadata(original, target, englishBase, targetBase) {
    const relativeRoute = (route, base) => clean(route).slice(clean(base) === '/' ? 0 : clean(base).length);
    assert.equal(relativeRoute(target.permalink, targetBase), relativeRoute(original.permalink, englishBase),
        `Translated blog permalink changed: ${original.source}`);
    for (const field of ['date', 'unlisted']) assert.deepEqual(target[field], original[field], `Translated blog ${field} changed: ${original.source}`);
    for (const field of ['order', 'picked', 'draft', 'externalLink'])
        assert.deepEqual(target.frontMatter[field], original.frontMatter[field], `Translated blog ${field} changed: ${original.source}`);
    assert.deepEqual(target.authors.map(author => author.key ?? author.name), original.authors.map(author => author.key ?? author.name),
        `Translated blog authors changed: ${original.source}`);
    assert.deepEqual(target.tags.map(tag => relativeRoute(tag.permalink, targetBase)), original.tags.map(tag => relativeRoute(tag.permalink, englishBase)),
        `Translated blog tag identities changed: ${original.source}`);
}
function feedContent(content) {
    return {...content, blogPosts: content.blogPosts.filter(post => listed(post)
        && post.metadata.dorisContent?.indexable && !post.metadata.dorisContent.fallback)};
}
async function aggregateEntries(context, options, snapshots, entries) {
    const result = [], englishBase = localizedContext(context, 'en').baseUrl;
    for (const [locale, content] of snapshots) {
        const ctx = localizedContext(context, locale);
        const normalize = route => applyTrailingSlash(route,{trailingSlash:context.siteConfig.trailingSlash,baseUrl:ctx.baseUrl});
        const postsBySource = new Map(content.blogPosts.map(post => [post.metadata.source, post]));
        const postRoutes = new Set(content.blogPosts.map(post => clean(post.metadata.permalink)));
        const decisions = new Map(entries.filter(entry => entry.siteLocale === locale).map(entry => [clean(entry.route), entry]));
        // Enumerate lists/tags/archive/authors and pagination with native APIs.
        // createData is a dry sink: this pass reads routes, not compiled bodies.
        const routes = await buildAllRoutes({baseUrl: ctx.baseUrl, content, options,
            actions: {createData: async name => path.join(ctx.generatedFilesDir, name)}, aliasedSource: value => value});
        for (const route of routes) {
            if (postRoutes.has(clean(route.path))) continue;
            const members = route.modules?.items
                ? route.modules.items.map(item => postsBySource.get(item.content.path)).filter(Boolean)
                : route.props?.archive?.blogPosts ?? content.blogPosts.filter(listed);
            const translated = members.map(post => decisions.get(clean(post.metadata.permalink)))
                .filter(entry => entry && entry.indexable && !entry.fallback);
            const fallback = locale !== 'en' && translated.length === 0;
            const unlisted = !!route.props?.tag?.unlisted;
            const englishRoute = englishBase + route.path.slice(ctx.baseUrl.length);
            result.push({contentId: `blog-aggregate:${options.id}:${clean(englishRoute)}`, kind: 'blog', aggregate: true,
                pluginId: options.id, renderIntegrated: true, siteLocale: locale, route: normalize(route.path), englishRoute: normalize(englishRoute),
                state: locale === 'en' ? 'source' : fallback ? 'missing' : 'ready',
                contentLocale: fallback ? 'en' : locale, fallback, indexable: !fallback && !unlisted,
                sourceHash: hash(JSON.stringify(members.map(post => post.id))), targetHash: null,
                reviewStatus: 'unverified', updatePolicy: 'manual'});
        }
    }
    return result;
}
module.exports = {stableMetadata, feedContent, aggregateEntries, listed};
