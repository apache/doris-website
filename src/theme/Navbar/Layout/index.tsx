import React, { useState, useEffect, useContext, type ComponentProps } from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useHideableNavbar, useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import NavbarMobileSidebar from '@theme/Navbar/MobileSidebar';
import type { Props } from '@theme/Navbar/Layout';
import useIsDocPage from '@site/src/hooks/use-is-doc';
import styles from './styles.module.css';
import { DataContext } from '../../Layout';

function NavbarBackdrop(props: ComponentProps<'div'>) {
    return <div role="presentation" {...props} className={clsx('navbar-sidebar__backdrop', props.className)} />;
}

export default function NavbarLayout({ children }: Props): JSX.Element {
    const {
        navbar: { hideOnScroll, style },
    } = useThemeConfig();
    const { showSearchPageMobile } = useContext(DataContext);
    const mobileSidebar = useNavbarMobileSidebar();
    const [isDocsPage] = useIsDocPage(false);
    const [isCommunity, setIsCommunity] = useState(false);
    const [withoutDoc, setWithoutDoc] = useState(false);
    const { navbarRef, isNavbarVisible } = useHideableNavbar(hideOnScroll);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const tempPath = ['get-starting', 'benchmark', 'ecosystems', 'faq', 'releasenotes'];
            const isDocsPage =
                tempPath.includes(pathname) || tempPath.some(path => location.pathname.includes(`zh-CN/${path}`));
            setWithoutDoc(isDocsPage);
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
            style={showSearchPageMobile ? { height: '3.75rem' } : {}}
            className={clsx(
                'navbar',
                'navbar--fixed-top',
                isDocsPage && 'docs',
                isCommunity && 'community',
                withoutDoc && 'withoutDoc',
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
