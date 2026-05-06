import React, { JSX } from 'react';
import styles from './KeyFeaturesHero.module.scss';

export function KeyFeaturesHero(): JSX.Element {
    return (
        <section className={styles.hero}>
            <div className={styles.inner}>
                <h1 className={styles.title}>
                    Apache Doris is a real-time analytical database<br />
                    built for hybrid workloads.
                </h1>
                <p className={styles.subtitle}>
                    A unified engine for hybrid search, lakehouse, and high-concurrency analytics.
                </p>
            </div>
        </section>
    );
}
