import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { splitNavbarItems } from '@docusaurus/theme-common/internal';
import NavbarLogo from '@theme/Navbar/Logo';
import { type Props as NavbarItemConfig } from '@theme/NavbarItem';

import { getNavItem } from '..';
import { NavbarItems } from '..';
import LocaleDropdownNavbarItem from '../../../NavbarItem/LocaleDropdownNavbarItem';
import styles from '../styles.module.css';

function useNavbarItems() {
    return useThemeConfig().communityNavbar.items as NavbarItemConfig[];
}

export const NavbarCommunityLeft = () => {
    const items = useNavbarItems();
    const [leftItems] = splitNavbarItems(items);
    return (
        <div className={`navbar-left `}>
            <div className="navbar-logo-wrapper flex items-center">
                <NavbarLogo />
            </div>
            <div className={`${styles.navbarLeftToc}`}>
                <NavbarItems items={leftItems} />
            </div>
        </div>
    );
};

export const NavbarCommunityRight = () => {
    const items = useNavbarItems();
    const [, rightItems] = splitNavbarItems(items);
    return <NavbarItems items={rightItems} />;
};

export const NavbarCommunityBottom = () => {
    const items = useNavbarItems();
    return (
        <div className="docs-nav-version-locale">
            <LocaleDropdownNavbarItem mobile={false} {...getNavItem(items, 'localeDropdown')} />
        </div>
    );
};
