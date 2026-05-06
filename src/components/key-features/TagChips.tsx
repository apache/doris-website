import React, { JSX } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { TagChip } from './TagChip';
import styles from './TagChips.module.scss';

interface TagChipsProps {
    tags?: string[];   // explicit override; if omitted, read from current doc frontmatter
}

// TagChips is invoked inside MDX docs — useDoc() is therefore always available.
// To stay compliant with the Rules of Hooks, we always call useDoc() at the top
// regardless of whether `tags` was passed explicitly.
export function TagChips({ tags }: TagChipsProps): JSX.Element | null {
    const doc = useDoc();
    const resolved = tags ?? ((doc.frontMatter.tags as string[] | undefined) ?? []);

    if (!resolved.length) return null;

    return (
        <div className={styles.row}>
            {resolved.map(t => <TagChip key={t} tagId={t} />)}
        </div>
    );
}
