import React, { JSX } from 'react';
import './FeaturesSection.scss';

interface Feature {
    title: string;
    description: string;
    icon: JSX.Element;
}

const FEATURES: Feature[] = [
    {
        title: 'Real-time ingestion & storage',
        description:
            'Push-based micro-batch and pull-based streaming ingestion within a second. Storage engine with real-time upsert, append, and pre-aggregation.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <path d="M14 9V6M11 6h6M21 10l-1.1-1.1" stroke="#C9FFE6" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="14" cy="17" r="6" fill="white" />
                <path d="M16.5 13.5L14 16" stroke="#11A679" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: 'Lightning-fast query',
        description:
            'Optimised for high-concurrency and high-throughput queries with columnar storage, MPP architecture, cost-based optimizer, and vectorized execution.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <path
                    d="M8 17c-1.2 1-1.6 4.2-1.6 4.2S10.6 20.6 11.8 19.2C12.3 18.6 12.3 17.5 11.6 16.8C10.8 16.2 9 16.3 8 17Z"
                    fill="#C9FFE6"
                />
                <path
                    d="M13 17.5L10 14.5c.4-1 1-2.2 1.8-3.3C13 9 14.7 7.7 16.7 7c1.8-.6 3.7-.5 5.3 0 0 2.1-.6 7-5.3 10C15.4 17.5 14.2 17.6 13 17.5Z"
                    fill="white"
                />
            </svg>
        ),
    },
    {
        title: 'Federated querying',
        description:
            'Query Hive, Iceberg, Hudi, Delta Lake, and external databases like MySQL and PostgreSQL without moving data.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <rect x="10" y="10" width="10" height="10" rx="1.2" fill="#C9FFE6" />
                <rect x="8" y="8" width="10" height="10" rx="1.2" fill="white" />
            </svg>
        ),
    },
    {
        title: 'Semi-structured data',
        description:
            'Native Array, Map, and JSON types. Variant type with auto type inference. Inverted index and NGram Bloom filter for full-text search.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <rect x="6" y="8" width="16" height="13" rx="1.2" fill="#C9FFE6" />
                <rect x="6" y="8" width="16" height="7" rx="1.2" fill="white" />
                <rect x="8" y="10" width="4" height="2" rx="1" fill="#11A679" />
                <rect x="8" y="16" width="6" height="2" rx="1" fill="#11A679" />
            </svg>
        ),
    },
    {
        title: 'Elastic architecture',
        description:
            'Linear scalability with distributed design. Supports shared-nothing clusters and storage-compute separation for efficient tiered storage.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <ellipse cx="14" cy="10" rx="7" ry="3" fill="white" />
                <path
                    d="M7 10v8c0 1.7 3.1 3 7 3s7-1.3 7-3V10"
                    stroke="#C9FFE6" strokeWidth="1.6" fill="none"
                />
                <path
                    d="M7 14c0 1.7 3.1 3 7 3s7-1.3 7-3"
                    stroke="white" strokeWidth="1.6" fill="none"
                />
            </svg>
        ),
    },
    {
        title: 'Open ecosystem',
        description:
            'MySQL-protocol compatible, ANSI SQL, easy BI integration. Open data API for Spark, Flink, and AI/ML compute engines.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <circle cx="14" cy="14" r="14" fill="#11A679" />
                <circle cx="14" cy="10" r="4" fill="white" />
                <circle cx="10" cy="17" r="4" fill="#C9FFE6" />
                <circle cx="18" cy="17" r="4" fill="white" />
            </svg>
        ),
    },
];

export function FeaturesSection(): JSX.Element {
    return (
        <section className="features-next">
            <div className="features-next__inner">
                <header className="features-next__header">
                    <span className="features-next__eyebrow">Core Capabilities</span>
                    <h2 className="features-next__title">
                        Built for every kind of<br />
                        <span className="features-next__title-accent">modern analytics workload</span>
                    </h2>
                </header>

                <div className="features-next__grid">
                    {FEATURES.map((feat, i) => (
                        <div className="features-next__card" key={i}>
                            <div className="features-next__card-icon">{feat.icon}</div>
                            <h3 className="features-next__card-title">{feat.title}</h3>
                            <p className="features-next__card-desc">{feat.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
