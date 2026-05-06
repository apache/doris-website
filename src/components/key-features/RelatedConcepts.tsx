import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import styles from './RelatedConcepts.module.scss';

interface GlossaryEntry {
    slug: string;
    title: string;
    summary?: string;
    tags: string[];
}

interface RelatedConceptsProps {
    ids?: string[];
}

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

// RelatedConcepts is invoked inside MDX docs — both useDoc() and the global-data
// hook are therefore always callable. Hooks are placed at the top, before any
// conditional return, to comply with the Rules of Hooks.
export function RelatedConcepts({ ids }: RelatedConceptsProps): JSX.Element | null {
    const doc = useDoc();
    const allPlugins = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);

    const frontMatter = doc.frontMatter as Record<string, unknown>;
    const conceptIds = ids ?? ((frontMatter.related_concepts as string[] | undefined) ?? []);
    if (!conceptIds.length) return null;

    const data = allPlugins?.default as { entries?: GlossaryEntry[] } | undefined;
    const entries = data?.entries ?? [];
    const bySlug = new Map(entries.map(e => [e.slug, e]));

    const resolved = conceptIds
        .map(id => bySlug.get(id))
        .filter((e): e is GlossaryEntry => Boolean(e));

    if (!resolved.length) return null;

    return (
        <section className={styles.section} aria-label="Related concepts">
            <h3 className={styles.heading}>Related concepts</h3>
            <ul className={styles.grid}>
                {resolved.map(entry => (
                    <li key={entry.slug} className={styles.card}>
                        <Link to={`/why-doris/key-features/glossary/${entry.slug}`} className={styles.link}>
                            <span className={styles.title}>{entry.title}</span>
                            {entry.summary && <span className={styles.summary}>{entry.summary}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
