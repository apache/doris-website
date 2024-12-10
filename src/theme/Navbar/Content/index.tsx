import React, { useState, useEffect, type ReactNode } from 'react';
import { useThemeConfig, ErrorCauseBoundary } from '@docusaurus/theme-common';
import { splitNavbarItems, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarItem, { type Props as NavbarItemConfig } from '@theme/NavbarItem';
import DocsLogoNew from '@site/static/images/doc-logo-new.svg';
import DocsLogoZH from '@site/static/images/doc-logo-zh.svg';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import LocaleDropdownNavbarItem from '../../NavbarItem/LocaleDropdownNavbarItem';
import DocsVersionDropdownNavbarItem from '../../NavbarItem/DocsVersionDropdownNavbarItem';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';

import styles from './styles.module.css';

function useNavbarItems() {
    // TODO temporary casting until ThemeConfig type is improved
    return useThemeConfig().navbar.items as NavbarItemConfig[];
}

function NavbarItems({ items, isDocsPage }: { items: NavbarItemConfig[]; isDocsPage?: boolean }): JSX.Element {
    return (
        <>
            {items.map((item, i) => (
                <ErrorCauseBoundary
                    key={i}
                    onError={error =>
                        new Error(
                            `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
                            { cause: error },
                        )
                    }
                >
                    <NavbarItem {...item} />
                </ErrorCauseBoundary>
            ))}
        </>
    );
}

function NavbarContentLayout({
    left,
    right,
    bottom,
    isDocsPage = false,
}: {
    left: ReactNode;
    right: ReactNode;
    bottom: ReactNode;
    isDocsPage: boolean;
}) {
    const [isEN, setIsEN] = useState(true);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            location.pathname.includes('zh-CN') ? setIsEN(false) : setIsEN(true);
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <>
            <div className="navbar__inner">
                <div className="navbar__items">{left}</div>
                <div className="navbar__items navbar__items--right">{right}</div>
            </div>
            {/* <div className="navbar__bottom">
                <div className="docs-nav-mobile">
                    <NavbarItems
                        items={isEN ? useThemeConfig().docNavbarEN.items : useThemeConfig().docNavbarZH.items}
                        isDocsPage={isDocsPage}
                    />
                </div>
            </div> */}
            <div className="navbar__bottom">{bottom}</div>
        </>
    );
}

export default function NavbarContent(): JSX.Element {
    const mobileSidebar = useNavbarMobileSidebar();
    const [star, setStar] = useState<any>();
    const items = useNavbarItems();
    const [isEN, setIsEN] = useState(true);
    const docItems = isEN ? useThemeConfig().docNavbarEN.items : useThemeConfig().docNavbarZH.items;
    const [leftItems, rightItems] = splitNavbarItems(items);
    const [leftDocItems, rightDocItems] = splitNavbarItems(docItems);
    const [isDocsPage, setIsDocsPage] = useState(
        typeof window !== 'undefined' ? location.pathname.includes('docs') : false,
    );
    const [isCommunity, setIsCommunity] = useState(false);
    const searchBarItem = items.find(item => item.type === 'search');

    const [currentVersion, setCurrentVersion] = useState('');
    useEffect(() => {
        getGithubStar();
        if (typeof window !== 'undefined') {
            const tempPath = ['gettingStarted', 'benchmark', 'ecosystems', 'faq', 'docs', 'releasenotes'];

            const secPath = location.pathname.includes('zh-CN/docs')
                ? location.pathname.split('/')[3]
                : location.pathname.split('/')[2];
            if (location.pathname.includes('docs') && ['dev', '2.1', '2.0', '1.2'].includes(secPath)) {
                setCurrentVersion(secPath);
            } else {
                setCurrentVersion('');
            }

            const pathname = location.pathname.split('/')[1];
            location.pathname.includes('zh-CN') ? setIsEN(false) : setIsEN(true);
            const docsPage = location.pathname.includes('docs');
            const communityPage = pathname === 'community' || location.pathname.includes('zh-CN/community');
            setIsCommunity(communityPage);
            setIsDocsPage(docsPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    async function getGithubStar() {
        try {
            const res = await fetch('https://api.github.com/repos/apache/doris');
            const data = await res.json();
            if (data && data.stargazers_count) {
                const starStr = (+parseFloat(formatStar(data.stargazers_count)).toFixed(1)).toString();
                setStar(starStr);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function formatStar(star) {
        return String(star)
            .split('')
            .reverse()
            .reduce((prev, next, index) => {
                return (index % 3 ? next : next + '.') + prev;
            });
    }
    function getNavItem(type: string) {
        return items.find(item => item.type === type);
    }

    return (
        <NavbarContentLayout
            left={
                // TODO stop hardcoding items?
                <div className={`navbar-left `}>
                    <div className="navbar-logo-wrapper flex items-center">
                        {isDocsPage ? (
                            <div
                                className="cursor-pointer docs"
                                onClick={() => {
                                    window.location.href = `${isEN ? '' : '/zh-CN'}/docs${
                                        currentVersion === '' ? '' : `/${currentVersion}`
                                    }/gettingStarted/what-is-new`;
                                }}
                            >
                                {isEN ? <DocsLogoNew /> : <DocsLogoZH />}
                            </div>
                        ) : (
                            <NavbarLogo />
                        )}
                    </div>
                    <div className={`${styles.navbarLeftToc}`}>
                        {!isDocsPage ? (
                            <NavbarItems items={leftItems} />
                        ) : (
                            <NavbarItems items={leftDocItems} isDocsPage={isDocsPage} />
                        )}
                    </div>
                    {/*  */}
                </div>
            }
            isDocsPage={isDocsPage}
            right={
                // TODO stop hardcoding items?
                // Ask the user to add the respective navbar items => more flexible
                <>
                    {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
                    <NavbarItems items={isDocsPage ? rightDocItems : rightItems} />
                    <NavbarColorModeToggle className={styles.colorModeToggle} />
                    {/* {!searchBarItem && (
                        <NavbarSearch>
                            <SearchBar />
                        </NavbarSearch>
                    )} */}
                    <Link
                        className="github-btn desktop header-right-button-github"
                        href="https://github.com/apache/doris"
                        target="_blank"
                    >
                        {star && <div className="gh-count">{star}k</div>}
                    </Link>
                    <Link
                        className="slack-btn desktop header-right-button-slack"
                        href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw"
                        target="_blank"
                    ></Link>
                    <Link className="header-right-button-primary navbar-download-desktop" to="/download">
                        <Translate id="navbar.download">
                            {typeof window !== 'undefined' && location.pathname.includes('zh-CN/docs')
                                ? '下载'
                                : 'Download'}
                        </Translate>
                    </Link>
                </>
            }
            bottom={
                isDocsPage || isCommunity ? (
                    <div className="docs-nav-version-locale">
                        <LocaleDropdownNavbarItem mobile={false} {...(getNavItem('localeDropdown') as any)} />
                        {isDocsPage && ( //startWithDoc
                            <DocsVersionDropdownNavbarItem
                                mobile={false}
                                docsPluginId="default"
                                {...(getNavItem('docsVersionDropdown') as any)}
                            />
                        )}
                    </div>
                ) : (
                    <></>
                )
            }
        />
    );
}
