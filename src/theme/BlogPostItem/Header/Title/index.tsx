import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { Props } from '@theme/BlogPostItem/Header/Title';

export default function BlogPostItemHeaderTitle({ className }: Props): JSX.Element {
    const { metadata, isBlogPostPage } = useBlogPost();
    const { permalink, title, tags } = metadata;
    const TitleHeading = isBlogPostPage ? 'h1' : 'h2';
    return (
        <>
            <div className="text-center mb-4">
                <Link className="!text-[#8592A6] cursor-pointer hover:no-underline" to="/blog">
                    Blog
                </Link>
                <span className="px-2 text-[#8592A6]">/</span>
                <span>
                    <span className="s-tags">
                        {tags.map((tag, i) => (
                            <span className="s-tag" key={i}>
                                {tag.label}
                            </span>
                        ))}
                    </span>
                </span>
            </div>
            <TitleHeading
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
        </>
    );
}
