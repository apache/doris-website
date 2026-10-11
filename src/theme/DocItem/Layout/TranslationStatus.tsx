import React, {type JSX} from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import type {TranslationState} from '@site/src/utils/translation';
import styles from './JapaneseFallback.module.css';

function description(state: TranslationState): string {
    if (state.status === 'untranslated') return 'このページはまだ日本語に翻訳されていません。';
    if (state.status === 'stale_prose') return '日本語訳は原文の最新の表現を反映していません。';
    if (state.status === 'unverified' || state.status === 'state_conflict' || state.status === 'target_modified'
        || state.status === 'heading_conflict' || state.reviewStatus === 'unverified') {
        return '日本語訳の内容や更新状況を確認できていません。';
    }
    if (state.status !== 'current') return '日本語訳は原文の最新の変更を反映していません。';
    return state.reviewStatus === 'human' ? 'この日本語訳は人が校正しています。' : 'このページは機械翻訳されています。';
}

export default function TranslationStatus({state}: {state: TranslationState}): JSX.Element {
    const {search, hash} = useLocation();
    // SSR has no request query/hash. Render the same initial href on both
    // sides, then update it after hydration (React does not patch a mismatched
    // attribute merely because the initial client location has a suffix).
    const isBrowser = useIsBrowser();
    const suffix = isBrowser ? search + hash : '';
    const target = state.englishPermalink;
    return (
        <aside className={styles.notice} lang="ja" aria-label="翻訳状況" data-translation-status={state.status}>
            <strong>{description(state)}</strong>{' '}
            {!state.useTarget && (state.contentLocale === 'en'
                ? '現在のバージョンの英語原文を表示しています。 '
                : '現在のバージョンの中国語原文を表示しています。 ')}
            <Link to={`pathname://${target}${suffix}`} autoAddBaseUrl={false} hrefLang="en">
                英語版を開く
            </Link>
            {state.sourcePermalink !== state.englishPermalink && <>{' '}
                <Link to={`pathname://${state.sourcePermalink}${suffix}`} autoAddBaseUrl={false} hrefLang="zh-CN">
                    中国語原文を開く
                </Link>
            </>}
            {state.translatedAt && <span className={styles.translationDate}>
                {'翻訳日: '}<time dateTime={state.translatedAt}>{state.translatedAt.slice(0, 10)}</time>
            </span>}
        </aside>
    );
}
