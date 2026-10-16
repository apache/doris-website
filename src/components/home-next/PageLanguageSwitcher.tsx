import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
import { hasTranslatedPage } from '@site/src/utils/localization';
import { normalizePathname } from '@site/src/utils/locale';
import './PageLanguageSwitcher.scss';

export function PageLanguageSwitcher(): JSX.Element | null {
    const { i18n: { currentLocale, defaultLocale, locales, localeConfigs } } = useDocusaurusContext();
    const { pathname, search, hash } = useLocation();
    const path = normalizePathname(pathname, locales).replace(/\/+$/, '');
    const translations = locales.filter(locale => hasTranslatedPage(path, locale));
    if (!translations.length || (currentLocale !== defaultLocale && !translations.includes(currentLocale))) return null;

    const languages = [defaultLocale, ...translations];
    return (
        <div className="page-language-switcher" role="group" aria-label={translate({ id: 'marketing.pageLanguage', message: 'Page language' })}>
            {languages.map(locale => (
                <Link
                    key={locale}
                    to={`pathname://${locale === defaultLocale ? '' : `/${locale}`}${path}/${search}${hash}`}
                    autoAddBaseUrl={false}
                    target="_self"
                    lang={localeConfigs[locale].htmlLang}
                    hrefLang={localeConfigs[locale].htmlLang}
                    aria-current={locale === currentLocale ? 'page' : undefined}
                >
                    {localeConfigs[locale].label}
                </Link>
            ))}
        </div>
    );
}
