import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { splitNavbarItems } from '@docusaurus/theme-common/internal';
import NavbarLogo from '@theme/Navbar/Logo';
import Link from '@docusaurus/Link';
import GithubIconNew from '@site/static/images/icon/github-new.svg';
import Translate from '@docusaurus/Translate';
import NavbarItem, { type Props as NavbarItemConfig } from '@theme/NavbarItem';

import { NavbarItems } from '..';
import styles from '../styles.module.css';

function useNavbarItems() {
    return useThemeConfig().navbar.items as NavbarItemConfig[];
}

export const NavbarCommonLeft = () => {
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

interface NavbarCommonRightProps {
    star: string;
}

export const NavbarCommonRight = ({ star }: NavbarCommonRightProps) => {
    const items = useNavbarItems();
    const [, rightItems] = splitNavbarItems(items);

    return (
        <>
            <NavbarItems items={rightItems} />
            <Link
                className="github-btn bg-[#F7F9FE] rounded-sm  desktop h-[2.25rem] w-[6.5rem] flex justify-center "
                href="https://github.com/apache/doris"
                target="_blank"
            >
                <GithubIconNew className='ml-[0.5rem]' />
                <span className='ml-2 text-[1rem]/[137.5%] text-[#252734] font-medium'>Star Me</span>
            </Link>
            {star && <div className="gh-count">{star}k</div>}
            <Link
                className="slack-btn desktop header-right-button-slack"
                href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw"
                target="_blank"
            ></Link>
        </>
    );
};
