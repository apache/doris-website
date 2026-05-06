import React, { JSX, useEffect, useState } from 'react';
import { listTagGroups } from '@site/src/utils/key-features-tags';
import { TagChip } from './TagChip';
import styles from './GlossaryFilterSheet.module.scss';

interface Props {
    activeTags: string[];
    onToggle: (tagId: string) => void;
    onClear: () => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    matchCount: number;
}

export function GlossaryFilterSheet({
    activeTags, onToggle, onClear, searchQuery, onSearchChange, matchCount,
}: Props): JSX.Element {
    const [open, setOpen] = useState(false);
    const groups = listTagGroups();
    const activeSet = new Set(activeTags);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [open]);

    return (
        <div className={styles.sheetTrigger}>
            <input
                type="search"
                className={styles.search}
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                aria-label="Search glossary by title"
            />

            <div className={styles.controlRow}>
                <button type="button" className={styles.openBtn} onClick={() => setOpen(true)}>
                    ⚙ Filter{activeTags.length > 0 ? ` (${activeTags.length})` : ''}
                </button>
                {activeTags.length > 0 && (
                    <button type="button" className={styles.clearInline} onClick={onClear}>
                        Clear
                    </button>
                )}
            </div>

            {activeTags.length > 0 && (
                <p className={styles.activeSummary}>
                    Active: {activeTags.join(', ')}
                </p>
            )}

            {open && (
                <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Filter">
                    <div className={styles.sheet}>
                        <div className={styles.sheetHeader}>
                            <span>Filter</span>
                            <button
                                type="button"
                                className={styles.close}
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.sheetBody}>
                            {groups.map(group => (
                                <div key={group.id} className={styles.group}>
                                    <h4 className={styles.groupLabel}>{group.label}</h4>
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
                        </div>
                        <div className={styles.sheetFooter}>
                            <button type="button" className={styles.clearBtn} onClick={onClear}>
                                Clear all
                            </button>
                            <button
                                type="button"
                                className={styles.applyBtn}
                                onClick={() => setOpen(false)}
                            >
                                Apply ({matchCount})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
