import React, { JSX, useState, useEffect, useRef } from 'react';
import './UseCasesSection.scss';

interface UseCase {
    title: string;
    description: string;
    link: { label: string; href: string } | null;
}

const USE_CASES: UseCase[] = [
    {
        title: 'Real-time analytics',
        description:
            'From traditional batch reporting to real-time dashboards. From internal BI to customer-facing analytics. From decision support to algorithm-driven real-time decision-making.',
        link: { label: 'Read JD.com story', href: '/blog/JD_OLAP' },
    },
    {
        title: 'Ad-hoc analysis',
        description:
            "Interactive ad-hoc analysis is replacing predefined reporting, letting a wider range of people perform self-service analysis. Doris' high-performance MPP engine provides fast responses to any query.",
        link: { label: 'Read Xiaomi story', href: '/blog/xiaomi_vector' },
    },
    {
        title: 'Data lakehouse',
        description:
            'Doris as a high-performance federated query engine maps external data lakes and databases directly. Combines the openness of data lakes with the performance of a data warehouse.',
        link: { label: 'Deep dive', href: '/blog/Building-the-Next-Generation-Data-Lakehouse-10X-Performance' },
    },
    {
        title: 'ELT data processing',
        description:
            'As data warehouses grow more powerful, ELT within the database replaces external ETL. Doris supports complex large queries and incremental reads for efficient in-warehouse transforms.',
        link: { label: 'Read use case', href: '/blog/For-Entry-Level-Data-Engineers-How-to-Build-a-Simple-but-Solid-Data-Architecture' },
    },
    {
        title: 'Log analytics',
        description:
            'Store business, system, or IoT log data as structured, semi-structured, or raw text in a unified platform. High-performance retrieval and analytics at cost-effective scale.',
        link: { label: 'Deep dive', href: '/blog/log-analysis-elasticsearch-vs-apache-doris' },
    },
    {
        title: 'Customer data platform',
        description:
            'Gather user attributes and behavioral data, build a comprehensive user data platform, and perform in-depth analysis of engagement, retention, conversion, and audience segmentation.',
        link: { label: 'Read use case', href: '/blog/Replacing-Apache-Hive-Elasticsearch-and-PostgreSQL-with-Apache-Doris/' },
    },
];

const CYCLE_MS = 5000;
const TICK_MS = 50;

function ArrowIcon(): JSX.Element {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function UseCasesSection(): JSX.Element {
    const [active, setActive] = useState(0);
    const [progress, setProgress] = useState(0);
    const pausedRef = useRef(false);
    const progressRef = useRef(0);

    useEffect(() => {
        const id = setInterval(() => {
            if (pausedRef.current) return;
            progressRef.current += (TICK_MS / CYCLE_MS) * 100;
            if (progressRef.current >= 100) {
                progressRef.current = 0;
                setActive(a => (a + 1) % USE_CASES.length);
            }
            setProgress(progressRef.current);
        }, TICK_MS);
        return () => clearInterval(id);
    }, []);

    function selectTab(i: number) {
        setActive(i);
        progressRef.current = 0;
        setProgress(0);
    }

    const current = USE_CASES[active];

    return (
        <section
            className="usecases-next"
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
        >
            <div className="usecases-next__inner">
                <header className="usecases-next__header">
                    <span className="usecases-next__eyebrow">Use Cases</span>
                    <h2 className="usecases-next__title">
                        One database,{' '}
                        <span className="usecases-next__title-accent">every analytics workload</span>
                    </h2>
                </header>

                <div className="usecases-next__body">
                    <nav className="usecases-next__tabs" aria-label="Use cases">
                        {USE_CASES.map((uc, i) => (
                            <button
                                key={i}
                                className={`usecases-next__tab${i === active ? ' usecases-next__tab--active' : ''}`}
                                onClick={() => selectTab(i)}
                                type="button"
                            >
                                <span className="usecases-next__tab-label">{uc.title}</span>
                                {i === active && (
                                    <span className="usecases-next__tab-progress" style={{ width: `${progress}%` }} />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="usecases-next__pane" key={active}>
                        <p className="usecases-next__pane-text">{current.description}</p>
                        {current.link && (
                            <a className="usecases-next__pane-link" href={current.link.href}>
                                {current.link.label}
                                <ArrowIcon />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
