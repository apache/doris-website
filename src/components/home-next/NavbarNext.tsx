import React, { JSX, useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import { getLocalePrefix, isDocsNextPath, normalizePathname } from '@site/src/utils/locale';
import './NavbarNext.scss';

const GITHUB_REPO = 'apache/doris';
const FALLBACK_STARS = '-';
const HOME_VERSION_KEY = 'doris-home-version';

function formatStars(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function useGitHubStars(repo: string, fallback: string): string {
    const [stars, setStars] = useState(fallback);
    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            fetch(`https://api.github.com/repos/${repo}`)
                .then(r => (r.ok ? r.json() : null))
                .then(data => {
                    if (!cancelled && data && typeof data.stargazers_count === 'number') {
                        setStars(formatStars(data.stargazers_count));
                    }
                })
                .catch(() => { /* keep fallback on network/CORS/rate-limit errors */ });
        }, 1200);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
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

function buildNavItems(docsHref: string): NavItem[] {
    return [
        {
            label: 'Why Doris',
            items: [
                { label: 'Key Features (coming soon)', href: '#' },
                { label: 'Doris vs. Others', href: '/why-doris/compare' },
                { label: 'Benchmarks (coming soon)', href: '#' },
                { label: 'User Stories (coming soon)', href: '#' },
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
            items: [{ label: 'dev', href: docsHref }],
        },
        {
            label: 'Resouces',
            items: [
                { label: 'Release Notes', href: '/releases/all-release' },
                { label: 'Blogs', href: '/blogs-next' },
                { label: 'News and Events', href: '/events' },
            ],
        },
        {
            label: 'Community',
            items: [
                { label: 'Join GitHub Discussions', href: '#' },
                { label: 'Developer', href: '/community/join-community' },
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
        i18n: { currentLocale, defaultLocale, localeConfigs },
    } = useDocusaurusContext();
    const { pathname, search, hash } = useLocation();
    const stars = useGitHubStars(GITHUB_REPO, FALLBACK_STARS);
    const [mobileOpen, setMobileOpen] = useState(false);
    const docsHref = `${getLocalePrefix(currentLocale, defaultLocale)}/docs-next/dev/getting-started/what-is-apache-doris`;
    const navItems = buildNavItems(docsHref);
    const [expandedMobileItem, setExpandedMobileItem] = useState(navItems[0]?.label ?? '');
    const isDocsNextPage = isDocsNextPath(pathname, [defaultLocale, 'zh-CN']);
    const homeHref = `${getLocalePrefix(currentLocale, defaultLocale)}/`;
    const localeSwitchLabel = currentLocale === 'zh-CN' ? localeConfigs[defaultLocale]?.label ?? 'English' : '中文';
    const currentDocsNextPath = normalizePathname(pathname, [defaultLocale, 'zh-CN']);
    const buildLocaleHref = (locale: string) =>
        `${locale === defaultLocale ? '' : `/${locale}`}${currentDocsNextPath}${search}${hash}`;
    const localeItems = [defaultLocale, 'zh-CN']
        .filter((locale, index, arr) => arr.indexOf(locale) === index)
        .map(locale => ({
            label: localeConfigs[locale]?.label ?? locale,
            lang: localeConfigs[locale]?.htmlLang,
            to: buildLocaleHref(locale),
            target: '_self',
            autoAddBaseUrl: false,
            className: locale === currentLocale ? 'dropdown__link--active' : '',
        }));

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
                <Link
                    to={homeHref}
                    className="navbar-next__logo"
                    aria-label="Apache Doris"
                    onClick={() => {
                        window.localStorage.setItem(HOME_VERSION_KEY, 'next');
                    }}
                >
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
                                    <Link key={sub.label} to={sub.href} className="navbar-next__dropdown-link">
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="navbar-next__actions">
                    {isDocsNextPage && (
                        <DropdownNavbarItem
                            mobile={false}
                            label={
                                <>
                                    <svg
                                        className="icon-language navbar-next__locale-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M7.75756 14.3L10.5816 6.91667H11.8759L14.7 14.3H13.4057L12.7501 12.4167H9.74113L9.06873 14.3H7.75756ZM10.1109 11.35H12.3467L11.254 8.3H11.2036L10.1109 11.35ZM2.84908 12.45L1.97498 11.5833L5.11841 8.48333C4.72618 8.05 4.38439 7.60267 4.09302 7.14133C3.80165 6.68044 3.54389 6.19444 3.31976 5.68333H4.61412C4.80463 6.06111 5.00635 6.39711 5.21927 6.69133C5.43219 6.986 5.68434 7.29444 5.97571 7.61667C6.43519 7.12778 6.81621 6.62511 7.11879 6.10867C7.42137 5.59178 7.67352 5.03889 7.87523 4.45H1V3.23333H5.33694V2H6.58087V3.23333H10.9178V4.45H9.11916C8.89503 5.18333 8.59805 5.89155 8.22824 6.57467C7.85842 7.25822 7.39895 7.90555 6.84983 8.51667L8.3459 10.0167L7.87523 11.2833L5.95891 9.38333L2.84908 12.45Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </>
                            }
                            items={localeItems}
                            position="right"
                            className="navbar-next__locale-dropdown"
                            aria-label={localeSwitchLabel}
                        />
                    )}
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
                    <Link to="/download-next" className="navbar-next__cta">
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
                    {isDocsNextPage && (
                        <DropdownNavbarItem
                            mobile={false}
                            label={
                                <>
                                    <svg
                                        className="icon-language navbar-next__locale-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M7.75756 14.3L10.5816 6.91667H11.8759L14.7 14.3H13.4057L12.7501 12.4167H9.74113L9.06873 14.3H7.75756ZM10.1109 11.35H12.3467L11.254 8.3H11.2036L10.1109 11.35ZM2.84908 12.45L1.97498 11.5833L5.11841 8.48333C4.72618 8.05 4.38439 7.60267 4.09302 7.14133C3.80165 6.68044 3.54389 6.19444 3.31976 5.68333H4.61412C4.80463 6.06111 5.00635 6.39711 5.21927 6.69133C5.43219 6.986 5.68434 7.29444 5.97571 7.61667C6.43519 7.12778 6.81621 6.62511 7.11879 6.10867C7.42137 5.59178 7.67352 5.03889 7.87523 4.45H1V3.23333H5.33694V2H6.58087V3.23333H10.9178V4.45H9.11916C8.89503 5.18333 8.59805 5.89155 8.22824 6.57467C7.85842 7.25822 7.39895 7.90555 6.84983 8.51667L8.3459 10.0167L7.87523 11.2833L5.95891 9.38333L2.84908 12.45Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </>
                            }
                            items={localeItems}
                            position="right"
                            className="navbar-next__locale-dropdown"
                            aria-label={localeSwitchLabel}
                        />
                    )}
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
                    <Link to="/download-next" className="navbar-next__cta" onClick={() => setMobileOpen(false)}>
                        DOWNLOAD
                    </Link>
                </div>
            </div>
        </nav>
    );
}
