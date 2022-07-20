import React from 'react';
import clsx from 'clsx';
import Translate, { translate } from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { usePluralForm } from '@docusaurus/theme-common';
import { blogPostContainerID } from '@docusaurus/utils-common';
import MDXContent from '@theme/MDXContent';
import EditThisPage from '@theme/EditThisPage';
import TagsListInline from '@theme/TagsListInline';
import BlogPostAuthors from '@theme/BlogPostAuthors';
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
export default function BlogListItem(props) {
    const readingTimePlural = useReadingTimePlural();
    const { withBaseUrl } = useBaseUrlUtils();
    const { children, frontMatter, assets, metadata, truncated, isBlogPostPage = false } = props;
    const { date, formattedDate, permalink, tags, readingTime, title, editUrl, authors } = metadata;
    const image = assets.image ?? frontMatter.image;
    const truncatedPost = !isBlogPostPage && truncated;
    const tagsExists = tags.length > 0;
    const TitleHeading = isBlogPostPage ? 'h1' : 'h2';
    const summary = frontMatter.summary;
    const authorsExists = authors && authors.length > 0;
    return (
        <article
            className={!isBlogPostPage ? 'margin-bottom--xl blog-list-item' : undefined}
            itemProp="blogPost"
            itemScope
            itemType="http://schema.org/BlogPosting"
        >
            <Link itemProp="url" to={permalink}>
                {!!image && <div className="blog-preview-img" style={{ backgroundImage: `url(${image})` }}></div>}
                <div className="blog-content">
                    <header>
                        <TitleHeading className="blog-post-title" itemProp="headline">
                            {title}
                        </TitleHeading>
                        <div className="blog-info">
                            <time dateTime={date} itemProp="datePublished">
                                {formattedDate}
                            </time>
                            {authorsExists && (
                                <>
                                    <span className="split-line"></span>
                                    <span className="authors">
                                        {authors.map((author, i) => (
                                            <span className="s-author" key={i}>
                                                {author.name}
                                            </span>
                                        ))}
                                    </span>
                                </>
                            )}

                            {tagsExists && (
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
                            )}
                        </div>
                    </header>
                    <div
                        // This ID is used for the feed generation to locate the main content
                        id={isBlogPostPage ? blogPostContainerID : undefined}
                        className="markdown blog-item-summary"
                        itemProp="articleBody"
                    >
                        {summary}
                    </div>
                </div>
            </Link>
        </article>
    );
}
