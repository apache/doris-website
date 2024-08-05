import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { splitNavbarItems, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import DocsLogoNew from '@site/static/images/doc-logo-new.svg';
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
function NavbarItems({ items, isDocsPage }) {
    return (
        <>
            {items.map((item, i) => (
                <NavbarItem {...item} key={i} isDocsPage={isDocsPage} />
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
    const docItems = useThemeConfig().docNavbarEN.items;
    const [leftItems, rightItems] = splitNavbarItems(items);
    const searchBarItem = items.find(item => item.type === 'search');
    const [star, setStar] = useState<any>();
    const [isDocsPage, setIsDocsPage] = useState(false);
    const [startWithDoc, setStartWithDoc] = useState(true);
    const [isCommunity, setIsCommunity] = useState(false);
    const [isEN, setIsEN] = useState(true);
    useEffect(() => {
        getGithubStar();
        if (typeof window !== 'undefined') {
            const tempPath = ['get-starting', 'benchmark', 'ecosystems', 'faq', 'docs', 'releasenotes'];
            const pathname = location.pathname.split('/')[1];
            location.pathname.includes('zh-CN') ? setIsEN(false) : setIsEN(true);
            const docsStart = pathname === 'docs' || location.pathname.includes('zh-CN/docs');
            const docsPage =
                tempPath.includes(pathname) || tempPath.some(path => location.pathname.includes(`zh-CN/${path}`));
            const communityPage = pathname === 'community' || location.pathname.includes('zh-CN/community');
            setIsCommunity(communityPage);
            setIsDocsPage(docsPage);
            setStartWithDoc(docsStart);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    async function getGithubStar() {
        const res = await fetch('https://api.github.com/repos/apache/doris');
        const data = await res.json();
        if (data && data.stargazers_count) {
            const starStr = (+parseFloat(formatStar(data.stargazers_count)).toFixed(1)).toString();
            setStar(starStr);
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
                                    window.location.href = '/docs/get-starting/what-is-apache-doris';
                                }}
                            >
                                {/* {isEN ? <DocsLogoEN /> :<DocsLogoZH />} */}
                                <DocsLogoNew />
                            </div>
                        ) : (
                            <NavbarLogo />
                        )}
                    </div>
                    <div className={`${styles.navbarLeftToc}`}>
                        {!isDocsPage ? (
                            <NavbarItems items={leftItems} />
                        ) : (
                            <NavbarItems
                                items={isEN ? docItems : useThemeConfig().docNavbarZH.items}
                                isDocsPage={isDocsPage}
                            />
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
                        href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2kl08hzc0-SPJe4VWmL_qzrFd2u2XYQA"
                        target="_blank"
                    ></Link>
                    <Link className="header-right-button-primary navbar-download-desktop" to="/download">
                        <Translate id="navbar.download">
                            {location.pathname.includes('zh-CN') ? '下载' : 'Download'}
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
