import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useLocation} from '@docusaurus/router';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import {languageMessages} from '@site/src/utils/languageMessages';
import {appendRouteSuffix} from '@site/src/utils/localizedRoute';
import './PageContent.scss';

export function PageFallbackNotice() {
    const page = useContentRouteData();
    const {i18n: {currentLocale}} = useDocusaurusContext();
    const {search, hash} = useLocation();
    const browser = useIsBrowser();
    if (!page?.fallback || !['page', 'blog'].includes(page.kind)) return null;
    const messages = languageMessages(currentLocale);
    return <aside className="page-fallback-notice" lang={currentLocale} aria-label={messages.note}>
        <span>{messages.fallback}</span>{' '}
        <a href={appendRouteSuffix(page.navigationRoutes.en, browser ? search : '', browser ? hash : '')} hrefLang="en">{messages.english}</a>
    </aside>;
}
export function PageContent({children}: {children: React.ReactNode}) {
    const page = useContentRouteData();
    return <div data-content-id={page?.contentId} lang={page?.contentLocale}>{children}</div>;
}
