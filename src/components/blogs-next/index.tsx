import React, { JSX, useEffect, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import PageHeader from '@site/src/components/PageHeader';
import HeadBlogs from '@site/src/components/blogs/components/head-blogs';
import BlogListItem from '@site/src/theme/BlogListItem';
import BlogListFooter from '@site/src/theme/BlogFooter';
import blogIndexMetadata from '../../../.docusaurus/docusaurus-plugin-content-blog/default/p/blog-3ce.json';
import './blogs-next.scss';
import '@site/src/components/home-next/HomeNext.scss';

declare const require: {
    context: (
        directory: string,
        useSubdirectories: boolean,
        regExp: RegExp,
    ) => {
        keys: () => string[];
        <T = any>(id: string): T;
    };
};

type BlogTag = {
    label: string;
    permalink: string;
    inline?: boolean;
};

type BlogFrontMatter = {
    title: string;
    summary?: string;
    description?: string;
    date: string;
    author?: string;
    externalLink?: string;
    tags?: string[];
    image?: string;
    picked?: string;
    order?: string;
};

type RawBlogPost = {
    permalink: string;
    title: string;
    description: string;
    date: string;
    tags: BlogTag[];
    hasTruncateMarker: boolean;
    authors: Array<{ name?: string; key?: string | null; page?: string | null }>;
    frontMatter: BlogFrontMatter & {
        picked?: string;
        order?: string;
    };
    unlisted: boolean;
};

type BlogCard = {
    frontMatter: RawBlogPost['frontMatter'];
    metadata: {
        permalink: string;
        date: string;
        title: string;
        tags: BlogTag[];
        authors: RawBlogPost['authors'];
        truncated: boolean;
    };
    assets: {
        image?: string;
    };
    content: React.ComponentType;
};

const ALL_TEXT = 'All';
const HIDDEN_BLOG_TABS = new Set(['Release Notes', 'Top News']);
const FIXED_BLOG_TABS = ['Glossary'];
const PAGE_SIZE = 9;

function loadBlogCards(): BlogCard[] {
    const context = require.context(
        '../../../.docusaurus/docusaurus-plugin-content-blog/default',
        false,
        /^\.\/site-blog-.*\.json$/,
    );

    return context
        .keys()
        .map((key: string) => context(key) as RawBlogPost)
        .filter((post: RawBlogPost) => !post.unlisted)
        .sort((a: RawBlogPost, b: RawBlogPost) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((post: RawBlogPost) => ({
            frontMatter: post.frontMatter,
            metadata: {
                permalink: post.permalink,
                date: post.date,
                title: post.title,
                tags: post.tags,
                authors: post.authors,
                truncated: post.hasTruncateMarker,
            },
            assets: {
                image: post.frontMatter.image,
            },
            content: (() => null) as React.ComponentType,
        }));
}

const BLOG_CARDS = loadBlogCards();

function getCategories(posts: BlogCard[]) {
    const allCategory = { label: ALL_TEXT, values: [] as BlogCard[] };
    const categories = [allCategory];

    posts.forEach(post => {
        const tags = post.frontMatter.tags || [];

        if (allCategory.values.every(val => val.metadata.permalink !== post.metadata.permalink)) {
            allCategory.values.push(post);
        }

        tags.forEach(tagLabel => {
            if (!tagLabel || HIDDEN_BLOG_TABS.has(tagLabel)) {
                return;
            }

            const index = categories.findIndex(category => category.label === tagLabel);
            if (index > -1) {
                categories[index].values.push(post);
                return;
            }

            categories.push({
                label: tagLabel,
                values: [post],
            });
        });
    });

    FIXED_BLOG_TABS.forEach(tabLabel => {
        if (!categories.some(category => category.label === tabLabel)) {
            categories.push({ label: tabLabel, values: [] });
        }
    });

    const glossaryIndex = categories.findIndex(category => category.label === 'Glossary');
    if (glossaryIndex > -1 && glossaryIndex !== categories.length - 1) {
        const [glossaryCategory] = categories.splice(glossaryIndex, 1);
        categories.push(glossaryCategory);
    }

    return categories;
}

function parseQuery(search: string) {
    const params = new URLSearchParams(search);
    const page = Number(params.get('currentPage') || '1');
    const category = params.get('currentCategory') || ALL_TEXT;

    return {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        category,
    };
}

export default function BlogsNext(): JSX.Element {
    const location = useLocation();
    const history = useHistory();
    const blogCategories = getCategories(BLOG_CARDS);
    const allCards = blogCategories.find(item => item.label === ALL_TEXT)?.values ?? [];

    const initialQuery = parseQuery(location.search);
    const [active, setActive] = useState(() => initialQuery.category || ALL_TEXT);
    const [currentPage, setCurrentPage] = useState(initialQuery.page);

    useEffect(() => {
        if (initialQuery.category && initialQuery.category !== ALL_TEXT) {
            return;
        }

        const storedTag = sessionStorage.getItem('tag');
        if (storedTag) {
            setActive(storedTag);
        }
    }, []);

    useEffect(() => {
        const query = parseQuery(location.search);
        setActive(query.category || ALL_TEXT);
        setCurrentPage(query.page);
    }, [location.search]);

    useEffect(() => {
        const nextSearch = `?currentPage=${currentPage}&currentCategory=${encodeURIComponent(active)}#blog`;
        if (location.search !== nextSearch.replace('#blog', '')) {
            history.push(`${location.pathname}${nextSearch}`, location.state);
        }

        sessionStorage.setItem('tag', active);
    }, [active, currentPage, history, location.pathname, location.search, location.state]);

    const currentCategory = blogCategories.find(item => item.label === active) ?? blogCategories[0];
    const currentCards = currentCategory.values.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const featuredTop = allCards.find(card => Number(card.frontMatter.order) === 1) ?? allCards[0];

    return (
        <LayoutNext title={blogIndexMetadata.metadata.blogTitle} description={blogIndexMetadata.metadata.blogDescription}>
            <section id="blog" className="blogs-next">
                <div className="home-next-container">
                    <PageHeader title="Blog" className="bg-white" />

                    <div className="flex flex-col lg:max-w-7xl">
                        {featuredTop && (
                            <HeadBlogs
                                blogs={allCards.map(card => ({
                                    frontMatter: card.frontMatter,
                                    assets: card.assets,
                                    metadata: card.metadata,
                                    truncated: card.metadata.truncated,
                                    content: card.content,
                                }))}
                            />
                        )}

                        <ul className="scrollbar-none w-[100%] mt-6 custom-scrollbar m-auto flex gap-3 overflow-auto text-[#4C576C] lg:mt-[5.5rem] lg:justify-center lg:gap-6">
                            {blogCategories.map((item, index) => (
                                <li className="py-px" key={index}>
                                    <button
                                        type="button"
                                        aria-pressed={active === item.label}
                                        className={`block cursor-pointer whitespace-nowrap rounded-[2.5rem] px-4 py-2 text-sm shadow-[0px_1px_4px_0px_rgba(0,89,68,0.10)] hover:bg-primary hover:text-white lg:px-6 lg:py-3 lg:text-base ${
                                            active === item.label ? 'bg-primary text-white' : ''
                                        }`}
                                        onClick={() => {
                                            setActive(item.label);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <ul className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-3 m-auto">
                            {currentCards.map((card, i) => (
                                <BlogListItem
                                    key={card.metadata.permalink + i}
                                    frontMatter={card.frontMatter}
                                    assets={card.assets}
                                    metadata={card.metadata}
                                    truncated={card.metadata.truncated}
                                >
                                    <card.content />
                                </BlogListItem>
                            ))}
                        </ul>

                        <BlogListFooter total={currentCategory.values.length} currentPage={currentPage} currentCategory={active} />
                    </div>
                </div>
            </section>
        </LayoutNext>
    );
}
