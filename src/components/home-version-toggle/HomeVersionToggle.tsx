import React, { JSX } from 'react';
import styles from './HomeVersionToggle.module.css';

interface HomeVersionToggleProps {
    isV2: boolean;
    onToggle: () => void;
}

export function HomeVersionToggle({ isV2, onToggle }: HomeVersionToggleProps): JSX.Element {
    return (
        <button
            className={isV2 ? styles.btnClassic : styles.btnNew}
            onClick={onToggle}
            title={isV2 ? 'Switch back to classic homepage' : 'Try the new homepage design'}
        >
            {isV2 ? '← Back to Classic' : '✨ Try New Design'}
        </button>
    );
}
