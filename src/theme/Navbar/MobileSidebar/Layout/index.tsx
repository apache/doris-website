import React from 'react';
import clsx from 'clsx';
import { useNavbarSecondaryMenu } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/Navbar/MobileSidebar/Layout';
import './style.scss';

export default function NavbarMobileSidebarLayout({ header, primaryMenu, secondaryMenu }: Props): JSX.Element {
    const { shown: secondaryMenuShown } = useNavbarSecondaryMenu();
    return (
        <div className="navbar-sidebar navbar-sidebar-container">
            {header}
            <div
                className={clsx('navbar-sidebar__items', {
                    'navbar-sidebar__items--show-secondary': secondaryMenuShown,
                })}
            >
                <div className={clsx('navbar-sidebar__item', 'menu','primary-menu')}>{primaryMenu}</div>
                <div className={clsx('navbar-sidebar__item', 'menu', 'secondary-menu')}>
                    {secondaryMenu}
                </div>
            </div>
        </div>
    );
}
