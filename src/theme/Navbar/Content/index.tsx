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
function NavbarContentLayout({ left, right, isDocsPage = false }) {
    return (
        <div
            className="navbar__inner"
            style={{
                padding: isDocsPage && '0 1.6rem',
            }}
        >
            <div className="navbar__items">{left}</div>
            <div className="navbar__items navbar__items--right">{right}</div>
        </div>
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
            const docsPage = pathname === 'docs';
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
    return (
        <NavbarContentLayout
            left={
                // TODO stop hardcoding items?
                <>
                    {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
                    {isDocsPage ? (
                        <div
                            className="cursor-pointer"
                            onClick={() => {
                                window.location.href = '/';
                            }}
                        >
                            <DocsLogo />
                        </div>
                    ) : (
                        <NavbarLogo />
                    )}

                    {!isDocsPage && <NavbarItems items={leftItems} />}
                    {/*  */}
                </>
            }
            isDocsPage={isDocsPage}
            right={
                // TODO stop hardcoding items?
                // Ask the user to add the respective navbar items => more flexible
                <>
                    <NavbarItems items={rightItems} />
                    <NavbarColorModeToggle className={styles.colorModeToggle} />
                    {!searchBarItem && (
                        <NavbarSearch className="navbar-search">
                            <SearchBar />
                        </NavbarSearch>
                    )}
                    {/* <Link
                        className="github-btn desktop header-right-button-github"
                        href="https://github.com/apache/doris"
                        target="_blank"
                    >
                        {star && <div className="gh-count">{star}k</div>}
                    </Link> */}

                    <Link className="header-right-button-primary navbar-download-desktop" to="/download">
                        <Translate id="navbar.download">Download</Translate>
                    </Link>
                </>
            }
        />
    );
}
