import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import { useLocation } from '@docusaurus/router';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import type { LinkLikeNavbarItemProps } from '@theme/NavbarItem';
import type { Props } from '@theme/NavbarItem/LocaleDropdownNavbarItem';

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
    const alternatePageUtils = useAlternatePageUtils();
    const { search, hash } = useLocation();

    const COMING_SOON_LOCALES = new Set(['ja']);

    const localeItems = locales.map((locale): LinkLikeNavbarItemProps => {
        const baseTo = `pathname://${alternatePageUtils.createUrl({
            locale,
            fullyQualified: false,
        })}`;
        // preserve ?search#hash suffix on locale switches
        const to = `${baseTo}${search}${hash}${queryString}`;
        const isComingSoon = COMING_SOON_LOCALES.has(locale);
        const baseLabel = localeConfigs[locale]!.label;
        const label = isComingSoon ? (
            <span className="locale-dropdown__label locale-dropdown__label--coming-soon">
                <span className="locale-dropdown__label-text">{baseLabel}</span>
                <span className="locale-dropdown__coming-soon-badge">Coming Soon</span>
            </span>
        ) : (
            baseLabel
        );
        const activeClassName =
            // eslint-disable-next-line no-nested-ternary
            locale === currentLocale
                ? // Similar idea as DefaultNavbarItem: select the right Infima active
                  // class name. This cannot be substituted with isActive, because the
                  // target URLs contain `pathname://` and therefore are not NavLinks!
                  mobile
                    ? 'menu__link--active'
                    : 'dropdown__link--active'
                : '';
        const className = [activeClassName, isComingSoon ? 'locale-dropdown__link--disabled' : '']
            .filter(Boolean)
            .join(' ');
        return {
            label,
            lang: localeConfigs[locale]!.htmlLang,
            to: isComingSoon ? '#' : to,
            target: '_self',
            autoAddBaseUrl: false,
            className,
            ...(isComingSoon && {
                'aria-disabled': true,
                onClick: (e: React.MouseEvent) => e.preventDefault(),
            }),
        } as LinkLikeNavbarItemProps;
    });
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
                </>
            }
            items={items}
        />
    );
}
