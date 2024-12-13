import styles from '../styles.module.css';
import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from '@docusaurus/router';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import { splitNavbarItems } from '@docusaurus/theme-common/internal';
import DocsLogoNew from '@site/static/images/doc-logo-new.svg';
import DocsLogoZH from '@site/static/images/doc-logo-zh.svg';
import LocaleDropdownNavbarItem from '../../../NavbarItem/LocaleDropdownNavbarItem';
import DocsVersionDropdownNavbarItem from '../../../NavbarItem/DocsVersionDropdownNavbarItem';
import { NavbarItems, getNavItem } from '..';
import SearchIcon from '@site/static/images/search-icon.svg';
import CloseIcon from '@site/static/images/icon/close.svg';
import { DataContext } from '../../../Layout';

interface NavbarDocsProps {
    isEN: boolean;
}

export const NavbarDocsLeft = ({ isEN }: NavbarDocsProps) => {
    const [currentVersion, setCurrentVersion] = useState('');
    const location = useLocation();
    const docItems = isEN ? useThemeConfig().docNavbarEN.items : useThemeConfig().docNavbarZH.items;
    const [leftDocItems] = splitNavbarItems(docItems);
    useEffect(() => {
        const secPath = location.pathname.includes('zh-CN/docs')
            ? location.pathname.split('/')[3]
            : location.pathname.split('/')[2];
        if (location.pathname.includes('docs') && ['dev', '2.1', '2.0', '1.2'].includes(secPath)) {
            setCurrentVersion(secPath);
        } else {
            setCurrentVersion('');
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <div className={`navbar-left `}>
            <div className="navbar-logo-wrapper flex items-center">
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
            </div>
            <div className={`${styles.navbarLeftToc}`}>
                <NavbarItems items={leftDocItems} isDocsPage={true} />
            </div>
        </div>
    );
};

export const NavbarDocsRight = ({ isEN }: NavbarDocsProps) => {
    const docItems = isEN ? useThemeConfig().docNavbarEN.items : useThemeConfig().docNavbarZH.items;
    const [, rightDocItems] = splitNavbarItems(docItems);
    const { showSearchPageMobile, setShowSearchPageMobile } = useContext(DataContext);

    const mobileSidebar = useNavbarMobileSidebar();
    return (
        <>
            {showSearchPageMobile ? (
                <span onClick={() => setShowSearchPageMobile(false)}>
                    <CloseIcon />
                </span>
            ) : (
                <>
                    {mobileSidebar.shouldRender ? (
                        <span className='mr-2' onClick={() => setShowSearchPageMobile(true)}>
                            <SearchIcon />
                        </span>
                    ) : null}
                    <NavbarItems items={[...rightDocItems]} />
                </>
            )}
        </>
    );
};

export const NavbarDocsBottom = ({ isEN }: NavbarDocsProps) => {
    const docItems = isEN ? useThemeConfig().docNavbarEN.items : useThemeConfig().docNavbarZH.items;
    const [, rightDocItems] = splitNavbarItems(docItems);
    return (
        <div className="docs-nav-version-locale">
            {/* getNavItem? */}

            <LocaleDropdownNavbarItem mobile={false} {...(getNavItem(rightDocItems, 'localeDropdown') as any)} />
            <DocsVersionDropdownNavbarItem
                mobile={false}
                docsPluginId="default"
                {...(getNavItem(rightDocItems, 'docsVersionDropdown') as any)}
            />
        </div>
    );
};
