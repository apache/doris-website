import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type {Props} from '@theme/DocItem/Content';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { isFallbackSource, isTranslatedLocale } from '@site/src/utils/localization';
import {docTranslation} from '@site/src/utils/translation';

/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({children}: Props): JSX.Element {
  const syntheticTitle = useSyntheticTitle();
  const {pluginId} = useDocsVersion();
  const {metadata} = useDoc();
  const {i18n: {currentLocale}} = useDocusaurusContext();
  const contentLanguage = isTranslatedLocale(currentLocale)
    ? docTranslation(metadata)?.contentLocale ?? (isFallbackSource(metadata.source, currentLocale) ? 'en' : currentLocale)
    : undefined;

  if (pluginId === 'course') {
    return <div className="course-doc-content" lang={contentLanguage}><MDXContent>{children}</MDXContent></div>;
  }

  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')} lang={contentLanguage}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
