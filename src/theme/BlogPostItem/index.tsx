import React from 'react';
import clsx from 'clsx';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { Redirect } from '@docusaurus/router';
import type { Props } from '@theme/BlogPostItem';
import { BLOG_RELATED_EXTERNAL_LINK } from './blog.data';

import './styles.scss';

// apply a bottom margin in list view
function useContainerClassName() {
    const { isBlogPostPage } = useBlogPost();
    return !isBlogPostPage ? 'margin-bottom--xl' : undefined;
}

export default function BlogPostItem({ children, className, ...props }: Props): React.ReactElement {
    const containerClassName = useContainerClassName();
    const isBrowser = useIsBrowser();
    if (isBrowser) {
        for (let item of BLOG_RELATED_EXTERNAL_LINK) {
            if (location.pathname.startsWith(item.path)) {
                window.location.href = item.externalLink;
                return;
            }
        }
    }

    return (
        <BlogPostItemContainer className={clsx(containerClassName, className)}>
            <BlogPostItemHeader />
            <BlogPostItemContent>{children}</BlogPostItemContent>
            {/* <BlogPostItemFooter /> */}
        </BlogPostItemContainer>
    );
}
