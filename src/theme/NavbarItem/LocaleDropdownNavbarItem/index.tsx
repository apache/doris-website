import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import { useLocation } from '@docusaurus/router';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/Icon/Language';
import type { LinkLikeNavbarItemProps } from '@theme/NavbarItem';
import type { Props } from '@theme/NavbarItem/LocaleDropdownNavbarItem';

import './styles.scss';
export default function LocaleDropdownNavbarItem({
    mobile,
    dropdownItemsBefore,
    dropdownItemsAfter,
    queryString = '',
    ...props
}: Props): JSX.Element {
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();
    const alternatePageUtils = useAlternatePageUtils();
    const { search, hash } = useLocation();

    const localeItems = locales.map((locale): LinkLikeNavbarItemProps => {
        const baseTo = `pathname://${alternatePageUtils.createUrl({
            locale,
            fullyQualified: false,
        })}`;
        // preserve ?search#hash suffix on locale switches
        const to = `${baseTo}${search}${hash}${queryString}`;
        return {
            label: localeConfigs[locale]!.label,
            lang: localeConfigs[locale]!.htmlLang,
            to,
            target: '_self',
            autoAddBaseUrl: false,
            className:
                // eslint-disable-next-line no-nested-ternary
                locale === currentLocale
                    ? // Similar idea as DefaultNavbarItem: select the right Infima active
                      // class name. This cannot be substituted with isActive, because the
                      // target URLs contain `pathname://` and therefore are not NavLinks!
                      mobile
                        ? 'menu__link--active'
                        : 'dropdown__link--active'
                    : '',
        };
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
            label={
                // <>
                //   <IconLanguage className={styles.iconLanguage} />
                //   {dropdownLabel}
                // </>
                <>
                    <svg
                        className="icon-language"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M7.75756 14.3L10.5816 6.91667H11.8759L14.7 14.3H13.4057L12.7501 12.4167H9.74113L9.06873 14.3H7.75756ZM10.1109 11.35H12.3467L11.254 8.3H11.2036L10.1109 11.35ZM2.84908 12.45L1.97498 11.5833L5.11841 8.48333C4.72618 8.05 4.38439 7.60267 4.09302 7.14133C3.80165 6.68044 3.54389 6.19444 3.31976 5.68333H4.61412C4.80463 6.06111 5.00635 6.39711 5.21927 6.69133C5.43219 6.986 5.68434 7.29444 5.97571 7.61667C6.43519 7.12778 6.81621 6.62511 7.11879 6.10867C7.42137 5.59178 7.67352 5.03889 7.87523 4.45H1V3.23333H5.33694V2H6.58087V3.23333H10.9178V4.45H9.11916C8.89503 5.18333 8.59805 5.89155 8.22824 6.57467C7.85842 7.25822 7.39895 7.90555 6.84983 8.51667L8.3459 10.0167L7.87523 11.2833L5.95891 9.38333L2.84908 12.45Z"
                            fill="#4C576C"
                        />
                    </svg>
                </>
            }
            items={items}
        />
    );
}
