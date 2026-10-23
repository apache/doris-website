import React, { JSX } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { translate } from '@docusaurus/Translate';
import { hasTranslatedPage } from '@site/src/utils/localization';
import { normalizePathname } from '@site/src/utils/locale';
import './PageLanguageSwitcher.scss';

export function PageLanguageSwitcher(): JSX.Element | null {
    const { i18n: { currentLocale, defaultLocale, locales, localeConfigs } } = useDocusaurusContext();
    const { pathname, search, hash } = useLocation();
    // Match SSR first, then refresh the suffix when hydration completes.
    const suffix = useIsBrowser() ? search + hash : '';
    const path = normalizePathname(pathname, locales).replace(/\/+$/, '');
    const translations = locales.filter(locale => hasTranslatedPage(path, locale));
    // Fallback pages also need an exit to English or an available translation.
    if (!translations.length) return null;

    const languages = [defaultLocale, ...translations];
    return (
        <div className="page-language-switcher" role="group" aria-label={translate({ id: 'marketing.pageLanguage', message: 'Page language' })}>
            {languages.map(locale => (
                <Link
                    key={locale}
                    to={`pathname://${locale === defaultLocale ? '' : `/${locale}`}${path}/${suffix}`}
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
