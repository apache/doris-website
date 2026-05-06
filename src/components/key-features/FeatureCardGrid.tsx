import React, { JSX } from 'react';
import { KEY_FEATURES } from '@site/src/data/key-features.config';
import { FeatureCard } from './FeatureCard';
import styles from './FeatureCardGrid.module.scss';

export function FeatureCardGrid(): JSX.Element {
    return (
        <section className={styles.gridSection}>
            <div className={styles.grid}>
                {KEY_FEATURES.map(card => (
                    <div
                        key={card.slug}
                        className={card.featured ? styles.cellFeatured : styles.cell}
                    >
                        <FeatureCard card={card} />
                    </div>
                ))}
            </div>
        </section>
    );
}
