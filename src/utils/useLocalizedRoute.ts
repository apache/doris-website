import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import useGlobalData from '@docusaurus/useGlobalData';
import {useContentRouteData, useNavigationRoutes} from './contentRoute';
import {resolveLocalizedRoute, rootBaseUrl, localePath, routeForLocale, type RouteRequest, type RouteGroup} from './localizedRoute';

export function useLocalizedRoute() {
    const {siteConfig, i18n} = useDocusaurusContext();
    const {pathname, search, hash} = useLocation();
    const page = useContentRouteData();
    const navigation = useNavigationRoutes();
    const options = {url: siteConfig.url, baseUrl: rootBaseUrl(siteConfig.baseUrl, i18n.currentLocale, i18n.defaultLocale),
        defaultLocale: i18n.defaultLocale, locales: i18n.locales, trailingSlash: siteConfig.trailingSlash};
    // Native docs render their outer navbar above the leaf route provider.
    // Retain the existing exact-route compatibility reader there; never copy
    // the build registry into another client global. Missing managed targets
    // have native English fallback routes in the same plugin/version.
    const legacy = useGlobalData()['doris-translation-status']?.default as {
        alternates?: Record<string, Record<string, string>>;
    } | undefined;
    const alternate = legacy?.alternates?.[pathname.replace(/\/+$/, '') + '/'];
    const source = alternate?.[i18n.defaultLocale];
    const sourceInfo = source && localePath(source, options);
    const compatibility: RouteGroup[] = !page && alternate && sourceInfo ? [{contentId: 'native-doc:current',
        navigationRoutes: Object.fromEntries(i18n.locales.map(locale => [locale,
            alternate[locale] ?? routeForLocale(sourceInfo.path, locale, options)]))}] : [];
    return (href: string, request: Partial<Omit<RouteRequest, 'href' | 'options' | 'currentUrl'>> = {}) =>
        resolveLocalizedRoute({href, locale: i18n.currentLocale, currentUrl: pathname + search + hash,
            options, routes: [...(page ? [page] : []), ...compatibility, ...navigation], ...request});
}
