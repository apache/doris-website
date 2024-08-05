import React from 'react';
import clsx from 'clsx';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';
import type { DesktopOrMobileNavBarItemProps, Props } from '@theme/NavbarItem/DefaultNavbarItem';

function DefaultNavbarItemDesktop({ className, isDropdownItem = false,isDocsPage, ...props}: DesktopOrMobileNavBarItemProps) {
    const element = (
        <NavbarNavLink
            className={clsx(isDropdownItem ? 'dropdown__link' : 'navbar__item navbar__link', className)}
            isDropdownLink={isDropdownItem}
            style={{ textAlign: props?.align || 'center',padding:'0 0.625rem'}}
            {...props}
        />
    );

    if (isDropdownItem) {
        return <li>{element}</li>;
    }
    
    return element;
}

function DefaultNavbarItemMobile({ className, isDropdownItem, ...props }: DesktopOrMobileNavBarItemProps) {
    return (
        <li className="menu__list-item">
            <NavbarNavLink className={clsx('menu__link', className)} {...props} />
        </li>
    );
}

export default function DefaultNavbarItem({
    mobile = false,
    position, // Need to destructure position from props so that it doesn't get passed on.
    ...props
}: Props): JSX.Element {
    const Comp = mobile ? DefaultNavbarItemMobile : DefaultNavbarItemDesktop;
    return (
        <Comp
            {...props}
            activeClassName={props.activeClassName ?? (mobile ? 'menu__link--active' : 'navbar__link--active')}
        />
    );
}
