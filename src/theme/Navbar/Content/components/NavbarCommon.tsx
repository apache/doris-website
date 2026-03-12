import React, { useEffect, useState } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { splitNavbarItems } from '@docusaurus/theme-common/internal';
import NavbarLogo from '@theme/Navbar/Logo';
import Link from '@docusaurus/Link';
import GithubIconNew from '@site/static/images/icon/github-new.svg';
import Translate from '@docusaurus/Translate';
import NavbarItem, { type Props as NavbarItemConfig } from '@theme/NavbarItem';
import { GithubIconNavbar } from '@site/src/components/Icons/github-icon-navbar';

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
                onMouseEnter={() => {
                    document.getElementById('github-icon-new').firstChild.style.fill = '#11A679';
                }}
                onMouseLeave={() => {
                    document.getElementById('github-icon-new').firstChild.style.fill = '#1D1D1D';
                }}
                className="github-btn bg-[#F7FAFC] mr-1 group !no-underline ml-4 rounded-sm items-center justify-start desktop h-[2.25rem] w-[6.5rem] "
                href="https://github.com/apache/doris"
                target="_blank"
            >
                <GithubIconNavbar id='github-icon-new' className='github-icon-new ml-[0.5rem]' />
                <span className='github-text ml-1 text-[1rem]/[137.5%] group-hover:text-primary text-[#252734] font-medium'>Star Me</span>
            </Link>
            {star && <div className="gh-count text-[1rem]/[1rem]">{star}k</div>}
            <Link
                className="slack-btn desktop header-right-button-slack"
                href="https://doris.apache.org/slack"
                target="_blank"
            ></Link>
        </>
    );
};
