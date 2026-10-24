import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import {useContentRouteData} from './contentRoute';
import {useLocalizedRoute} from './useLocalizedRoute';
import {saveLocalePreference} from './localePreference';
import {appendRouteSuffix} from './localizedRoute';
import {languageMessages} from './languageMessages';

export function useLanguageItems(queryString = '') {
    const {i18n: {locales, localeConfigs, currentLocale}} = useDocusaurusContext();
    const {pathname, search, hash} = useLocation();
    const browser = useIsBrowser();
    const page = useContentRouteData();
    const resolve = useLocalizedRoute();
    return locales.map(locale => {
        const route = resolve(pathname, {locale, switchLocale: true});
        return {locale, label: localeConfigs[locale].label, htmlLang: localeConfigs[locale].htmlLang,
            href: appendRouteSuffix(route.href, browser ? search : '', browser ? hash : '', queryString),
            current: locale === currentLocale,
            fallbackLabel: page && !page.availableTranslations.includes(locale) ? languageMessages(currentLocale).note : undefined,
            onClick: () => {saveLocalePreference(locale, locales);}};
    });
}
