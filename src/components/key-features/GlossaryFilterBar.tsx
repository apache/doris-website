import React, { JSX } from 'react';
import { listTagGroups } from '@site/src/utils/key-features-tags';
import { TagChip } from './TagChip';
import styles from './GlossaryFilterBar.module.scss';

interface Props {
    activeTags: string[];
    onToggle: (tagId: string) => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export function GlossaryFilterBar({
    activeTags, onToggle, onClear, searchQuery, onSearchChange,
}: Props): JSX.Element {
    const groups = listTagGroups();
    const activeSet = new Set(activeTags);

    return (
        <div className={styles.bar}>
            <input
                type="search"
                className={styles.search}
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Search glossary by title"
            />

            {groups.map(group => (
                <div key={group.id} className={styles.group}>
                    <span className={styles.groupLabel}>{group.label}:</span>
                    <div className={styles.chipRow}>
                        {group.tagIds.map(tagId => (
                            <TagChip
                                key={tagId}
                                tagId={tagId}
                                onClick={() => onToggle(tagId)}
                                active={activeSet.has(tagId)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {activeTags.length > 0 && (
                <button type="button" className={styles.clear} onClick={onClear}>
                    Clear all ({activeTags.length})
                </button>
            )}
        </div>
    );
}
