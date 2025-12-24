import React, { memo } from 'react';
import { DocSidebarItemsExpandedStateProvider, useVisibleSidebarItems } from '@docusaurus/plugin-content-docs/client';
import DocSidebarItem from '@theme/DocSidebarItem';

import type { Props } from '@theme/DocSidebarItems';

function DocSidebarItems({ items, ...props }: Props): JSX.Element {
    const visibleItems = useVisibleSidebarItems(items, props.activePath);
    const getItemKey = (item: Props['items'][number]) => {
        if ('docId' in item && item.docId) return item.docId;
        if ('href' in item && item.href) return item.href;
        if ('label' in item && item.label) return item.label;
        return item.type;
    };

    return (
        <DocSidebarItemsExpandedStateProvider>
            {visibleItems.map((item, index) => (
                <DocSidebarItem
                    key={getItemKey(item)}
                    item={item}
                    length={visibleItems.length}
                    index={index}
                    {...props}
                />
            ))}
        </DocSidebarItemsExpandedStateProvider>
    );
}

// Optimize sidebar at each "level"
export default memo(DocSidebarItems);
