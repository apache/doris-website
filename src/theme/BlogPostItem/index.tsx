import React from 'react';
import { translate } from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { usePluralForm } from '@docusaurus/theme-common';
import { blogPostContainerID } from '@docusaurus/utils-common';
import { useBlogPost } from '@docusaurus/theme-common/internal';
import MDXContent from '@theme/MDXContent';
import './styles.scss';
// Very simple pluralization: probably good enough for now
function useReadingTimePlural() {
    const { selectMessage } = usePluralForm();
    return readingTimeFloat => {
        const readingTime = Math.ceil(readingTimeFloat);
        return selectMessage(
            readingTime,
            translate(
                {
                    id: 'theme.blog.post.readingTime.plurals',
                    description:
                        'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
                    message: 'One min read|{readingTime} min read',
                },
                { readingTime },
            ),
        );
    };
}
export default function BlogPostItem(props) {
    const { withBaseUrl } = useBaseUrlUtils();
    const { metadata, isBlogPostPage } = useBlogPost();
    const { children, frontMatter, truncated = false } = props;
    const { date, formattedDate, permalink, tags, readingTime, title, editUrl, authors } = metadata;
    // const image = assets.image ?? frontMatter.image;
    const truncatedPost = !isBlogPostPage && truncated;
    const tagsExists = tags.length > 0;
    const TitleHeading = isBlogPostPage ? 'h1' : 'h2';
    const authorsExists = authors && authors.length > 0;
    console.log(metadata);
    return (
        <>
            <article
                className={!isBlogPostPage ? 'margin-bottom--xl' : 'blog-article-content'}
                itemProp="blogPost"
                itemScope
                itemType="http://schema.org/BlogPosting"
            >
                <header>
                    <div className="text-center mb-4">
                        <Link className="text-[#8592A6] cursor-pointer hover:no-underline" to="/blog">
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
                    <TitleHeading className="blog-post-title text-[2.5rem] text-center" itemProp="headline">
                        {isBlogPostPage ? (
                            title
                        ) : (
                            <Link itemProp="url" to={permalink}>
                                {title}
                            </Link>
                        )}
                    </TitleHeading>
                    <div className="blog-info text-center flex justify-center text-sm text-black">
                        {authorsExists && (
                            <>
                                <span className="authors">
                                    {authors.map((author, i) => (
                                        <span className="s-author text-black" key={i}>
                                            {author.name}
                                        </span>
                                    ))}
                                </span>
                            </>
                        )}
                        {/* {tagsExists && (
                        <>
                            <span className="split-line"></span>
                            <span className="s-tags">
                                {tags.map((tag, i) => (
                                    <span className="s-tag" key={i}>
                                        {tag.label}
                                    </span>
                                ))}
                            </span>
                        </>
                    )} */}
                        <time dateTime={date} itemProp="datePublished" className="text-black ml-4">
                            {formattedDate}
                        </time>
                    </div>
                </header>

                {/* {image && <meta itemProp="image" content={withBaseUrl(image, { absolute: true })} />} */}

                <div
                    // This ID is used for the feed generation to locate the main content
                    id={isBlogPostPage ? blogPostContainerID : undefined}
                    className="markdown"
                    itemProp="articleBody"
                >
                    <MDXContent>{children}</MDXContent>
                </div>
            </article>
        </>
    );
}
