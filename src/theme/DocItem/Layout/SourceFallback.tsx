import React, { type JSX } from 'react';
import Link from '@docusaurus/Link';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {languageMessages} from '@site/src/utils/languageMessages';
import styles from './LocalizedNotice.module.css';

/**
 * Shown on a translated locale's page that has no translation yet, so the
 * content comes from the source locale. The text belongs to the locale's
 * dictionary, and the link targets the source page directly.
 */
export default function SourceFallback({ permalink }: { permalink: string }): JSX.Element {
    const { search, hash } = useLocation();
    const suffix = useIsBrowser() ? search + hash : '';
    const { i18n } = useDocusaurusContext();
    const { currentLocale, defaultLocale } = i18n;
    const page = useContentRouteData();
    const messages = languageMessages(currentLocale);
    const sourcePath = page?.navigationRoutes[defaultLocale] ?? (permalink.startsWith(`/${currentLocale}/`)
        ? permalink.slice(currentLocale.length + 1)
        : permalink);
    return (
        <aside className={styles.notice} lang={currentLocale}
            aria-label={messages.note}>
            <strong>{messages.fallback}</strong>{' '}
            <Link to={`pathname://${sourcePath}${suffix}`} autoAddBaseUrl={false} hrefLang={defaultLocale}>
                {messages.english}
            </Link>
        </aside>
    );
}
