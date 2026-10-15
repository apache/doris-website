import React from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {docTranslation} from '@site/src/utils/translation';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function DocItemMetadata(): JSX.Element {
  const {metadata, frontMatter, assets} = useDoc();
  const translation = docTranslation(metadata);
  const {siteConfig: {url}} = useDocusaurusContext();
  return (
    <PageMetadata
      title={metadata.title}
      description={metadata.description}
      keywords={frontMatter.keywords}
      image={assets.image ?? frontMatter.image}
    >
      {translation && !translation.indexable && <meta name="robots" content="noindex, follow" />}
      {translation && !translation.useTarget && <link rel="canonical" href={url + translation.englishPermalink} />}
      {translation && !translation.useTarget && <meta property="og:url" content={url + translation.englishPermalink} />}
    </PageMetadata>
  );
}
