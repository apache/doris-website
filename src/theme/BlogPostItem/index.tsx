import React from 'react';
import { translate } from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { usePluralForm } from '@docusaurus/theme-common';
import { blogPostContainerID } from '@docusaurus/utils-common';
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
    const { children, frontMatter, assets, metadata, truncated, isBlogPostPage = false } = props;
    const { date, formattedDate, permalink, tags, readingTime, title, editUrl, authors } = metadata;
    const image = assets.image ?? frontMatter.image;
    const truncatedPost = !isBlogPostPage && truncated;
    const tagsExists = tags.length > 0;
    const TitleHeading = isBlogPostPage ? 'h1' : 'h2';
    const authorsExists = authors && authors.length > 0;
    return (
        <article
            className={!isBlogPostPage ? 'margin-bottom--xl' : 'blog-article-content'}
            itemProp="blogPost"
            itemScope
            itemType="http://schema.org/BlogPosting"
        >
            <header>
                <TitleHeading className="blog-post-title" itemProp="headline">
                    {isBlogPostPage ? (
                        title
                    ) : (
                        <Link itemProp="url" to={permalink}>
                            {title}
                        </Link>
                    )}
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

            {image && <meta itemProp="image" content={withBaseUrl(image, { absolute: true })} />}

            <div
                // This ID is used for the feed generation to locate the main content
                id={isBlogPostPage ? blogPostContainerID : undefined}
                className="markdown"
                itemProp="articleBody"
            >
                <MDXContent>{children}</MDXContent>
            </div>

            {/* {(tagsExists || truncated) && (
        <footer
          className={clsx(
            "row docusaurus-mt-lg",
            isBlogPostPage && "blog-post-details-full"
          )}
        >
          {isBlogPostPage && editUrl && (
            <div className="col margin-top--sm">
              <EditThisPage editUrl={editUrl} />
            </div>
          )}

          {truncatedPost && (
            <div
              className={clsx("col text--right", {
                "col--3": tagsExists,
              })}
            >
              <Link
                to={metadata.permalink}
                aria-label={translate(
                  {
                    message: "Read more about {title}",
                    id: "theme.blog.post.readMoreLabel",
                    description:
                      "The ARIA label for the link to full blog posts from excerpts",
                  },
                  { title }
                )}
              >
                <b>
                  <Translate
                    id="theme.blog.post.readMore"
                    description="The label used in blog post item excerpts to link to full blog posts"
                  >
                    Read More
                  </Translate>
                </b>
              </Link>
            </div>
          )}
        </footer>
      )} */}
        </article>
    );
}
