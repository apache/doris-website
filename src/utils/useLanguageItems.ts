import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useContentRouteData} from './contentRoute';
import {useLocalizedRoute} from './useLocalizedRoute';
import {saveLocalePreference} from './localePreference';
import {appendRouteSuffix, rootBaseUrl} from './localizedRoute';
import {languageMessages} from './languageMessages';
import {useAllDocsData} from '@docusaurus/plugin-content-docs/client';
import {isTranslatedLocale} from './localization';
import {convertSearchParams} from './searchScopes';

export function useLanguageItems(queryString = '') {
    const {i18n: {locales, localeConfigs, currentLocale, defaultLocale}, siteConfig} = useDocusaurusContext();
    const {pathname, search, hash} = useLocation();
    const browser = useIsBrowser();
    const page = useContentRouteData();
    const resolve = useLocalizedRoute();
    const versions = useAllDocsData().default?.versions ?? [];
    return locales.map(locale => {
        const route = resolve(pathname, {locale, switchLocale: true});
        const root = rootBaseUrl(siteConfig.baseUrl, currentLocale, defaultLocale);
        // An English root has no locale prefix. Keep this explicit user action
        // authoritative even when storage is unavailable in this browser.
        const englishRoot = locale === defaultLocale && route.href.split(/[?#]/)[0].replace(/\/$/, '') === root.replace(/\/$/, '');
        const relative = pathname.startsWith(root) ? pathname.slice(root.length).replace(new RegExp(`^(?:${locales.filter(value=>value!==defaultLocale).join('|')})/`),'') : '';
        const scopes = siteConfig.customFields?.searchContexts as {source?:string[];managed?:string[]} | undefined;
        const contexts = isTranslatedLocale(locale) ? scopes?.managed : scopes?.source;
        const sourceContexts = isTranslatedLocale(currentLocale) ? scopes?.managed : scopes?.source;
        const suffix = browser && relative.replace(/\/$/,'') === 'search' && contexts
            ? '?' + convertSearchParams(new URLSearchParams(search),{contexts,versions,managed:isTranslatedLocale(locale)},
                sourceContexts?{contexts:sourceContexts,versions,managed:isTranslatedLocale(currentLocale)}:undefined).toString()
            : browser ? search : '';
        let href = appendRouteSuffix(route.href, suffix, browser ? hash : '', queryString);
        if (englishRoot) href = appendRouteSuffix(href, '', '', `lang=${defaultLocale}`);
        return {locale, label: localeConfigs[locale].label, htmlLang: localeConfigs[locale].htmlLang,
            href,
            current: locale === currentLocale,
            fallbackLabel: page && !page.availableTranslations.includes(locale) ? languageMessages(currentLocale).note : undefined,
            onClick: () => {saveLocalePreference(locale, locales);}};
    });
}
