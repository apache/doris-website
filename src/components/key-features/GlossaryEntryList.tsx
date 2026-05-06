import React, { JSX, useMemo } from 'react';
import Link from '@docusaurus/Link';
import type { GlossaryEntry } from './glossaryFilter';
import { TagChip } from './TagChip';
import styles from './GlossaryEntryList.module.scss';

interface Props {
    entries: GlossaryEntry[];
}

export function GlossaryEntryList({ entries }: Props): JSX.Element {
    const grouped = useMemo(() => {
        const map = new Map<string, GlossaryEntry[]>();
        for (const entry of entries) {
            const letter = entry.title.charAt(0).toUpperCase();
            const key = /[A-Z]/.test(letter) ? letter : '#';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(entry);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [entries]);

    if (entries.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No concepts match the current filters.</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {grouped.map(([letter, items]) => (
                <section key={letter} className={styles.section}>
                    <h2 className={styles.letter}>{letter}</h2>
                    <ul className={styles.items}>
                        {items.map(entry => (
                            <li key={entry.slug} className={styles.item}>
                                <Link
                                    to={`/why-doris/key-features/glossary/${entry.slug}`}
                                    className={styles.title}
                                >
                                    {entry.title}
                                </Link>
                                <div className={styles.tagRow}>
                                    {entry.tags.map(t => <TagChip key={t} tagId={t} />)}
                                </div>
                                {entry.summary && <p className={styles.summary}>{entry.summary}</p>}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
