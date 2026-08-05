import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '../home-next/LayoutNext';
import './CommunityRoadmap.scss';

const ROADMAP_URL = 'https://github.com/apache/doris/issues/60036';
const TRACKING_ISSUES_URL =
    'https://github.com/apache/doris/issues?q=state%3Aopen%20label%3A%22tracking%20issue%22';
const GOOD_FIRST_ISSUE_URL = 'https://github.com/apache/doris/issues/17176';

interface DevelopmentDestination {
    phase: string;
    title: string;
    titleDetail?: string;
    description: string;
    meta: string;
    href: string;
    ariaLabel: string;
}

const DESTINATIONS: DevelopmentDestination[] = [
    {
        phase: 'Understand the direction',
        title: 'Roadmap',
        titleDetail: '2026',
        description: 'Start with the high-level direction and priorities shaping Apache Doris.',
        meta: 'Issue #60036',
        href: ROADMAP_URL,
        ariaLabel: 'Read the Apache Doris Roadmap 2026 on GitHub (opens in a new tab)',
    },
    {
        phase: 'Follow active work',
        title: 'Tracking Issues',
        description: 'Explore topic-level coordination across features, improvements, and engineering work.',
        meta: 'Live label search',
        href: TRACKING_ISSUES_URL,
        ariaLabel: 'Browse open Apache Doris tracking issues on GitHub (opens in a new tab)',
    },
    {
        phase: 'Find a place to contribute',
        title: 'Good First Issue',
        description: 'Begin with a curated path toward approachable work for new contributors.',
        meta: 'Issue #17176',
        href: GOOD_FIRST_ISSUE_URL,
        ariaLabel: 'View Apache Doris Good First Issue opportunities on GitHub (opens in a new tab)',
    },
];

function ExternalArrow(): JSX.Element {
    return (
        <span className="community-roadmap__card-arrow" aria-hidden="true">
            ↗
        </span>
    );
}

export default function CommunityRoadmap(): JSX.Element {
    return (
        <LayoutNext
            title="Community Development"
            description="Explore the Apache Doris roadmap, active tracking issues, and approachable contribution opportunities."
        >
            <div className="community-roadmap">
                <div className="community-roadmap__background" aria-hidden="true" />

                <div className="community-roadmap__inner">
                    <header className="community-roadmap__hero">
                        <div className="community-roadmap__hero-title">
                            <h1>
                                See what we’re <span>building next.</span>
                            </h1>
                        </div>
                        <p className="community-roadmap__intro">
                            <strong>Apache Doris plans and builds in the open.</strong> Use this guide to understand the
                            direction, follow active engineering work, and find a place to contribute.
                        </p>
                    </header>

                    <section className="community-roadmap__destinations" aria-label="Community development links">
                        <div className="community-roadmap__grid">
                            {DESTINATIONS.map((destination, index) => (
                                <a
                                    className="community-roadmap__card"
                                    href={destination.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={destination.ariaLabel}
                                    key={destination.title}
                                >
                                    <span className="community-roadmap__card-number" aria-hidden="true">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="community-roadmap__card-top">
                                        <p>{destination.phase}</p>
                                        <ExternalArrow />
                                    </div>
                                    <h3>
                                        <span>{destination.title}</span>
                                        {destination.titleDetail && <span>{destination.titleDetail}</span>}
                                    </h3>
                                    <p className="community-roadmap__card-description">{destination.description}</p>
                                    <p className="community-roadmap__card-meta">Opens on GitHub · {destination.meta}</p>
                                </a>
                            ))}
                        </div>
                    </section>

                    <div className="community-roadmap__footer-action">
                        <Link to="/community/how-to-contribute/contribute-to-doris">Read the contribution guide →</Link>
                    </div>
                </div>
            </div>
        </LayoutNext>
    );
}
