import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import type { GlossaryEntry } from '@site/src/components/key-features/glossaryFilter';
import { useGlossaryFilters } from '@site/src/components/key-features/useGlossaryFilters';
import { GlossaryFilterBar } from '@site/src/components/key-features/GlossaryFilterBar';
import { GlossaryFilterSheet } from '@site/src/components/key-features/GlossaryFilterSheet';
import { GlossaryEntryList } from '@site/src/components/key-features/GlossaryEntryList';
import styles from './index.module.scss';

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

export default function GlossaryIndex(): JSX.Element {
    const all = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);
    const data = all?.default as { entries?: GlossaryEntry[] } | undefined;
    const entries = data?.entries ?? [];

    const {
        activeTags, searchQuery, setSearchQuery,
        toggleTag, clearTags, filtered,
    } = useGlossaryFilters(entries);

    return (
        <Layout
            title="Concept Glossary"
            description="Atomic technical concepts used across Apache Doris's features."
        >
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <h1 className={styles.title}>Concept Glossary</h1>
                    <p className={styles.subtitle}>
                        Atomic technical concepts, used and referenced across Doris's features.
                        <strong> {entries.length} entries.</strong>
                    </p>
                </div>
            </header>

            <GlossaryFilterBar
                activeTags={activeTags}
                onToggle={toggleTag}
                onClear={clearTags}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <GlossaryFilterSheet
                activeTags={activeTags}
                onToggle={toggleTag}
                onClear={clearTags}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                matchCount={filtered.length}
            />

            <GlossaryEntryList entries={filtered} />
        </Layout>
    );
}
