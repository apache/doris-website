import React, { type JSX } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import styles from './LocalizedNotice.module.css';

/**
 * Shown on a translated locale's page that has no translation yet, so the
 * content comes from the source locale. The text belongs to the locale's
 * dictionary, and the link targets the source page directly.
 */
export default function SourceFallback({ permalink }: { permalink: string }): JSX.Element {
    const { search, hash } = useLocation();
    const { i18n } = useDocusaurusContext();
    const { currentLocale, defaultLocale } = i18n;
    const sourcePath = permalink.startsWith(`/${currentLocale}/`)
        ? permalink.slice(currentLocale.length + 1)
        : permalink;
    return (
        <aside className={styles.notice} lang={currentLocale}
            aria-label={translate({ id: 'docs.translation.status.label', message: 'Translation status' })}>
            <strong>{translate({ id: 'docs.translation.untranslated',
                message: 'This page is not translated yet.' })}</strong>{' '}
            {translate({ id: 'docs.translation.showingSource',
                message: 'Showing the source content for the current version.' })}{' '}
            <Link to={`pathname://${sourcePath}${search}${hash}`} autoAddBaseUrl={false} hrefLang={defaultLocale}>
                {translate({ id: 'docs.translation.openSource', message: 'Open the source page' })}
            </Link>
        </aside>
    );
}
