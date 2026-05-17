import React from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
    useSidebarBreadcrumbs,
    useActivePluginAndVersion,
} from '@docusaurus/plugin-content-docs/client';
import { useHomePageRoute } from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import { translate } from '@docusaurus/Translate';
import HomeBreadcrumbItem from '@theme/DocBreadcrumbs/Items/Home';

import styles from './styles.module.css';

function BreadcrumbsItemLink({
    children,
    href,
    isLast,
}: {
    children: React.ReactNode;
    href: string | undefined;
    isLast: boolean;
}) {
    const className = 'breadcrumbs__link';
    if (isLast) {
        return (
            <span className={className} itemProp="name">
                {children}
            </span>
        );
    }
    return href ? (
        <Link className={className} href={href} itemProp="item">
            <span itemProp="name">{children}</span>
        </Link>
    ) : (
        <span className={className}>{children}</span>
    );
}

function BreadcrumbsItem({
    children,
    active,
    index,
    addMicrodata,
}: {
    children: React.ReactNode;
    active: boolean;
    index: number;
    addMicrodata: boolean;
}) {
    return (
        <li
            {...(addMicrodata && {
                itemScope: true,
                itemProp: 'itemListElement',
                itemType: 'https://schema.org/ListItem',
            })}
            className={clsx('breadcrumbs__item', {
                'breadcrumbs__item--active': active,
            })}
        >
            {children}
            <meta itemProp="position" content={String(index + 1)} />
        </li>
    );
}

export default function DocBreadcrumbs(): JSX.Element | null {
    const breadcrumbs = useSidebarBreadcrumbs();
    const homePageRoute = useHomePageRoute();
    const activePluginAndVersion = useActivePluginAndVersion();
    if (!breadcrumbs) {
        return null;
    }
    // Drop the top-level sidebar section group (e.g. "Get Started"),
    // since it's a visual grouping and has no destination page.
    const visibleBreadcrumbs = breadcrumbs.length > 1 ? breadcrumbs.slice(1) : breadcrumbs;
    const activeVersion = activePluginAndVersion?.activeVersion;
    const versionMainDocPath = activeVersion?.docs.find(doc => doc.id === activeVersion.mainDocId)?.path;
    return (
        <nav
            className={clsx(ThemeClassNames.docs.docBreadcrumbs, styles.breadcrumbsContainer)}
            aria-label={translate({
                id: 'theme.docs.breadcrumbs.navAriaLabel',
                message: 'Breadcrumbs',
                description: 'The ARIA label for the breadcrumbs',
            })}
        >
            <ul className="breadcrumbs" itemScope itemType="https://schema.org/BreadcrumbList">
                {homePageRoute && <HomeBreadcrumbItem />}
                {activeVersion && (
                    <li className="breadcrumbs__item">
                        {versionMainDocPath ? (
                            <Link className="breadcrumbs__link" href={versionMainDocPath}>
                                {activeVersion.label}
                            </Link>
                        ) : (
                            <span className="breadcrumbs__link">{activeVersion.label}</span>
                        )}
                    </li>
                )}
                {visibleBreadcrumbs.map((item, idx) => {
                    const isLast = idx === visibleBreadcrumbs.length - 1;
                    const href =
                        item.type === 'category' && (item as any).linkUnlisted ? undefined : (item as any).href;
                    return (
                        <BreadcrumbsItem key={idx} active={isLast} index={idx} addMicrodata={!!href}>
                            <BreadcrumbsItemLink href={href} isLast={isLast}>
                                {item.label}
                            </BreadcrumbsItemLink>
                        </BreadcrumbsItem>
                    );
                })}
            </ul>
        </nav>
    );
}
