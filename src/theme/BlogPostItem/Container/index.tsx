import React from 'react';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import type { Props } from '@theme/BlogPostItem/Container';
import MDXContent from '@theme/MDXContent';
import { blogPostContainerID } from '@docusaurus/utils-common';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {blogContentLocale} from '@site/src/utils/blogLocale';

import '../styles.scss';

export default function BlogPostItemContainer({ children, className }: Props): JSX.Element {
    const { isBlogPostPage, metadata } = useBlogPost();
    const page = useContentRouteData();
    const {i18n: {currentLocale}} = useDocusaurusContext();
    return (
        <article
            className={!isBlogPostPage ? 'margin-bottom--xl' : 'blog-article-content'}
            lang={page && !page.aggregate ? page.contentLocale : blogContentLocale(metadata, currentLocale)}
            itemProp="blogPost"
            itemScope
            itemType="http://schema.org/BlogPosting"
        >
            <div
                // This ID is used for the feed generation to locate the main content
                id={isBlogPostPage ? blogPostContainerID : undefined}
                className="markdown"
                itemProp="articleBody"
            >
                <MDXContent>{children}</MDXContent>
            </div>
        </article>
    );
}
