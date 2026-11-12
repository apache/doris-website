import React from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useContentRouteData} from '@site/src/utils/contentRoute';

export default function BlogPostPageMetadata(): JSX.Element {
  const {assets, metadata} = useBlogPost();
  const {title, description, date, tags, authors, frontMatter} = metadata;
  const {
    i18n: {currentLocale, defaultLocale},
    siteConfig: {url},
  } = useDocusaurusContext();

  const page = useContentRouteData();
  const {keywords} = frontMatter;
  const image = assets.image ?? frontMatter.image;
  // The blog plugin falls back per file: a post without a translated
  // counterpart is the default locale's article. It keeps the localized URL,
  // but the default locale's copy is the one worth ranking.
  const isDefaultLocalePost =
    page ? page.fallback : currentLocale !== defaultLocale && !(metadata.source ?? '').startsWith(`@site/i18n/${currentLocale}/`);
  return (
    <PageMetadata
      title={frontMatter.title_meta ?? title}
      description={description}
      keywords={keywords}
      image={image}>
      {isDefaultLocalePost && <link rel="canonical" href={url + (page?.navigationRoutes[defaultLocale] ?? metadata.permalink)} />}
      {(page && !page.indexable) && <meta name="robots" content="noindex, follow" />}
      <meta property="og:type" content="article" />
      <meta property="article:published_time" content={date} />
      {/* TODO double check those article meta array syntaxes, see https://ogp.me/#array */}
      {authors.some((author) => author.url) && (
        <meta
          property="article:author"
          content={authors
            .map((author) => author.url)
            .filter(Boolean)
            .join(',')}
        />
      )}
      {tags.length > 0 && (
        <meta
          property="article:tag"
          content={tags.map((tag) => tag.label).join(',')}
        />
      )}
    </PageMetadata>
  );
}
