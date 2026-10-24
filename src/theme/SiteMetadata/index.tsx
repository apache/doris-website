import React, {type JSX} from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PageMetadata, useThemeConfig} from '@docusaurus/theme-common';
import {DEFAULT_SEARCH_TAG, keyboardFocusedClassName} from '@docusaurus/theme-common/internal';
import {useLocation} from '@docusaurus/router';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import SearchMetadata from '@theme/SearchMetadata';

// SiteMetadata is rendered above Docusaurus's per-route providers. Page data
// belongs in ContentMetadata, attached to native routes by route-context.cjs.
export default function SiteMetadata(): JSX.Element {
    const {siteConfig: {url, baseUrl, trailingSlash}, i18n: {currentLocale, localeConfigs}} = useDocusaurusContext();
    const {pathname} = useLocation();
    const {metadata, image: defaultImage} = useThemeConfig();
    const canonical = url + applyTrailingSlash(pathname, {baseUrl, trailingSlash});
    return <>
        <Head>
            <html lang={localeConfigs[currentLocale].htmlLang} />
            <body className={keyboardFocusedClassName} />
            <meta name="twitter:card" content="summary_large_image" />
            <link rel="canonical" href={canonical} />
            <meta property="og:url" content={canonical} />
            <meta property="og:locale" content={localeConfigs[currentLocale].htmlLang.replace(/-/g, '_')} />
            {/(?:^|\/)(?:404\.html|search\/?)$/.test(pathname) && <meta name="robots" content="noindex, follow" />}
        </Head>
        {defaultImage && <PageMetadata image={defaultImage} />}
        <SearchMetadata tag={DEFAULT_SEARCH_TAG} locale={currentLocale} />
        <Head>{metadata.map((item, i) => <meta key={i} {...item} />)}</Head>
    </>;
}
