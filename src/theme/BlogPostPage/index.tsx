import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import { BlogPostProvider, useBlogPost } from '@docusaurus/theme-common/internal';
import BlogLayout from '@theme/BlogLayout';
import BlogPostItem from '@theme/BlogPostItem';
import BlogPostPaginator from '@theme/BlogPostPaginator';
import BlogPostPageMetadata from '@theme/BlogPostPage/Metadata';
import TOC from '@theme/TOC';
import type { Props } from '@theme/BlogPostPage';
import type { BlogSidebar } from '@docusaurus/plugin-content-blog';
import Link from '@docusaurus/Link';
import RecentBlogs from '@site/src/components/recent-blogs';

function BlogPostPageContent(props: { sidebar: BlogSidebar; children: ReactNode }): JSX.Element {
    const { sidebar, children } = props;
    const { metadata, toc } = useBlogPost();

    const { nextItem, prevItem, frontMatter, tags } = metadata;
    const {
        hide_table_of_contents: hideTableOfContents,
        toc_min_heading_level: tocMinHeadingLevel,
        toc_max_heading_level: tocMaxHeadingLevel,
    } = frontMatter;

    return (
        <BlogLayout
            sidebar={sidebar}
            toc={
                !hideTableOfContents && toc.length > 0 ? (
                    <TOC toc={toc} minHeadingLevel={tocMinHeadingLevel} maxHeadingLevel={tocMaxHeadingLevel} />
                ) : undefined
            }
        >
            <BlogPostItem>{children}</BlogPostItem>
            {/* <div className="scrollbar-none w-[100%] mt-6 custom-scrollbar m-auto flex gap-3 overflow-auto text-[#4C576C] lg:mt-12 lg:gap-4 pl-4">
                {tags.map((item: any, index) => (
                    <Link className="py-px" to={`/blog?currentPage=1&currentCategory=${item.label}`} key={index}>
                        <span
                            className={`block cursor-pointer whitespace-nowrap rounded-[2.5rem] px-4 py-2 text-sm  bg-[#F7F9FE] hover:bg-[#444FD9] hover:text-white lg:px-6 lg:py-3 lg:text-base `}
                        >
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div> */}
            {/* {(nextItem || prevItem) && <BlogPostPaginator nextItem={nextItem} prevItem={prevItem} />} */}
            <RecentBlogs />
        </BlogLayout>
    );
}

export default function BlogPostPage(props: Props): JSX.Element {
    const BlogPostContent = props.content;
    return (
        <BlogPostProvider content={props.content} isBlogPostPage>
            <HtmlClassNameProvider
                className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogPostPage)}
            >
                <BlogPostPageMetadata />
                <BlogPostPageContent sidebar={props.sidebar}>
                    <BlogPostContent />
                </BlogPostPageContent>
            </HtmlClassNameProvider>
        </BlogPostProvider>
    );
}
