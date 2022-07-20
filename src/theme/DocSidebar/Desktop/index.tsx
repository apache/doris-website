import React from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import SearchBar from '@theme/SearchBar';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import './styles.scss';
function DocSidebarDesktop({ path, sidebar, onCollapse, isHidden }) {
    const {
        navbar: { hideOnScroll },
        docs: {
            sidebar: { hideable },
        },
    } = useThemeConfig();
    return (
        <div className={clsx('sidebar', hideOnScroll && 'sidebar-with-hideable-navbar', isHidden && 'sidebar-hidden')}>
            {hideOnScroll && <Logo tabIndex={-1} className="sidebar-logo" />}
            <div className="doc-search">
                <SearchBar />
            </div>
            <Content path={path} sidebar={sidebar} />
            {hideable && <CollapseButton onClick={onCollapse} />}
        </div>
    );
}
export default React.memo(DocSidebarDesktop);
