import React from 'react';
import clsx from 'clsx';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useActivePlugin, useActiveVersion} from '@docusaurus/plugin-content-docs/client';
import Logo from '@theme/Logo';
import SearchBar from '@theme/SearchBar';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import CollapseButton from '@theme/DocSidebar/Desktop/CollapseButton';
import Content from '@theme/DocSidebar/Desktop/Content';
import type {Props} from '@theme/DocSidebar/Desktop';
import {supportsDocsDomainNavigation} from '@site/src/utils/docs-sidebar-scope';

import styles from './styles.module.css';

function DocSidebarDesktop({path, sidebar, onCollapse, isHidden}: Props) {
  const activePlugin = useActivePlugin();
  const activeVersion = useActiveVersion(activePlugin?.pluginId);
  const usesDomainNavigation = supportsDocsDomainNavigation(activePlugin?.pluginId, activeVersion?.name);
  const {
    navbar: {hideOnScroll},
    docs: {
      sidebar: {hideable},
    },
  } = useThemeConfig();

  return (
    <div
      className={clsx(
        styles.sidebar,
        usesDomainNavigation && styles.sidebarWithDomainNavigation,
        hideOnScroll && styles.sidebarWithHideableNavbar,
        isHidden && styles.sidebarHidden,
      )}>
      {hideOnScroll && <Logo tabIndex={-1} className={styles.sidebarLogo} />}
      {!usesDomainNavigation && (
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarSearch}>
            <SearchBar />
          </div>
          <div className={styles.sidebarLocale}>
            <LocaleDropdownNavbarItem mobile={false} {...({} as any)} />
          </div>
        </div>
      )}
      <Content path={path} sidebar={sidebar} />
      {hideable && <CollapseButton onClick={onCollapse} />}
    </div>
  );
}

export default React.memo(DocSidebarDesktop);
