import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import type { FeatureCard as FeatureCardType } from '@site/src/data/key-features.config';
import styles from './FeatureCard.module.scss';

interface FeatureCardProps {
    card: FeatureCardType;
}

export function FeatureCard({ card }: FeatureCardProps): JSX.Element {
    const className = [styles.card, card.featured ? styles.featured : ''].filter(Boolean).join(' ');
    return (
        <Link to={`/why-doris/key-features/features/${card.slug}`} className={className}>
            <div className={styles.iconWrap}>
                <img src={card.icon} alt="" className={styles.icon} aria-hidden="true" />
            </div>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.tagline}>{card.tagline}</p>
            <ul className={styles.bullets}>
                {card.bullets.map(b => <li key={b}>{b}</li>)}
            </ul>
            <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
    );
}
