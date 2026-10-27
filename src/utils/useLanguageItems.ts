import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useContentRouteData} from './contentRoute';
import {useLocalizedRoute} from './useLocalizedRoute';
import {saveLocalePreference} from './localePreference';
import {appendRouteSuffix, rootBaseUrl} from './localizedRoute';
import {languageMessages} from './languageMessages';

export function useLanguageItems(queryString = '') {
    const {i18n: {locales, localeConfigs, currentLocale, defaultLocale}, siteConfig} = useDocusaurusContext();
    const {pathname, search, hash} = useLocation();
    const browser = useIsBrowser();
    const page = useContentRouteData();
    const resolve = useLocalizedRoute();
    return locales.map(locale => {
        const route = resolve(pathname, {locale, switchLocale: true});
        const root = rootBaseUrl(siteConfig.baseUrl, currentLocale, defaultLocale);
        // An English root has no locale prefix. Keep this explicit user action
        // authoritative even when storage is unavailable in this browser.
        const englishRoot = locale === defaultLocale && route.href.split(/[?#]/)[0].replace(/\/$/, '') === root.replace(/\/$/, '');
        let href = appendRouteSuffix(route.href, browser ? search : '', browser ? hash : '', queryString);
        if (englishRoot) href = appendRouteSuffix(href, '', '', `lang=${defaultLocale}`);
        return {locale, label: localeConfigs[locale].label, htmlLang: localeConfigs[locale].htmlLang,
            href,
            current: locale === currentLocale,
            fallbackLabel: page && !page.availableTranslations.includes(locale) ? languageMessages(currentLocale).note : undefined,
            onClick: () => {saveLocalePreference(locale, locales);}};
    });
}
