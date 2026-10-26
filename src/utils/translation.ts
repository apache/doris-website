import useGlobalData from '@docusaurus/useGlobalData';
import {useLocation} from '@docusaurus/router';
import i18n from '@generated/i18n';
import {hasTranslatedPage, translatedPagePaths, usesDefaultLocalePages} from './localization';
import {normalizePathname} from './locale';
import {useContentRouteData} from './contentRoute';

export type TranslationState = {
    status: string;
    contentLocale: string;
    indexable: boolean;
    useTarget: boolean;
    reviewStatus: 'machine' | 'human' | 'unverified';
    translatedAt: string | null;
    englishPermalink: string;
    sourcePermalink: string;
    englishPath: string;
    sourcePath: string;
    targetPath: string;
};

export function docTranslation(metadata: unknown): TranslationState | undefined {
    return (metadata as {translation?: TranslationState}).translation;
}

type StatusData = {alternates: Record<string, Record<string, string>>; prefixes: string[]; locales?: string[]; pageRoutes?: string[]};
export function useTranslationRoutes() {
    const content = useContentRouteData();
    const data = useGlobalData()['doris-translation-status']?.default as StatusData | undefined;
    const {pathname} = useLocation();
    const route = pathname.replace(/\/$/, '') + '/';
    const pagePath = normalizePathname(pathname, i18n.locales).replace(/\/+$/, '');
    const pageLocales = Object.keys(translatedPagePaths).filter(locale => hasTranslatedPage(pagePath, locale));
    const ordinaryPage = data?.pageRoutes?.includes(route) ?? false;
    const pageFallback = ordinaryPage && usesDefaultLocalePages() && !hasTranslatedPage(pathname);
    if (content?.renderIntegrated) return {
        group: contentRouteGroups(content).indexableTranslations,
        navigationGroup: content.navigationRoutes,
        translatedLocales: data?.locales ?? [], managed: true,
        pageFallback: content.kind === 'page' && content.fallback,
    };
    if (pageLocales.length) {
        return {
            group: Object.fromEntries([i18n.defaultLocale, ...pageLocales].map(locale => [locale,
                `${locale === i18n.defaultLocale ? '' : `/${locale}`}${pagePath}/`])),
            translatedLocales: data?.locales ?? [],
            managed: true,
            pageFallback,
        };
    }
    return {group: data?.alternates[route],
        // Locales with translation state. A page outside a translated route
        // group must not offer them as an alternate, because the target page
        // would only repeat the default locale's content.
        translatedLocales: data?.locales ?? [],
        managed: ordinaryPage || !!data?.prefixes.some(prefix => route === prefix || route.startsWith(prefix.replace(/\/$/, '') + '/')),
        pageFallback};
}

// T01 consumers accept one page's routing payload. The build-only registry
// (source/target digests, state and reports) must not be imported by the browser.
export type ContentRouteData = {
    aggregate?: boolean;
    schemaVersion: 1;
    renderIntegrated: boolean;
    sourceSha: string;
    contentId: string;
    kind: 'docs' | 'page' | 'blog' | 'utility';
    siteLocale: string;
    contentLocale: string;
    fallback: boolean;
    indexable: boolean;
    navigationRoutes: Record<string, string>;
    availableTranslations: string[];
};

export function contentRouteGroups(page: ContentRouteData) {
    return {
        navigationRoutes: page.navigationRoutes,
        indexableTranslations: Object.fromEntries(page.availableTranslations
            .map(locale => [locale, page.navigationRoutes[locale]])),
    };
}
