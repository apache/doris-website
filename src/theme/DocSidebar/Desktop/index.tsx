import React from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import Logo from '@theme/Logo';
import SearchBar from '@theme/SearchBar';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import './styles.scss';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
function DocSidebarDesktop({ path, sidebar, onCollapse, isHidden }) {
    const {
        navbar: { hideOnScroll },
        docs: {
            sidebar: { hideable },
        },
    } = useThemeConfig();
    const hasLearningPath = path.includes('/docs')
    return (
        <div className={clsx('sidebar', hideOnScroll && 'sidebar-with-hideable-navbar', isHidden && 'sidebar-hidden')}>
            {hideOnScroll && <Logo tabIndex={-1} className="sidebar-logo" />}
            <div className="doc-search">
                <SearchBar />
            </div>
            {hasLearningPath && <Link to="/learning" className="learning-path">
                <Translate id="sitemap.page.title" description="">
                    Learning Path
                </Translate>
            </Link>}
            <Content path={path} sidebar={sidebar} />
            {hideable && <CollapseButton onClick={onCollapse} />}
        </div>
    );
}
export default React.memo(DocSidebarDesktop);
