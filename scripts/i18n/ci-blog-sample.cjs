// Only the disposable CI adapter enables this. Publication keeps the full blog.
const fs = require('node:fs');
const path = require('node:path');
let active;

function enable(plan) {
    active = plan.mode === 'sample' ? {plan, routes: [], reports: []} : undefined;
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
    if (plan.selection !== 'changed') {
        add(posts.find(post => post.metadata.frontMatter?.picked && Number(post.metadata.frontMatter.order) !== 1), 'featured article');
        add(posts.find(post => source(post).endsWith('.mdx')), 'MDX');
        add(posts.find(post => /```(?:sql|javascript|js)\b/i.test(text(post))), 'code block');
        add(posts.find(post => entry(post)?.indexable && !entry(post).fallback), 'real body');
        add(posts.find(post => entry(post)?.fallback), 'English fallback');

    }
    const changedPaths = new Set(plan.files);
    const changedStates = plan.files.filter(file => /^translations\/blog\//.test(file) && file.endsWith('.json'));
    const stateIds = new Set();
    if (changedStates.length) {
        const {readManualRecords, blogStateFileFor} = require('./manual-state.cjs');
        for (const record of [...readManualRecords(context.siteDir, 'blog'),
            ...(plan.baseSha ? readManualRecords(context.siteDir, 'blog', plan.baseSha) : [])])
            if (changedStates.includes(blogStateFileFor(record))) stateIds.add(record.contentId);
    }
    for (const post of posts) {
        const identity = entry(post);
        if ([source(post), post.metadata.source.replace(/^@site\//, ''), identity?.targetPath, identity?.sourcePath]
            .some(file => changedPaths.has(file))) add(post, 'changed article');
        if (stateIds.has(identity?.contentId) || plan.files.some(file => {
            const state = file.match(/^translations\/(?:blog\/pages\/[^/]+|state\/[^/]+\/pages\/blog\/[^/]+)\/(.+)\.json$/);
            return state && source(post) === 'blog/' + state[1];
        })) add(post, 'changed article state');
    }

    // Explicitly imported components/assets still select all affected owners.
    if (plan.files.some(file => /^(src|static|docs|versioned_docs|community|course|releasenotes|blog|i18n)\//.test(file))) {
        const {dependencies} = require('./ci-sample.cjs');
        const changed = new Set(plan.files), cache = new Map(), coveredOwners = new Set();
        for (const post of posts) {
            const result = await dependencies(context.siteDir,
                path.resolve(context.siteDir, post.metadata.source.replace(/^@site\//, '')),
                cache, new Set(), context.siteConfig.markdown.format);
            const affected = [...result.files].map(file => path.relative(context.siteDir, file).split(path.sep).join('/')).filter(file => changed.has(file));
            if (affected.length && (plan.selection === 'changed' || affected.some(file => !coveredOwners.has(file)))) {
                affected.forEach(file => coveredOwners.add(file));
                add(post, result.uncertain ? 'uncertain import' : 'changed import dependency');
            }
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
