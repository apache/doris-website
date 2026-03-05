import React, { useState, useEffect, useContext, type ReactNode } from 'react';
import { ErrorCauseBoundary } from '@docusaurus/theme-common';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarItem, { type Props as NavbarItemConfig } from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { NavbarDocsLeft, NavbarDocsRight, NavbarDocsBottom } from './components/NavbarDocs';
import { NavbarCommunityLeft, NavbarCommunityBottom, NavbarCommunityRight } from './components/NavbarCommunity';
import { NavbarCommonLeft, NavbarCommonRight } from './components/NavbarCommon';
import { DataContext } from '../../Layout';
import { ARCHIVE_PATH } from '@site/src/constant/common';
import { STAR_COUNT } from '../../../constant/github.data';
import { StarGreenIcon } from '@site/src/components/Icons/star-green-icon';
import { isCommunityPath, normalizePathname } from '@site/src/utils/locale';

import styles from './styles.module.css';

enum NavBar {
    DOCS = 'docs',
    COMMUNITY = 'community',
    COMMON = 'common',
}

export function getNavItem(items: NavbarItemConfig[], type: string) {
    return items.find(item => item.type === type);
}

export function NavbarItems({ items, isDocsPage }: { items: NavbarItemConfig[]; isDocsPage?: boolean }): JSX.Element {
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

function NavbarContentLayout({ left, right, bottom }: { left: ReactNode; right: ReactNode; bottom: ReactNode }) {
    return (
        <>
            <div className="navbar__inner">
                <div className="navbar__items">{left}</div>
                <div className="navbar__items navbar__items--right">{right}</div>
            </div>
            {bottom && <div className="navbar__bottom">{bottom}</div>}
        </>
    );
}

const getCurrentNavBar = (pathname: string, locales: string[]) => {
    const normalizedPathname = normalizePathname(pathname, locales);
    if (normalizedPathname.includes(`/${NavBar.DOCS}`) || normalizedPathname.includes(ARCHIVE_PATH)) {
        return NavBar.DOCS;
    }
    if (isCommunityPath(normalizedPathname, locales)) {
        return NavBar.COMMUNITY;
    }
    return NavBar.COMMON;
};

export default function NavbarContent(): ReactNode {
    const location = useLocation();
    const {
        i18n: { currentLocale, locales },
    } = useDocusaurusContext();
    const [currentNavbar, setCurrentNavbar] = useState(getCurrentNavBar(location.pathname, locales));
    const isZH = currentLocale === 'zh-CN';

    const mobileSidebar = useNavbarMobileSidebar();
    const { showSearchPageMobile } = useContext(DataContext);

    const NavbarTypes = {
        [NavBar.DOCS]: {
            left: <NavbarDocsLeft isEN={!isZH} />,
            right: <NavbarDocsRight isEN={!isZH} />,
            bottom: <NavbarDocsBottom isEN={!isZH} />,
        },
        [NavBar.COMMUNITY]: {
            left: <NavbarCommunityLeft />,
            right: <NavbarCommunityRight />,
            bottom: <NavbarCommunityBottom />,
        },
        [NavBar.COMMON]: {
            left: <NavbarCommonLeft />,
            right: <NavbarCommonRight star={STAR_COUNT} />,
            bottom: null,
        },
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentNavbar(getCurrentNavBar(location.pathname, locales));
        }
    }, [locales, typeof window !== 'undefined' && location.pathname]);

    return (
        <NavbarContentLayout
            left={NavbarTypes[currentNavbar].left}
            right={
                <>
                    <button
                        className="rounded-full flex items-center gap-x-2 px-4 py-[5px] border border-primary bg-[#F0FFF7] text-[1rem]/[1.625rem] font-medium text-[#1D1D1D]"
                        id="navbar-ask-ai-btn"
                    >
                        <StarGreenIcon />
                        Ask AI
                    </button>
                    {NavbarTypes[currentNavbar].right}
                    {!mobileSidebar.disabled && !showSearchPageMobile && <NavbarMobileSidebarToggle />}
                    <NavbarColorModeToggle className={styles.colorModeToggle} />
                    <Link className="header-right-button-primary navbar-download-desktop font-medium" to="/download">
                        <Translate id="navbar.download">
                            {isZH ? '下载' : 'Download'}
                        </Translate>
                    </Link>
                </>
            }
            bottom={!showSearchPageMobile ? NavbarTypes[currentNavbar].bottom : null}
        />
    );
}
