import React, {type JSX} from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {keyboardFocusedClassName} from '@docusaurus/theme-common/internal';
import {useLocation} from '@docusaurus/router';
import {applyTrailingSlash} from '@docusaurus/utils-common';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import {localePath, rootBaseUrl} from '@site/src/utils/localizedRoute';
import {useTranslationRoutes} from '@site/src/utils/translation';

export default function ContentMetadata(): JSX.Element {
    const {siteConfig: {url, baseUrl, trailingSlash}, i18n: {currentLocale, defaultLocale, locales, localeConfigs}} = useDocusaurusContext();
    const {pathname} = useLocation();
    const page = useContentRouteData();
    const legacy = useTranslationRoutes();
    const info = localePath(pathname, {url, baseUrl: rootBaseUrl(baseUrl, currentLocale, defaultLocale), defaultLocale, locales});
    // Unknown blog routes stay conservative. Native aggregates carry their own
    // decision based on actual translated membership.
    const blogAggregate = !page && currentLocale !== defaultLocale && /^\/blog(?:\/|$)/.test(info?.path ?? '');
    const contentLocale = page?.contentLocale ?? (blogAggregate ? defaultLocale : currentLocale);
    const canonicalPath = page?.fallback ? page.navigationRoutes[defaultLocale]
        : blogAggregate ? rootBaseUrl(baseUrl, currentLocale, defaultLocale).replace(/\/$/, '') + info.path
        : pathname;
    const canonical = url + applyTrailingSlash(canonicalPath, {baseUrl, trailingSlash});
    const group = page ? Object.fromEntries(page.availableTranslations.map(locale => [locale, page.navigationRoutes[locale]]))
        : blogAggregate ? {} : legacy.group ?? {};
    const noIndex = page ? !page.indexable : blogAggregate || /(?:^|\/)(?:404\.html|search\/?)$/.test(pathname);
    const htmlLang = localeConfigs[contentLocale]?.htmlLang ?? contentLocale;
    return <>
        <Head>
            <html lang={localeConfigs[currentLocale].htmlLang} />
            <body className={keyboardFocusedClassName} />
            <meta name="twitter:card" content="summary_large_image" />
            <link rel="canonical" href={canonical} />
            <meta property="og:url" content={canonical} />
            <meta property="og:locale" content={htmlLang.replace(/-/g, '_')} />
            {noIndex && <meta name="robots" content="noindex, follow" />}
            {Object.entries(group).map(([locale, route]) => <link key={locale} rel="alternate" hrefLang={localeConfigs[locale].htmlLang} href={url + route} />)}
            {group[defaultLocale] && <link rel="alternate" hrefLang="x-default" href={url + group[defaultLocale]} />}
            {page?.kind !== 'utility' && <script type="application/ld+json">{JSON.stringify({'@context': 'https://schema.org', '@type': 'WebPage', url: canonical, inLanguage: contentLocale})}</script>}
        </Head>
    </>;
}

