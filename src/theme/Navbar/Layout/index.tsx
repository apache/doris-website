import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useHideableNavbar, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import NavbarMobileSidebar from '@theme/Navbar/MobileSidebar';
import styles from './styles.module.css';
function NavbarBackdrop(props) {
    return <div role="presentation" {...props} className={clsx('navbar-sidebar__backdrop', props.className)} />;
}
export default function NavbarLayout({ children }) {
    const {
        navbar: { hideOnScroll, style },
    } = useThemeConfig();
    const mobileSidebar = useNavbarMobileSidebar();
    const { navbarRef, isNavbarVisible } = useHideableNavbar(hideOnScroll);
    const [isDocsPage, setIsDocsPage] = useState(false);
    const [isCommunity, setIsCommunity] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const docsPage = pathname === 'docs' || location.pathname.includes('zh-CN/docs');
            setIsDocsPage(docsPage);
        }

        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const communityPage = pathname === 'community' || location.pathname.includes('zh-CN/community');
            setIsCommunity(communityPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <nav
            ref={navbarRef}
            aria-label={translate({
                id: 'theme.NavBar.navAriaLabel',
                message: 'Main',
                description: 'The ARIA label for the main navigation',
            })}
            className={clsx(
                'navbar',
                'navbar--fixed-top',
                isDocsPage && 'docs',
                isCommunity && 'community',
                hideOnScroll && [styles.navbarHideable, !isNavbarVisible && styles.navbarHidden],
                {
                    'navbar--dark': style === 'dark',
                    'navbar--primary': style === 'primary',
                    'navbar-sidebar--show': mobileSidebar.shown,
                },
            )}
        >
            {children}
            <NavbarBackdrop onClick={mobileSidebar.toggle} />
            <NavbarMobileSidebar />
        </nav>
    );
}
