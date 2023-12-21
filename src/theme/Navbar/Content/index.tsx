import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { splitNavbarItems, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import DocsLogo from '@site/static/images/docs-logo.svg';
import NavbarSearch from '@theme/Navbar/Search';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import DocsVersionDropdownNavbarItem from '../../NavbarItem/DocsVersionDropdownNavbarItem';
import LocaleDropdownNavbarItem from '../../NavbarItem/LocaleDropdownNavbarItem';
function useNavbarItems() {
    // TODO temporary casting until ThemeConfig type is improved
    return useThemeConfig().navbar.items;
}
function NavbarItems({ items }) {
    return (
        <>
            {items.map((item, i) => (
                <NavbarItem {...item} key={i} />
            ))}
        </>
    );
}
function NavbarContentLayout({ left, right, bottom, isDocsPage = false }) {
    return (
        <>
            <div
                className="navbar__inner"
                style={{
                    padding: isDocsPage && '0 1.6rem',
                }}
            >
                <div className="navbar__items">{left}</div>
                <div className="navbar__items navbar__items--right">{right}</div>
            </div>
            <div className="navbar__bottom">{bottom}</div>
        </>
    );
}
export default function NavbarContent({ mobile }) {
    const mobileSidebar = useNavbarMobileSidebar();
    const items = useNavbarItems();
    const [leftItems, rightItems] = splitNavbarItems(items);
    const searchBarItem = items.find(item => item.type === 'search');
    const [star, setStar] = useState<any>();
    const [isDocsPage, setIsDocsPage] = useState(false);
    useEffect(() => {
        getGithubStar();
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const docsPage = pathname === 'docs' || location.pathname.includes('zh-CN/docs');
            setIsDocsPage(docsPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    async function getGithubStar() {
        const res = await fetch('https://api.github.com/repos/apache/doris');
        const data = await res.json();
        const starStr = (+parseFloat(formatStar(data.stargazers_count)).toFixed(1)).toString();
        setStar(starStr);
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
                <div className="navbar-left">
                    <div className="navbar-logo-wrapper flex items-center">
                        {isDocsPage ? (
                            <div
                                className="cursor-pointer docs"
                                onClick={() => {
                                    window.location.href = '/';
                                }}
                            >
                                <DocsLogo />
                            </div>
                        ) : (
                            <NavbarLogo />
                        )}
                    </div>

                    {!isDocsPage && <NavbarItems items={leftItems} />}
                    {/*  */}
                </div>
            }
            isDocsPage={isDocsPage}
            right={
                // TODO stop hardcoding items?
                // Ask the user to add the respective navbar items => more flexible
                <>
                    {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
                    <NavbarItems items={rightItems} />
                    <NavbarColorModeToggle className={styles.colorModeToggle} />
                    {!searchBarItem && (
                        <NavbarSearch className="navbar-search">
                            <SearchBar />
                        </NavbarSearch>
                    )}
                    <Link
                        className="github-btn desktop header-right-button-github"
                        href="https://github.com/apache/doris"
                        target="_blank"
                    >
                        {star && <div className="gh-count">{star}k</div>}
                    </Link>
                    <Link
                        className="slack-btn desktop header-right-button-slack"
                        href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-28il1o2wk-DD6LsLOz3v4aD92Mu0S0aQ"
                        target="_blank"
                    ></Link>
                    <Link className="header-right-button-primary navbar-download-desktop" to="/download">
                        <Translate id="navbar.download">Download</Translate>
                    </Link>
                </>
            }
            bottom={
                isDocsPage ? (
                    <div className="docs-nav-version-locale">
                        <LocaleDropdownNavbarItem mobile={false} {...(getNavItem('localeDropdown') as any)} />
                        <DocsVersionDropdownNavbarItem
                            mobile={false}
                            docsPluginId="default"
                            collapsed={false}
                            {...(getNavItem('docsVersionDropdown') as any)}
                        />
                    </div>
                ) : (
                    <></>
                )
            }
        />
    );
}
