import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { PageMetadata, HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import BlogLayout from '../BlogLayout';
import BlogListItem from '../BlogListItem';
import './styles.scss';
import useIsBrowser from '@docusaurus/useIsBrowser';

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
            <PageMetadata title={title} description={blogDescription} />
        </>
    );
}

function getBlogCatetories(props) {
    const { siteConfig } = useDocusaurusContext();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;
    const allText = isCN ? '全部' : 'All';
    const { items } = props;
    const allCategory = { label: allText, values: [] };
    const categories = [allCategory];

    useEffect(() => {
        sessionStorage.setItem('tag', allText);
    }, [isCN]);
    items.forEach(({ content: BlogPostContent }) => {
        const { frontMatter } = BlogPostContent;
        const tags = frontMatter.tags || [];
        if (tags.length > 0) {
            tags.forEach(tag => {
                const index = categories.length > 0 ? categories.findIndex(cate => cate.label === tag) : -1;
                if (index > -1) {
                    const curCategory = categories[index];
                    curCategory.values.push(BlogPostContent);
                } else {
                    const category = {
                        label: tag,
                        values: [BlogPostContent],
                    };
                    categories.push(category);
                }
                if (allCategory.values.every(val => val.metadata.permalink !== BlogPostContent.metadata.permalink)) {
                    allCategory.values.push(BlogPostContent);
                }
            });
        }
    });
    return categories;
}

function BlogListPageContent(props) {
    const { metadata, items, sidebar } = props;
    const isBrowser = useIsBrowser();
    const [blogs, setBlogs] = useState([]);
    const blogCategories = getBlogCatetories(props);

    const { siteConfig } = useDocusaurusContext();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;
    const allText = isCN ? '全部' : 'All';
    const [active, setActive] = useState(() => {
        const tag = isBrowser ? sessionStorage.getItem('tag') : allText;
        return tag || allText;
    });
    const [pageSize, setPageSize] = useState<number>(8);
    let [pageNumber, setPageNumber] = useState<number>(1);
    const [currentBlogs, setCurrentBlogs] = useState([]);

    const changeCategory = category => {
        setPageNumber(1);
        setActive(category);
        let currentCategory = blogCategories.find(item => item.label === category);
        if (!currentCategory) {
            setActive(allText);
            currentCategory = blogCategories.find(item => item.label === allText);
        }
        setBlogs(currentCategory.values);
        
    };

    useEffect(() => {
        changeCategory(active);
        isBrowser && sessionStorage.setItem('tag', active);
    }, [active]);

    return (
        <BlogLayout sidebar={sidebar} pageType="blogList">
            <div className="blog-list-wrap row">
                <div className="blog-list-nav col col--3">
                    <ul className="category-list">
                        {blogCategories &&
                            blogCategories.map((item, i) => (
                                <li
                                    className={clsx('category-item', active === item.label && 'active')}
                                    key={i}
                                    onClick={() => changeCategory(item.label)}
                                >
                                    {item.label}
                                </li>
                            ))}
                    </ul>
                </div>
                <div className="blot-list col col--9">
                    {blogs.map((BlogPostContent, i) => (
                        <BlogListItem
                            key={BlogPostContent.metadata.permalink + i}
                            frontMatter={BlogPostContent.frontMatter}
                            assets={BlogPostContent.assets}
                            metadata={BlogPostContent.metadata}
                            truncated={BlogPostContent.metadata.truncated}
                        >
                            <BlogPostContent />
                        </BlogListItem>
                    ))}
                </div>
            </div>
        </BlogLayout>
    );
}

export default function BlogListPage(props) {
    return (
        <HtmlClassNameProvider className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogListPage)}>
            <BlogListPageMetadata {...props} />
            <BlogListPageContent {...props} />
        </HtmlClassNameProvider>
    );
}
