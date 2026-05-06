export interface FeatureCard {
    slug: string;          // matches the markdown filename in key-features-docs/features/<slug>.md
                           // resolves to /why-doris/key-features/features/<slug>
    title: string;
    tagline: string;
    bullets: string[];
    icon: string;
    featured?: boolean;
}

export const KEY_FEATURES: FeatureCard[] = [
    {
        slug: 'hybrid-search',
        title: 'Hybrid Search',
        tagline: 'Vector + full-text + scalar in one query',
        bullets: [
            'Native vector index with HNSW',
            'Inverted index with BM25 scoring',
            'Hybrid scoring & re-ranking',
            'Single SQL surface',
        ],
        icon: '/images/key-features/hybrid-search.svg',
        featured: true,
    },
    {
        slug: 'lakehouse',
        title: 'Lakehouse',
        tagline: 'Query Iceberg, Hudi, and Paimon directly',
        bullets: [
            'Multi-catalog federation',
            'Open table format support',
            'Predicate pushdown to object storage',
            'No ETL needed',
        ],
        icon: '/images/key-features/lakehouse.svg',
        featured: true,
    },
    {
        slug: 'materialized-view',
        title: 'Async Materialized Views',
        tagline: 'Precompute, transparently rewrite',
        bullets: [
            'Incremental refresh',
            'Transparent query rewrite',
            'Multi-table joins supported',
        ],
        icon: '/images/key-features/materialized-view.svg',
    },
];
