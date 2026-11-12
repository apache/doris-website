import React, { type JSX } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { LinkLikeNavbarItemProps } from '@theme/NavbarItem';
import type { Props } from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import {useLanguageItems} from '@site/src/utils/useLanguageItems';

import './styles.scss';
export default function LocaleDropdownNavbarItem({
    mobile,
    dropdownItemsBefore = [],
    dropdownItemsAfter = [],
    queryString = '',
    ...props
}: Props): JSX.Element {
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();
    const languageItems = useLanguageItems(queryString);
    const localeItems = languageItems.map((item): LinkLikeNavbarItemProps => ({
        label: <span>{item.label}{item.fallbackLabel && <small lang={currentLocale} className="locale-dropdown__fallback"> · {item.fallbackLabel}</small>}</span>,
        lang: item.htmlLang,
        to: `pathname://${item.href}`,
        target: '_self', autoAddBaseUrl: false,
        onClick: item.onClick,
        'aria-current': item.current ? 'page' : undefined,
        className: item.current ? (mobile ? 'menu__link--active' : 'dropdown__link--active') : '',
    } as LinkLikeNavbarItemProps));
    const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];

    // Mobile is handled a bit differently
    const dropdownLabel = mobile
        ? translate({
              message: 'Languages',
              id: 'theme.navbar.mobileLanguageDropdown.label',
              description: 'The label for the mobile language switcher dropdown',
          })
        : localeConfigs[currentLocale]!.label;

    return (
        <DropdownNavbarItem
            {...props}
            mobile={mobile}
            aria-label={dropdownLabel}
            label={
                <>
                    <svg
                        className="icon-language"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
                        <path
                            d="M1.5 8h13M8 1.5c1.75 1.78 2.7 4.03 2.7 6.5s-.95 4.72-2.7 6.5C6.25 12.72 5.3 10.47 5.3 8S6.25 3.28 8 1.5Z"
                            stroke="currentColor"
                            strokeWidth="1.25"
                        />
                    </svg>
                    <span className="locale-current-label">{localeConfigs[currentLocale]!.label}</span>
                </>
            }
            items={items}
        />
    );
}
