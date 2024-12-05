import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { HtmlClassNameProvider, ThemeClassNames } from '@docusaurus/theme-common';
import { BlogPostProvider, useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogLayout from '@theme/BlogLayout';
import BlogPostItem from '@theme/BlogPostItem';
import BlogPostPaginator from '@theme/BlogPostPaginator';
import BlogPostPageMetadata from '@theme/BlogPostPage/Metadata';
import BlogPostPageStructuredData from '@theme/BlogPostPage/StructuredData';
import TOC from '@theme/TOC';
import ContentVisibility from '@theme/ContentVisibility';
import type { Props } from '@theme/BlogPostPage';
import type { BlogSidebar } from '@docusaurus/plugin-content-blog';
import RecentBlogs from '@site/src/components/recent-blogs';

function BlogPostPageContent({ sidebar, children }: { sidebar: BlogSidebar; children: ReactNode }): JSX.Element {
    const { metadata, toc } = useBlogPost();
    const { nextItem, prevItem, frontMatter } = metadata;
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
            <ContentVisibility metadata={metadata} />

            <BlogPostItem>{children}</BlogPostItem>
            <RecentBlogs />
            {/* {(nextItem || prevItem) && (
        <BlogPostPaginator nextItem={nextItem} prevItem={prevItem} />
      )} */}
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
                <BlogPostPageStructuredData />
                <BlogPostPageContent sidebar={props.sidebar}>
                    <BlogPostContent />
                </BlogPostPageContent>
            </HtmlClassNameProvider>
        </BlogPostProvider>
    );
}
