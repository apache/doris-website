import React, { JSX } from 'react';
import { getTagMeta } from '@site/src/utils/key-features-tags';
import styles from './TagChip.module.scss';

interface TagChipProps {
    tagId: string;
    onClick?: () => void;
    active?: boolean;
}

export function TagChip({ tagId, onClick, active }: TagChipProps): JSX.Element {
    const { label, color } = getTagMeta(tagId);
    const interactive = typeof onClick === 'function';

    const style: React.CSSProperties = {
        '--chip-color': color,
    } as React.CSSProperties;

    const className = [
        styles.chip,
        active ? styles.active : '',
        interactive ? styles.interactive : '',
    ].filter(Boolean).join(' ');

    if (interactive) {
        return (
            <button type="button" className={className} style={style} onClick={onClick} aria-pressed={active ?? false}>
                {label}
            </button>
        );
    }
    return <span className={className} style={style}>{label}</span>;
}
