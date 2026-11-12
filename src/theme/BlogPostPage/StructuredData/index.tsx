import React from 'react';
import Head from '@docusaurus/Head';
import {useBlogPostStructuredData} from '@docusaurus/plugin-content-blog/client';
import {useContentRouteData} from '@site/src/utils/contentRoute';

export default function BlogPostStructuredData(): JSX.Element {
  const structuredData = useBlogPostStructuredData();
  const page = useContentRouteData();
  return (
    <Head>
      <script type="application/ld+json">
        {JSON.stringify({...structuredData, inLanguage: page?.contentLocale ?? 'en'})}
      </script>
    </Head>
  );
}
