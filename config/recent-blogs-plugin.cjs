const RECENT_POSTS_COUNT = 4;

module.exports = function recentBlogsPlugin(context) {
    return {
        name: 'recent-blog-posts',
        allContentLoaded({allContent, actions}) {
            const blogPosts = allContent['docusaurus-plugin-content-blog']?.default?.blogPosts ?? [];
            const seen = new Set();
            const posts = blogPosts
                .map(post => post.metadata)
                // Docusaurus clears metadata.unlisted in development, so also check front matter.
                .filter(metadata => !metadata.unlisted && !metadata.frontMatter.unlisted && !metadata.frontMatter.draft)
                .sort((a, b) => new Date(b.date) - new Date(a.date)
                    || a.permalink.localeCompare(b.permalink))
                .filter(({permalink}) => {
                    if (seen.has(permalink)) return false;
                    seen.add(permalink);
                    return true;
                })
                // Keep one extra so the current article can be excluded in the browser and SSR.
                .slice(0, RECENT_POSTS_COUNT + 1)
                .map(metadata => ({
                    title: metadata.title,
                    permalink: metadata.permalink,
                    contentLocale: metadata.dorisContent?.contentLocale ?? context.i18n.currentLocale,
                }));

            actions.setGlobalData({posts, count: RECENT_POSTS_COUNT});
        },
    };
};
