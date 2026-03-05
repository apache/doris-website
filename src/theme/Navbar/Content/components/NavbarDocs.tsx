import styles from '../styles.module.css';
import React, { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
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
import { ARCHIVE_PATH } from '../../../../constant/common' ;
import { DEFAULT_VERSION } from '../../../../constant/version' ;
import { getLocalePrefix, normalizePathname } from '@site/src/utils/locale';

interface NavbarDocsProps {
    isEN: boolean;
}

export const NavbarDocsLeft = ({ isEN }: NavbarDocsProps) => {
    const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION);
    const location = useLocation();
    const history = useHistory();
    const {
        i18n: { currentLocale, defaultLocale, locales },
    } = useDocusaurusContext();
    const themeConfig = useThemeConfig();
    const docItems =
        currentLocale === 'zh-CN'
            ? themeConfig.docNavbarZH.items
            : currentLocale === 'ja' && themeConfig.docNavbarJA
              ? themeConfig.docNavbarJA.items
              : themeConfig.docNavbarEN.items;
    let [leftDocItems] = splitNavbarItems(docItems);
    if(location.pathname.includes(ARCHIVE_PATH)){
        leftDocItems = leftDocItems.filter((item)=>item.type !== 'search')
    }
    useEffect(() => {
        const normalizedPathname = normalizePathname(location.pathname, locales);
        const pathSegments = normalizedPathname.split('/');
        const section = pathSegments[1];
        const secPath = pathSegments[2];
        if (section === 'docs' && ['dev', '2.1', '2.0', '1.2'].includes(secPath)) {
            setCurrentVersion(secPath);
        } else {
            setCurrentVersion(DEFAULT_VERSION);
        }
    }, [locales, typeof window !== 'undefined' && location.pathname]);
    return (
        <div className={`navbar-left `}>
            <div className="navbar-logo-wrapper flex items-center">
                <div
                    className="cursor-pointer docs"
                    onClick={() => {
                        const url = `${getLocalePrefix(currentLocale, defaultLocale)}/docs${
                            currentVersion === '' ? '' : `/${currentVersion}`
                        }/gettingStarted/what-is-apache-doris`;
                        history.push(url);
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
    const {
        i18n: { currentLocale },
    } = useDocusaurusContext();
    const themeConfig = useThemeConfig();
    const docItems =
        currentLocale === 'zh-CN'
            ? themeConfig.docNavbarZH.items
            : currentLocale === 'ja' && themeConfig.docNavbarJA
              ? themeConfig.docNavbarJA.items
              : themeConfig.docNavbarEN.items;
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
                        <span className="mr-2" onClick={() => setShowSearchPageMobile(true)}>
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
    const {
        i18n: { currentLocale },
    } = useDocusaurusContext();
    const themeConfig = useThemeConfig();
    const docItems =
        currentLocale === 'zh-CN'
            ? themeConfig.docNavbarZH.items
            : currentLocale === 'ja' && themeConfig.docNavbarJA
              ? themeConfig.docNavbarJA.items
              : themeConfig.docNavbarEN.items;
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
