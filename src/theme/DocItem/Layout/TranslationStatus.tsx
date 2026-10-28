import React, {type JSX} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import type {TranslationState} from '@site/src/utils/translation';
import styles from './LocalizedNotice.module.css';
import {languageMessages} from '@site/src/utils/languageMessages';

// Every message belongs to the locale's dictionary, so a locale shows its own
// wording and a partially translated one falls back to the English default.
function description(state: TranslationState,locale:string): string {
    if (state.status === 'untranslated') return translate({id: 'docs.translation.untranslated',
        message: 'This page is not translated yet.'});
    if (state.status === 'stale_prose') return translate({id: 'docs.translation.staleProse',
        message: 'The translation does not reflect the latest wording of the source.'});
    if (state.status === 'source_missing' || state.status === 'source_route_conflict') {
        return translate({id: 'docs.translation.sourceMissing',
            message: 'The source could not be confirmed, so this translation is not shown.'});
    }
    if (state.status === 'unverified' || state.status === 'state_conflict' || state.status === 'target_modified'
        || state.status === 'heading_conflict' || state.reviewStatus === 'unverified') {
        return translate({id: 'docs.translation.unverified',
            message: 'The content and freshness of this translation could not be confirmed.'});
    }
    if (state.status !== 'current') return translate({id: 'docs.translation.stale',
        message: 'The translation does not reflect the latest changes to the source.'});
    if(state.reviewStatus==='manual')return languageMessages(locale).manualTranslation;
    return state.reviewStatus === 'human'
        ? translate({id: 'docs.translation.reviewedHuman', message: 'This translation was reviewed by a person.'})
        : translate({id: 'docs.translation.machine',
            message: 'This page was translated by a large language model (LLM).'});
}

export default function TranslationStatus({state}: {state: TranslationState}): JSX.Element {
    const {search, hash} = useLocation();
    const {i18n} = useDocusaurusContext();
    // SSR has no request query/hash. Render the same initial href on both
    // sides, then update it after hydration (React does not patch a mismatched
    // attribute merely because the initial client location has a suffix).
    const isBrowser = useIsBrowser();
    const suffix = isBrowser ? search + hash : '';
    const target = state.englishPermalink;
    return (
        <aside className={styles.notice} lang={i18n.currentLocale}
            aria-label={translate({id: 'docs.translation.status.label', message: 'Translation status'})}
            data-translation-status={state.status}>
            <strong>{description(state,i18n.currentLocale)}</strong>{' '}
            {!state.useTarget && `${translate({id: 'docs.translation.showingSource',
                message: 'Showing the source content for the current version.'})} `}
            <Link to={`pathname://${target}${suffix}`} autoAddBaseUrl={false} hrefLang={i18n.defaultLocale}>
                {translate({id: 'docs.translation.openSource', message: 'Open the source page'})}
            </Link>
            {state.sourcePermalink !== state.englishPermalink && <>{' '}
                <Link to={`pathname://${state.sourcePermalink}${suffix}`} autoAddBaseUrl={false} hrefLang="zh-CN">
                    {translate({id: 'docs.translation.openChineseSource', message: 'Open the Chinese source page'})}
                </Link>
            </>}
            {state.translatedAt && <span className={styles.translationDate}>
                {translate({id: 'docs.translation.translatedAt', message: 'Translated: '})}
                <time dateTime={state.translatedAt}>{state.translatedAt.slice(0, 10)}</time>
            </span>}
        </aside>
    );
}
