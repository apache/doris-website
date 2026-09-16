import {
    findFirstSidebarItemLink,
    isActiveSidebarItem,
} from '@docusaurus/plugin-content-docs/client';
import type { PropSidebar, PropSidebarItem } from '@docusaurus/plugin-content-docs';

export interface DocsDomain {
    href: string;
    isActive: boolean;
    item: PropSidebarItem;
    label: string;
}

export interface DocsSidebarScope {
    activeDomain?: DocsDomain;
    domains: DocsDomain[];
    scopedItems: PropSidebar;
}

export function supportsDocsDomainNavigation(
    pluginId: string | undefined,
    versionName: string | undefined,
): boolean {
    return pluginId === 'default' && (versionName === 'current' || versionName === '4.x');
}

function getNavigationLabel(item: PropSidebarItem): string | undefined {
    if (item.type === 'category' || item.type === 'link') {
        return item.label;
    }
    return undefined;
}

/**
 * Treat the first sidebar level as documentation domains. The active domain
 * feeds both the horizontal navigation and the local sidebar, so the two
 * navigation surfaces cannot drift apart as sidebars.ts evolves.
 */
export function getDocsSidebarScope(sidebarItems: PropSidebar, activePath: string): DocsSidebarScope {
    const domains = sidebarItems.flatMap(item => {
        const label = getNavigationLabel(item);
        const href = findFirstSidebarItemLink(item);
        if (!label || !href) {
            return [];
        }
        return [{
            href,
            isActive: isActiveSidebarItem(item, activePath),
            item,
            label,
        }];
    });
    const activeDomain = domains.find(domain => domain.isActive);

    return {
        activeDomain,
        domains,
        scopedItems: activeDomain ? [activeDomain.item] : sidebarItems,
    };
}
