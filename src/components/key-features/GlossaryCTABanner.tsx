import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import { useAllPluginInstancesData } from '@docusaurus/useGlobalData';
import styles from './GlossaryCTABanner.module.scss';

const GLOSSARY_PLUGIN_ID = 'key-features-glossary-index';

export function GlossaryCTABanner(): JSX.Element {
    const all = useAllPluginInstancesData(GLOSSARY_PLUGIN_ID);
    const data = all?.default as { entries?: unknown[] } | undefined;
    const count = data?.entries?.length ?? 0;

    return (
        <section className={styles.banner}>
            <div className={styles.inner}>
                <div>
                    <h2 className={styles.heading}>Concept Glossary</h2>
                    <p className={styles.subheading}>
                        Need to look up a specific technique? <strong>{count}</strong> concepts indexed and growing.
                    </p>
                </div>
                <Link to="/why-doris/key-features/glossary" className={styles.cta}>
                    Browse Concept Glossary →
                </Link>
            </div>
        </section>
    );
}
