import React, { type JSX } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import styles from './JapaneseFallback.module.css';

export default function JapaneseFallback({ permalink }: { permalink: string }): JSX.Element {
    const { search, hash } = useLocation();
    const englishPath = permalink.replace(/^\/ja(?=\/)/, '');
    return (
        <aside className={styles.notice} lang="ja" aria-label="翻訳状況">
            <strong>このページはまだ日本語に翻訳されていません。</strong>{' '}
            現在のバージョンの英語原文を表示しています。{' '}
            <Link to={`pathname://${englishPath}${search}${hash}`} autoAddBaseUrl={false} hrefLang="en">
                英語版を開く
            </Link>
        </aside>
    );
}
