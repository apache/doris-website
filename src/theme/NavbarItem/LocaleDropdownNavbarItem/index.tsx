import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAlternatePageUtils } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import IconLanguage from '@theme/IconLanguage';
import './styles.scss';
import NavbarItem from '@theme/NavbarItem';
export default function LocaleDropdownNavbarItem({ mobile, dropdownItemsBefore, dropdownItemsAfter, ...props }) {
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();
    const alternatePageUtils = useAlternatePageUtils();
    const localeItems = locales.map(locale => {
        const to = `pathname://${alternatePageUtils.createUrl({
            locale,
            fullyQualified: false,
        })}`;
        return {
            label: localeConfigs[locale].label,
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
        : localeConfigs[currentLocale].label;

    return mobile ? (
        <DropdownNavbarItem
            {...props}
            mobile={mobile}
            label={
                <>
                    <IconLanguage className="icon-language" />
                    {dropdownLabel}
                </>
            }
            items={items}
        />
    ) : (
        <div className="locale-box">
            {items.map((item, index) => (
                <NavbarItem {...item} key={index} />
            ))}
        </div>
    );
}
