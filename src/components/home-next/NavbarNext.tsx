import { translate } from '@docusaurus/Translate';
import React, { JSX, useState, useEffect, useRef } from 'react';
import Link from '@site/src/components/home-next/LocalizedLink';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { STAR_COUNT } from '@site/src/constant/github.data';
import { StarGreenIcon } from '@site/src/components/Icons/star-green-icon';
import { DorisLogoHorizontal } from '@site/src/components/Icons/doris-logo-horizontal';
import { localizedAiLabels } from '@site/src/utils/localization';
import './NavbarNext.scss';
import {LanguageMenu} from './LanguageMenu';

const GITHUB_REPO = 'apache/doris';
const DORIS_SUMMIT_URL = 'https://apache-doris-summit.org/';

interface DropdownItem {
    label: string;
    href: string;
    external?: boolean;
    detail?: string;
    ariaLabel?: string;
}

interface NavItem {
    id: string;
    label: string;
    items: DropdownItem[];
}

function buildNavItems(
    devDocsHref: string,
    stableDocsHref: string,
    v3xDocsHref: string,
    v21DocsHref: string,
    releasesHref: string,
    roadmapHref: string,
    joinCommunityHref: string,
    communityReportHref: string,
    starDisplay: string,
): NavItem[] {
    return [
        {
            id: 'why-doris',
            label: translate({ id: "homepage.navbar.001", message: "Why Doris" }),
            items: [
                { label: translate({ id: "homepage.navbar.002", message: "Doris vs. Others" }), href: '/why-doris/compare' },
                { label: translate({ id: "homepage.navbar.003", message: "Benchmarks" }), href: '/why-doris/benchmarks' },
                { label: translate({ id: "homepage.navbar.004", message: "Key Features" }), href: '/why-doris/key-features' },
                { label: translate({ id: "homepage.navbar.005", message: "User Stories" }), href: '/why-doris/users' },
            ],
        },
        {
            id: 'use-cases',
            label: translate({ id: "homepage.navbar.006", message: "Use Cases" }),
            items: [
                { label: translate({ id: "homepage.navbar.007", message: "Customer-Facing Analytics" }), href: '/use-cases/customer-facing-analytics' },
                { label: translate({ id: "homepage.navbar.008", message: "Data Warehousing" }), href: '/use-cases/data-warehousing' },
                { label: translate({ id: "homepage.navbar.009", message: "Observability" }), href: '/use-cases/observability' },
                { label: translate({ id: "homepage.navbar.010", message: "Doris for AI" }), href: '/use-cases/ai' },
            ],
        },
        {
            id: 'docs',
            label: translate({ id: "homepage.navbar.011", message: "Docs" }),
            items: [
                { label: 'Dev', href: devDocsHref },
                { label: '4.x', href: stableDocsHref },
                { label: '3.x', href: v3xDocsHref },
                { label: '2.1', href: v21DocsHref },
            ],
        },
        {
            id: 'resources',
            label: translate({ id: "homepage.navbar.015", message: "Resources" }),
            items: [
                { label: translate({ id: "homepage.navbar.016", message: "Release Notes" }), href: releasesHref },
                { label: translate({ id: "homepage.navbar.017", message: "Blogs" }), href: '/blog' },
                { label: translate({ id: "homepage.navbar.018", message: "Course" }), href: '/course' },
                { label: translate({ id: "homepage.navbar.019", message: "Profile Analysis" }), href: '/profile-analysis' },
            ],
        },
        {
            id: 'community',
            label: translate({ id: "homepage.navbar.020", message: "Community" }),
            items: [
                { label: translate({ id: "homepage.navbar.021", message: "Community Report" }), href: communityReportHref },
                { label: translate({ id: "homepage.navbar.022", message: "Roadmap" }), href: roadmapHref },
                { label: translate({ id: "homepage.navbar.023", message: "Build with Us" }), href: joinCommunityHref },
                { label: translate({ id: "homepage.navbar.024", message: "Join GitHub Discussions" }), href: 'https://github.com/apache/doris/discussions', external: true },
                { label: 'Doris Summit 26', href: DORIS_SUMMIT_URL, external: true, ariaLabel: translate({ id: 'homepage.navbar.027', message: 'Visit Doris Summit 2026 (opens in a new tab)' }) },
                { label: 'GitHub', href: `https://github.com/${GITHUB_REPO}`, external: true, detail: starDisplay, ariaLabel: translate({ id: 'homepage.navbar.starLabel', message: 'Star Apache Doris on GitHub ({stars} stars)' }, {stars: starDisplay}) },
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

// Robot-head glyph shown instead of the sparkle on phones, where the label
// shrinks to "Ask" and the icon has to carry the "AI" meaning on its own.
function AiIcon(): JSX.Element {
    return (
        <svg
            className="navbar-next__ask-ai-icon navbar-next__ask-ai-icon--compact"
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path d="M8 2v2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="1.5" r="1.1" fill="currentColor" />
            <rect x="2.75" y="4.5" width="10.5" height="8.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="6" cy="8.75" r="1.15" fill="currentColor" />
            <circle cx="10" cy="8.75" r="1.15" fill="currentColor" />
            <path d="M.75 7.75v2.5M15.25 7.75v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    const starDisplay = new Intl.NumberFormat(currentLocale, {notation: 'compact', maximumFractionDigits: 1}).format(Number(STAR_COUNT) * 1000);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navbarRef = useRef<HTMLElement>(null);
    const devDocsHref = `/docs/dev/getting-started/what-is-apache-doris`;
    const stableDocsHref = `/docs/4.x/getting-started/what-is-apache-doris`;
    // 3.x and 2.1 use the legacy slug structure (gettingStarted/ with camelCase).
    const v3xDocsHref = `/docs/3.x/gettingStarted/what-is-apache-doris`;
    const v21DocsHref = `/docs/2.1/gettingStarted/what-is-apache-doris`;
    const releasesHref = `/releases/all-release`;
    const roadmapHref = `/community/roadmap`;
    const joinCommunityHref = `/community/join-community`;
    // The community report is an ordinary page, so a locale that renders the
    // default locale's ordinary pages links to it without a prefix.
    const communityReportHref = `/community-report`;
    const navItems = buildNavItems(
        devDocsHref,
        stableDocsHref,
        v3xDocsHref,
        v21DocsHref,
        releasesHref,
        roadmapHref,
        joinCommunityHref,
        communityReportHref,
        starDisplay,
    );
    const [expandedMobileItem, setExpandedMobileItem] = useState(navItems[0]?.label ?? '');
    const homeHref = '/';
    const closePreferences = () => {
        const details = navbarRef.current?.querySelector<HTMLDetailsElement>('.language-menu');
        if (details) details.open = false;
    };

    useEffect(() => {
        if (!mobileOpen) return undefined;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !(event.target instanceof Element && event.target.closest('details'))) {
                setMobileOpen(false);
                navbarRef.current?.querySelector<HTMLButtonElement>('.navbar-next__menu-button')?.focus();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [mobileOpen]);

    useEffect(() => {
        const navbar = navbarRef.current;
        if (!navbar) return undefined;

        const root = document.documentElement;
        const updateNavbarHeight = () => {
            root.style.setProperty('--navbar-next-height', `${navbar.getBoundingClientRect().height}px`);
        };
        updateNavbarHeight();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateNavbarHeight)
            : undefined;
        resizeObserver?.observe(navbar);
        window.addEventListener('resize', updateNavbarHeight);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateNavbarHeight);
            root.style.removeProperty('--navbar-next-height');
        };
    }, []);

    return (
        <nav
            ref={navbarRef}
            lang={currentLocale}
            className={`navbar navbar--fixed-top navbar-next${mobileOpen ? ' navbar-next--mobile-open' : ''}`}
        >
            <div className="navbar-next__inner">
                <Link to={homeHref} className="navbar-next__logo" aria-label="Apache Doris">
                    <DorisLogoHorizontal className="navbar-next__logo-mark" />
                </Link>

                <div className="navbar-next__nav">
                    {navItems.map(item => (
                        <div key={item.id} className="navbar-next__item"
                            onMouseEnter={() => {closePreferences(); setActiveDropdown(item.id);}} onMouseLeave={() => setActiveDropdown(null)}
                            onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget as Node)) setActiveDropdown(null);}}
                            onKeyDown={event => {if (event.key === 'Escape') {setActiveDropdown(null); event.currentTarget.querySelector('button')?.focus();}}}>
                            <button className="navbar-next__trigger" type="button" aria-expanded={activeDropdown === item.id}
                                aria-controls={`navbar-dropdown-${item.id}`} onClick={event => {closePreferences(); setActiveDropdown(current => event.detail === 0 && current === item.id ? null : item.id);}}>
                                {item.label}
                                <ChevronDown />
                            </button>
                            <div id={`navbar-dropdown-${item.id}`} className={`navbar-next__dropdown${activeDropdown === item.id ? ' navbar-next__dropdown--open' : ''}`}>
                                {item.items.map(sub => (
                                    <Link
                                        key={sub.label}
                                        to={sub.href}
                                        className="navbar-next__dropdown-link"
                                        aria-label={sub.ariaLabel}
                                        {...(sub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    >
                                        <span>{sub.label}</span>{sub.detail && <span className="navbar-next__link-detail"><StarIcon />{sub.detail}</span>}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="navbar-next__actions">
                    <button
                        type="button"
                        id="navbar-ask-ai-btn"
                        className="navbar-next__ask-ai"
                        aria-label={translate({ id: "homepage.navbar.029", message: "Ask Me" })}
                        aria-busy="false"
                        aria-disabled="false"
                        data-kapa-trigger
                        suppressHydrationWarning
                    >
                        <span className="navbar-next__ask-ai-icon navbar-next__ask-ai-icon--full">
                            <StarGreenIcon />
                        </span>
                        <AiIcon />
                        {/* static/js/custom-script.js swaps every [data-kapa-label] to a
                            loading/error text; the compact copy declares short variants so
                            the one-row phone navbar never has to fit "Loading AI…". */}
                        <span
                            data-kapa-label
                            {...localizedAiLabels()}
                            className="navbar-next__ask-ai-label navbar-next__ask-ai-label--full"
                            aria-live="polite"
                            suppressHydrationWarning
                        >
                            {translate({ id: "homepage.navbar.029", message: "Ask Me" })}</span>
                        <span
                            data-kapa-label
                            data-kapa-loading-label="…"
                            data-kapa-error-label={translate({ id: "homepage.navbar.030", message: "N/A" })}
                            className="navbar-next__ask-ai-label navbar-next__ask-ai-label--compact"
                            aria-live="polite"
                            suppressHydrationWarning
                        >
                            {translate({ id: "homepage.navbar.031", message: "Ask" })}</span>
                    </button>
                    <LanguageMenu appearance onOpen={() => {setMobileOpen(false); setActiveDropdown(null);}} />
                    <Link to="/download" className="navbar-next__cta">
                        {translate({ id: "homepage.navbar.033", message: "DOWNLOAD" })}</Link>
                </div>

                <button
                    type="button"
                    className="navbar-next__menu-button"
                    aria-label={mobileOpen ? translate({ id: "homepage.navbar.034", message: "Close navigation menu" }) : translate({ id: "homepage.navbar.035", message: "Open navigation menu" })}
                    aria-expanded={mobileOpen}
                    aria-controls="navbar-next-mobile-panel"
                    onClick={() => {closePreferences(); setMobileOpen(open => !open);}}
                >
                    <MenuIcon open={mobileOpen} />
                </button>
            </div>

            <div id="navbar-next-mobile-panel" className="navbar-next__mobile-panel" hidden={!mobileOpen}>
                <div className="navbar-next__mobile-sections">
                    {navItems.map(item => {
                        const expanded = expandedMobileItem === item.label;
                        const sectionId = `navbar-next-mobile-${item.id}`;

                        return (
                            <div className="navbar-next__mobile-section" key={item.id}>
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
                                            aria-label={sub.ariaLabel}
                                            onClick={() => setMobileOpen(false)}
                                            {...(sub.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            <span>{sub.label}</span>{sub.detail && <span className="navbar-next__link-detail"><StarIcon />{sub.detail}</span>}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>


            </div>
        </nav>
    );
}
