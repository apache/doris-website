import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { Props } from '@theme/BlogPostItem/Header/Title';
import {translate} from '@docusaurus/Translate';
import {useLocalizedRoute} from '@site/src/utils/useLocalizedRoute';
import {blogCategoryLabel, blogContentLocale} from '@site/src/utils/blogLocale';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BlogLanguageNote from '@site/src/components/blogs/BlogLanguageNote';

export default function BlogPostItemHeaderTitle({ className }: Props): JSX.Element {
    const { metadata, isBlogPostPage } = useBlogPost();
    const { permalink, title, tags } = metadata;
    const TitleHeading = isBlogPostPage ? 'h1' : 'h2';
    const localize = useLocalizedRoute();
    const {i18n: {currentLocale}} = useDocusaurusContext();
    return (
        <>
            <div className="text-center mb-4">
                <Link className="cursor-pointer hover:no-underline" to={localize('/blog/').href} lang={currentLocale}>
                    {translate({id: 'blog.title', message: 'Blog'})}
                </Link>
                <span className="px-2 text-[#8592A6]">/</span>
                <span>
                    <span className="s-tags" lang={currentLocale}>
                        {tags.map((tag, i) => (
                            <span className="s-tag" key={i}>
                                {blogCategoryLabel(tag.label)}
                            </span>
                        ))}
                    </span>
                </span>
            </div>
            <TitleHeading
                lang={blogContentLocale(metadata, currentLocale)}
                className="blog-post-title text-[2rem] leading-normal lg:!text-[2.5rem] text-center"
                itemProp="headline"
            >
                {isBlogPostPage ? (
                    title
                ) : (
                    <Link itemProp="url" to={permalink}>
                        {title}
                    </Link>
                )}
            </TitleHeading>
            {!isBlogPostPage && <BlogLanguageNote metadata={metadata} />}
        </>
    );
}
