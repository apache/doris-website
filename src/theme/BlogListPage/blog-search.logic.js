function normalizeSearchValue(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .toLocaleLowerCase();
}

function getNamedValues(values) {
    if (values == null) {
        return [];
    }

    const items = Array.isArray(values) ? values : [values];
    return items.map(value =>
        typeof value === 'string' || typeof value === 'number' ? value : value?.label ?? value?.name ?? '',
    );
}

function getBlogSearchText(BlogPostContent) {
    const frontMatter = BlogPostContent?.frontMatter ?? {};
    const metadata = BlogPostContent?.metadata ?? {};

    return normalizeSearchValue(
        [
            metadata.title,
            frontMatter.title,
            frontMatter.summary,
            frontMatter.description,
            ...getNamedValues(frontMatter.author),
            ...getNamedValues(frontMatter.authors),
            ...getNamedValues(metadata.authors),
            ...getNamedValues(frontMatter.tags),
            ...getNamedValues(metadata.tags),
            ...getNamedValues(frontMatter.keywords),
        ]
            .filter(Boolean)
            .join(' '),
    );
}

function matchesBlogSearch(BlogPostContent, query) {
    const terms = normalizeSearchValue(query).trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
        return true;
    }

    const searchText = getBlogSearchText(BlogPostContent);
    return terms.every(term => searchText.includes(term));
}

function filterBlogs(blogs, query) {
    return blogs.filter(blog => matchesBlogSearch(blog, query));
}

module.exports = {
    filterBlogs,
    getBlogSearchText,
    matchesBlogSearch,
    normalizeSearchValue,
};
