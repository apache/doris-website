import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PageMetadata, HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import BlogLayout from '@theme/BlogLayout';
import BlogListItem from '../BlogListItem';
import BlogListFooter from '../BlogFooter';
import HeadBlogs from '@site/src/components/blogs/components/head-blogs';
import PageHeader from '@site/src/components/PageHeader';
import type { Props } from '@theme/BlogListPage';
import { useHistory, useLocation } from '@docusaurus/router';
import { filterBlogs } from './blog-search.logic';
import styles from './styles.module.scss';
// import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
const allText = 'All';
const PAGE_SIZE = 9;
const HIDDEN_BLOG_TABS = new Set(['Release Notes', 'Top News']);
const FIXED_BLOG_TABS = ['Glossary'];

function getBlogCategories(items) {
    const allCategory = { label: allText, values: [] };
    const categories = [allCategory];

    items.forEach(({ content: BlogPostContent }) => {
        const { frontMatter } = BlogPostContent;
        const tags = frontMatter.tags || [];

        if (allCategory.values.every(val => val.metadata.permalink !== BlogPostContent.metadata.permalink)) {
            allCategory.values.push(BlogPostContent);
        }

        if (tags.length > 0) {
            tags.forEach(tag => {
                const tagLabel = typeof tag === 'string' ? tag : tag?.label;
                if (!tagLabel || HIDDEN_BLOG_TABS.has(tagLabel)) {
                    return;
                }

                const index = categories.length > 0 ? categories.findIndex(cate => cate.label === tagLabel) : -1;
                if (index > -1) {
                    const curCategory = categories[index];
                    curCategory.values.push(BlogPostContent);
                } else {
                    const category = {
                        label: tagLabel,
                        values: [BlogPostContent],
                    };
                    categories.push(category);
                }
            });
        }
    });


    FIXED_BLOG_TABS.forEach(tabLabel => {
        if (!categories.some(category => category.label === tabLabel)) {
            categories.push({
                label: tabLabel,
                values: [],
            });
        }
    });

    const glossaryIndex = categories.findIndex(category => category.label === 'Glossary');
    if (glossaryIndex > -1 && glossaryIndex !== categories.length - 1) {
        const [glossaryCategory] = categories.splice(glossaryIndex, 1);
        categories.push(glossaryCategory);
    }

    return categories;
}

