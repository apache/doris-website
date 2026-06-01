import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import './UseCasesSection.scss';

function ArrowIcon(): JSX.Element {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
    );
}

interface UseCase {
    title: string;
    desc: string;
    href: string;
}

const USE_CASES: UseCase[] = [
    {
        title: 'Customer-Facing Analytics',
        desc: 'Ship sub-second, interactive analytics straight to your customers at scale.',
        href: '/use-cases/customer-facing-analytics',
    },
    {
        title: 'Data Warehousing',
        desc: 'One real-time warehouse for analytics across every business domain.',
        href: '/use-cases/data-warehousing',
    },
    {
        title: 'Observability',
        desc: 'High-throughput log and metric analytics for monitoring and incident response.',
        href: '/use-cases/observability',
    },
    {
        title: 'Doris for AI',
        desc: 'Vector, text, and JSON search unified in SQL, built for AI agents and RAG.',
        href: '/use-cases/ai',
    },
];

export function UseCasesSection(): JSX.Element {
    return (
        <section className="use-cases-next" aria-labelledby="use-cases-next-title">
            <div className="home-next-container">
                <div className="use-cases-next__header">
                    <div className="use-cases-next__eyebrow">Use Cases</div>
                    <h2 className="use-cases-next__headline" id="use-cases-next-title">
                        <span>Where Doris Goes To Work</span>
                    </h2>
                </div>

                <div className="use-cases-next__grid">
                    {USE_CASES.map(useCase => (
                        <Link key={useCase.title} to={useCase.href} className="use-cases-next__card">
                            <h3 className="use-cases-next__card-title">{useCase.title}</h3>
                            <p className="use-cases-next__card-desc">{useCase.desc}</p>
                            <span className="use-cases-next__card-link">
                                Learn more
                                <ArrowIcon />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
