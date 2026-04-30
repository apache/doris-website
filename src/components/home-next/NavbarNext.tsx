import React, { JSX, useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import './NavbarNext.scss';

const GITHUB_REPO = 'apache/doris';
const FALLBACK_STARS = '14.2k';

function formatStars(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function useGitHubStars(repo: string, fallback: string): string {
    const [stars, setStars] = useState(fallback);
    useEffect(() => {
        let cancelled = false;
        fetch(`https://api.github.com/repos/${repo}`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (!cancelled && data && typeof data.stargazers_count === 'number') {
                    setStars(formatStars(data.stargazers_count));
                }
            })
            .catch(() => { /* keep fallback on network/CORS/rate-limit errors */ });
        return () => {
            cancelled = true;
        };
    }, [repo]);
    return stars;
}

interface DropdownItem {
    label: string;
    href: string;
}

interface NavItem {
    label: string;
    items: DropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Why Doris',
        items: [
            { label: 'Key Features', href: '#' },
            { label: 'Doris vs. Others', href: '#' },
            { label: 'Benchmarks', href: '#' },
            { label: 'User Stories', href: '#' },
        ],
    },
    {
        label: 'Use Cases',
        items: [
            { label: 'Customer-Facing Analytics', href: '#' },
            { label: 'Data Warehousing', href: '#' },
            { label: 'Observability', href: '#' },
            { label: 'Doris for AI', href: '#' },
        ],
    },
    {
        label: 'Docs',
        items: [
            { label: 'dev', href: '#' },
            { label: '4.x', href: '#' },
        ],
    },
    {
        label: 'Blogs',
        items: [
            { label: 'Release Notes', href: '#' },
            { label: 'Engineering', href: '#' },
            { label: 'User Stories', href: '#' },
            { label: 'News and Events', href: '#' },
        ],
    },
    {
        label: 'Community',
        items: [
            { label: 'Join Slack', href: '#' },
            { label: 'Join GitHub Discussions', href: '#' },
        ],
    },
];

function ChevronDown(): JSX.Element {
    return (
        <svg className="navbar-next__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function StarIcon(): JSX.Element {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0l2.4 5.5L16 6.2l-4 3.9 1 5.9L8 13.2l-5 2.8 1-5.9-4-3.9 5.6-.7L8 0z" />
        </svg>
    );
}

function GitHubIcon(): JSX.Element {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );
}

export function NavbarNext(): JSX.Element {
    const stars = useGitHubStars(GITHUB_REPO, FALLBACK_STARS);
    return (
        <nav className="navbar-next">
            <div className="navbar-next__inner">
                <Link to="/" className="navbar-next__logo">
                    <img src="/images/logo-doris.svg" alt="Apache Doris" />
                    <span>Doris</span>
                </Link>

                <div className="navbar-next__nav">
                    {NAV_ITEMS.map(item => (
                        <div key={item.label} className="navbar-next__item">
                            <button className="navbar-next__trigger" type="button">
                                {item.label}
                                <ChevronDown />
                            </button>
                            <div className="navbar-next__dropdown">
                                {item.items.map(sub => (
                                    <Link key={sub.label} to={sub.href} className="navbar-next__dropdown-link">
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="navbar-next__actions">
                    <a
                        href={`https://github.com/${GITHUB_REPO}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="navbar-next__star-link"
                        aria-label={`Star Apache Doris on GitHub (${stars} stars)`}
                    >
                        <StarIcon />
                        <span>Star</span>
                        <span className="navbar-next__star-divider" />
                        <span className="navbar-next__star-count">{stars}</span>
                        <span className="navbar-next__star-divider" />
                        <GitHubIcon />
                    </a>
                    <Link to="#" className="navbar-next__cta">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
