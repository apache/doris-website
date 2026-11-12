// Only the disposable CI adapter enables this. Publication keeps the full blog.
const fs = require('node:fs');
const path = require('node:path');
let active;

function enable(plan) {
    // Content edits retain the existing complete blog build. This optimization
    // is for PRs that change implementations rather than published content.
    const contentChanged = plan.files.some(file => /^(blog\/|i18n\/[^/]+\/docusaurus-plugin-content-blog(?:\/|-[^/]+\/)|translations\/blog\/|translations\/state\/[^/]+\/pages\/blog\/)/.test(file));
    active = plan.mode === 'sample' && !contentChanged ? {plan, routes: [], reports: []} : undefined;
    return () => {active = undefined;};
}
const enabled = () => !!active;
const fullRoutes = () => active?.routes ?? [];
const reports = () => active?.reports ?? [];
function collect(route) {active.routes.push(route);}

async function sample(context, options, content) {
    if (!active || !content.blogPosts.length) return;
    const {plan} = active, selected = new Map();
    const posts = content.blogPosts;
    const entries = content.contentIdentity?.entries ?? [];
    const lookup = new Map(entries.filter(e => e.siteLocale === context.i18n.currentLocale)
        .map(e => [e.route.replace(/\/+$/, ''), e]));
    const entry = post => lookup.get(post.metadata.permalink.replace(/\/+$/, ''));
    const source = post => entry(post)?.englishPath ?? post.metadata.source.replace(/^@site\//, '');
    const texts = new Map();
    const text = post => {
        const file = source(post);
        if (!texts.has(file)) texts.set(file, fs.readFileSync(path.resolve(context.siteDir, file), 'utf8'));
        return texts.get(file);
    };
    const add = (post, reason) => {
        if (!post) return;
        if (!selected.has(post.id)) selected.set(post.id, {post, reasons: []});
        selected.get(post.id).reasons.push(reason);
    };
    add(posts[0], 'latest post');
    // The site's native list renders the order=1 article as its lead card.
    add(posts.find(post => Number(post.metadata.frontMatter?.order) === 1), 'lead article');
    add(posts.find(post => post.metadata.frontMatter?.picked && Number(post.metadata.frontMatter.order) !== 1), 'featured article');
    add(posts.find(post => source(post).endsWith('.mdx')), 'MDX');
    add(posts.find(post => /```(?:sql|javascript|js)\b/i.test(text(post))), 'code block');
    add(posts.find(post => entry(post)?.indexable && !entry(post).fallback), 'real body');
    add(posts.find(post => entry(post)?.fallback), 'English fallback');

    // Explicitly imported components/assets still select all affected owners.
    if (plan.files.some(file => /^(src|static)\//.test(file))) {
        const {dependencies} = require('./ci-sample.cjs');
        const changed = new Set(plan.files), cache = new Map();
        for (const post of posts) {
            const result = await dependencies(context.siteDir,
                path.resolve(context.siteDir, post.metadata.source.replace(/^@site\//, '')),
                cache, new Set(), context.siteConfig.markdown.format);
            if (result.uncertain || [...result.files].some(file => changed.has(path.relative(context.siteDir, file).split(path.sep).join('/'))))
                add(post, result.uncertain ? 'uncertain import' : 'changed import dependency');
        }
    }
    const blogPosts = posts.filter(post => selected.has(post.id)).map(post => ({...post,
        metadata: {...post.metadata, prevItem: undefined, nextItem: undefined}}));
    const {paginateBlogPosts, getBlogTags, shouldBeListed} = require('@docusaurus/plugin-content-blog/lib/blogUtils.js');
    const {normalizeUrl} = require('@docusaurus/utils');
    const listed = blogPosts.filter(shouldBeListed);
    for (let i = 0; i < listed.length; i++) {
        const neighbor = post => post && ({title: post.metadata.title, permalink: post.metadata.permalink});
        listed[i].metadata.prevItem = neighbor(listed[i - 1]);
        listed[i].metadata.nextItem = neighbor(listed[i + 1]);
    }
    const pagination = {postsPerPageOption: options.postsPerPage, pageBasePath: options.pageBasePath,
        blogTitle: options.blogTitle, blogDescription: options.blogDescription};
    active.reports.push({pluginId: options.id, metadataPosts: posts.length, renderedPosts: blogPosts.length,
        selected: [...selected.values()].map(({post, reasons}) => ({source: source(post), route: post.metadata.permalink, reasons}))});
    return {...content, blogPosts,
        blogListPaginated: paginateBlogPosts({...pagination, blogPosts: listed,
            basePageUrl: normalizeUrl([context.baseUrl, options.routeBasePath])}),
        blogTags: getBlogTags({...pagination, blogPosts})};
}
module.exports = {enable, enabled, fullRoutes, reports, collect, sample};
