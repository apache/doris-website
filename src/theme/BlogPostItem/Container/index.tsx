import React from 'react';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import type { Props } from '@theme/BlogPostItem/Container';
import MDXContent from '@theme/MDXContent';
import { blogPostContainerID } from '@docusaurus/utils-common';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';

import '../styles.scss';

export default function BlogPostItemContainer({ children, className }: Props): JSX.Element {
    const { isBlogPostPage, metadata } = useBlogPost();
    const page = useContentRouteData();
    return (
        <article
            className={!isBlogPostPage ? 'margin-bottom--xl' : 'blog-article-content'}
            lang={page?.contentLocale ?? (metadata.source?.startsWith('@site/i18n/') ? undefined : 'en')}
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
