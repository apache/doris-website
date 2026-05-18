import React, { JSX, useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { getLocalePrefix } from '@site/src/utils/locale';
import { STAR_COUNT } from '@site/src/constant/github.data';
import { StarGreenIcon } from '@site/src/components/Icons/star-green-icon';
import './NavbarNext.scss';

const GITHUB_REPO = 'apache/doris';
const STAR_DISPLAY = `${STAR_COUNT}k`;

interface DropdownItem {
    label: string;
    href: string;
    external?: boolean;
}

interface NavItem {
    label: string;
    items: DropdownItem[];
}

function buildNavItems(
    devDocsHref: string,
    stableDocsHref: string,
    v3xDocsHref: string,
    v21DocsHref: string,
    releasesHref: string,
    joinCommunityHref: string,
): NavItem[] {
    return [
        {
            label: 'Why Doris',
            items: [
                { label: 'Doris vs. Others', href: '/why-doris/compare' },
                { label: 'Benchmarks', href: '/why-doris/benchmarks' },
                { label: 'Key Features', href: '/why-doris/key-features' },
                { label: 'User Stories', href: '/why-doris/users' },
            ],
        },
        {
            label: 'Use Cases',
            items: [
                { label: 'Customer-Facing Analytics', href: '/use-cases/customer-facing-analytics' },
                { label: 'Data Warehousing', href: '/use-cases/data-warehousing' },
                { label: 'Observability', href: '/use-cases/observability' },
                { label: 'Doris for AI', href: '/use-cases/ai' },
            ],
        },
        {
            label: 'Docs',
            items: [
                { label: 'Dev', href: devDocsHref },
                { label: '4.x', href: stableDocsHref },
                { label: '3.x', href: v3xDocsHref },
                { label: '2.1', href: v21DocsHref },
            ],
        },
        {
            label: 'Resources',
            items: [
                { label: 'Release Notes', href: releasesHref },
                { label: 'Blogs', href: '/blog' },
                { label: 'News and Events', href: '/events' },
            ],
        },
        {
            label: 'Community',
            items: [
                { label: 'Build with Us', href: joinCommunityHref },
                { label: 'Join GitHub Discussions', href: 'https://github.com/apache/doris/discussions', external: true },
            ],
        },
    ];
}

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

function MenuIcon({ open }: { open: boolean }): JSX.Element {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
                <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
        </svg>
    );
}

export function NavbarNext(): JSX.Element {
    const {
        i18n: { currentLocale, defaultLocale },
    } = useDocusaurusContext();
    const [mobileOpen, setMobileOpen] = useState(false);
    const localePrefix = getLocalePrefix(currentLocale, defaultLocale);
    const devDocsHref = `${localePrefix}/docs/dev/getting-started/what-is-apache-doris`;
    const stableDocsHref = `${localePrefix}/docs/4.x/getting-started/what-is-apache-doris`;
    // 3.x and 2.1 use the legacy slug structure (gettingStarted/ with camelCase).
    const v3xDocsHref = `${localePrefix}/docs/3.x/gettingStarted/what-is-apache-doris`;
    const v21DocsHref = `${localePrefix}/docs/2.1/gettingStarted/what-is-apache-doris`;
    const releasesHref = `${localePrefix}/releases/all-release`;
    const joinCommunityHref = `${localePrefix}/community/join-community`;
    const navItems = buildNavItems(devDocsHref, stableDocsHref, v3xDocsHref, v21DocsHref, releasesHref, joinCommunityHref);
    const [expandedMobileItem, setExpandedMobileItem] = useState(navItems[0]?.label ?? '');
    const homeHref = `${getLocalePrefix(currentLocale, defaultLocale)}/`;

    useEffect(() => {
        if (!mobileOpen) return undefined;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [mobileOpen]);

    return (
        <nav className={`navbar navbar--fixed-top navbar-next${mobileOpen ? ' navbar-next--mobile-open' : ''}`}>
            <div className="navbar-next__inner">
                <Link to={homeHref} className="navbar-next__logo" aria-label="Apache Doris">
                    <img src="/images/logo-doris.svg" alt="Apache Doris" />
                </Link>

                <div className="navbar-next__nav">
                    {navItems.map(item => (
                        <div key={item.label} className="navbar-next__item">
                            <button className="navbar-next__trigger" type="button" aria-haspopup="true">
                                {item.label}
                                <ChevronDown />
                            </button>
                            <div className="navbar-next__dropdown">
                                {item.items.map(sub => (
                                    <Link
                                        key={sub.label}
                                        to={sub.href}
                                        className="navbar-next__dropdown-link"
                                        {...(sub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    >
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    id="navbar-ask-ai-btn"
                    className="navbar-next__ask-ai"
                    aria-label="Ask AI"
                >
                    <StarGreenIcon />
                    <span>Ask AI</span>
                </button>

                <div className="navbar-next__actions">
                    <a
                        href={`https://github.com/${GITHUB_REPO}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="navbar-next__star-link"
                        aria-label={`Star Apache Doris on GitHub (${STAR_DISPLAY} stars)`}
                    >
                        <StarIcon />
                        <span>Star</span>
                        <span className="navbar-next__star-divider" />
                        <span className="navbar-next__star-count">{STAR_DISPLAY}</span>
                        <span className="navbar-next__star-divider" />
                        <GitHubIcon />
                    </a>
                    <Link to="/download" className="navbar-next__cta">
                        DOWNLOAD
                    </Link>
                </div>

                <button
                    type="button"
                    className="navbar-next__menu-button"
                    aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={mobileOpen}
                    aria-controls="navbar-next-mobile-panel"
                    onClick={() => setMobileOpen(open => !open)}
                >
                    <MenuIcon open={mobileOpen} />
                </button>
            </div>

            <div id="navbar-next-mobile-panel" className="navbar-next__mobile-panel" hidden={!mobileOpen}>
                <div className="navbar-next__mobile-sections">
                    {navItems.map(item => {
                        const expanded = expandedMobileItem === item.label;
                        const sectionId = `navbar-next-mobile-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

                        return (
                            <div className="navbar-next__mobile-section" key={item.label}>
                                <button
                                    type="button"
                                    className="navbar-next__mobile-trigger"
                                    aria-expanded={expanded}
                                    aria-controls={sectionId}
                                    onClick={() => setExpandedMobileItem(current => (current === item.label ? '' : item.label))}
                                >
                                    {item.label}
                                    <ChevronDown />
                                </button>
                                <div id={sectionId} className="navbar-next__mobile-links" hidden={!expanded}>
                                    {item.items.map(sub => (
                                        <Link
                                            key={sub.label}
                                            to={sub.href}
                                            className="navbar-next__mobile-link"
                                            onClick={() => setMobileOpen(false)}
                                            {...(sub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="navbar-next__mobile-actions">
                    <a
                        href={`https://github.com/${GITHUB_REPO}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="navbar-next__star-link"
                        aria-label={`Star Apache Doris on GitHub (${STAR_DISPLAY} stars)`}
                    >
                        <StarIcon />
                        <span>Star</span>
                        <span className="navbar-next__star-divider" />
                        <span className="navbar-next__star-count">{STAR_DISPLAY}</span>
                        <span className="navbar-next__star-divider" />
                        <GitHubIcon />
                    </a>
                    <Link to="/download" className="navbar-next__cta" onClick={() => setMobileOpen(false)}>
                        DOWNLOAD
                    </Link>
                </div>
            </div>
        </nav>
    );
}