function BlogListPageMetadata(props) {
    const { metadata } = props;
    const {
        siteConfig: { title: siteTitle },
    } = useDocusaurusContext();
    const { blogDescription, blogTitle, permalink } = metadata;
    const isBlogOnlyMode = permalink === '/';
    const title = isBlogOnlyMode ? siteTitle : blogTitle;
    return (
        <>
            <PageMetadata title={title} description={blogDescription} keywords="lakehouse, adhoc analysis" />
        </>
    );
}
function BlogListPageContent(props) {
    const { items, sidebar } = props;
    const [blogs, setBlogs] = useState([]);
    const blogCategories = useMemo(() => getBlogCategories(items), [items]);
    const ALL_BLOG = blogCategories.find(item => item.label === allText).values;

    const [active, setActive] = useState(allText);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentBlogs, setCurrentBlogs] = useState([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const location = useLocation();
    const history = useHistory();

    const changeCategory = category => {
        const params = new URLSearchParams(location.search);
        params.set('currentPage', '1');
        params.set('currentCategory', category || allText);
        history.push(`${location.pathname}?${params.toString()}#blog`, location.state);
    };

    const changeSearchQuery = query => {
        setSearchQuery(query);
        const params = new URLSearchParams(location.search);
        params.set('currentPage', '1');
        if (query) {
            params.set('q', query);
        } else {
            params.delete('q');
        }
        history.replace(`${location.pathname}?${params.toString()}#blog`, location.state);
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const requestedPage = Number(params.get('currentPage'));
        const currentPageNumber = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
        const currentCategoryName = params.get('currentCategory') || allText;
        const currentSearchQuery = params.get('q') || '';

        let currentCategory = blogCategories.find(item => item.label === currentCategoryName);
        if (!currentCategory) {
            currentCategory = blogCategories.find(item => item.label === allText);
        }

        const filteredBlogs = filterBlogs(currentCategory.values, currentSearchQuery);
        const lastPage = Math.max(1, Math.ceil(filteredBlogs.length / PAGE_SIZE));
        const normalizedPage = Math.min(currentPageNumber, lastPage);

        setActive(currentCategory.label);
        setSearchQuery(currentSearchQuery);
        setCurrentPage(normalizedPage);
        setBlogs(filteredBlogs);
        setCurrentBlogs(filteredBlogs.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE));
    }, [blogCategories, location.search]);

    const searchLabel = translate({
        id: 'blog.search.label',
        message: 'Search blogs',
        description: 'Accessible label for the search field on the blog list page',
    });

    return (
        <BlogLayout sidebar={sidebar} pageType="blogList" className="lg:max-w-7xl">
            <PageHeader title="Blog" className="bg-white" {...props} />
            <HeadBlogs blogs={ALL_BLOG} />
            <div id="blog" className="flex flex-col lg:max-w-7xl scroll-mt-24">
                <section className={styles.searchSection} aria-label={searchLabel}>
                    <label className={styles.visuallyHidden} htmlFor="blog-search-input">
                        {searchLabel}
                    </label>
                    <div className={styles.searchControl}>
                        <svg
                            className={styles.searchIcon}
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-4-4" />
                        </svg>
                        <input
                            id="blog-search-input"
                            className={styles.searchInput}
                            type="search"
                            value={searchQuery}
                            onChange={event => changeSearchQuery(event.target.value)}
                            placeholder={translate({
                                id: 'blog.search.placeholder',
                                message: 'Search by title, summary, tag, or author',
                            })}
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button
                                className={styles.clearButton}
                                type="button"
                                onClick={() => changeSearchQuery('')}
                            >
                                {translate({ id: 'blog.search.clear', message: 'Clear' })}
                            </button>
                        )}
                    </div>
                    {searchQuery.trim() && (
                        <p className={styles.resultCount} aria-live="polite">
                            {translate(
                                {
                                    id: 'blog.search.resultCount',
                                    message: '{count} blog posts found',
                                },
                                { count: blogs.length },
                            )}
                        </p>
                    )}
                </section>
                <ul className="scrollbar-none w-[100%] mt-6 custom-scrollbar m-auto flex gap-3 overflow-auto text-[#4C576C] lg:justify-center lg:gap-6">
                    {blogCategories.map((item: any, index) => (
                        <li className="py-px" key={index}>
                            <button
                                type="button"
                                onClick={() => changeCategory(item.label)}
                                aria-pressed={active === item.label}
                                className={`block cursor-pointer whitespace-nowrap rounded-[2.5rem] px-4 py-2 text-sm  shadow-[0px_1px_4px_0px_rgba(0,89,68,0.10)] hover:bg-primary hover:text-white lg:px-6 lg:py-3 lg:text-base ${
                                    active === item.label && 'bg-primary text-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
                <ul className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-3 m-auto">
                    {currentBlogs.length > 0 ? (
                        currentBlogs.map((BlogPostContent, i) => (
                            <BlogListItem
                                key={BlogPostContent.metadata.permalink + i}
                                frontMatter={BlogPostContent.frontMatter}
                                assets={BlogPostContent.assets}
                                metadata={BlogPostContent.metadata}
                                truncated={BlogPostContent.metadata.truncated}
                            >
                                <BlogPostContent />
                            </BlogListItem>
                        ))
                    ) : (
                        <li className={styles.emptyState}>
                            {translate({
                                id: 'blog.search.noResults',
                                message: 'No blog posts match this search and category.',
                            })}
                        </li>
                    )}
                </ul>
                <BlogListFooter total={blogs.length} currentPage={currentPage} currentCategory={active} />
            </div>
        </BlogLayout>
    );
}

export default function BlogListPage(props: Props): JSX.Element {
    return (
        <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogListPage)}>
            <BlogListPageMetadata {...props} />
            {/* <BlogListPageStructuredData {...props} /> */}
            <BlogListPageContent {...props} />
        </HtmlClassNameProvider>
    );
}
