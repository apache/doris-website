import useGlobalData from '@docusaurus/useGlobalData';
import {useLocation} from '@docusaurus/router';
import i18n from '@generated/i18n';
import {hasTranslatedPage, translatedPagePaths} from './localization';
import {normalizePathname} from './locale';

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

type StatusData = {alternates: Record<string, Record<string, string>>; prefixes: string[]; locales?: string[]};
export function useTranslationRoutes() {
    const data = useGlobalData()['doris-translation-status']?.default as StatusData | undefined;
    const {pathname} = useLocation();
    const route = pathname.replace(/\/$/, '') + '/';
    const pagePath = normalizePathname(pathname, i18n.locales).replace(/\/+$/, '');
    const pageLocales = Object.keys(translatedPagePaths).filter(locale => hasTranslatedPage(pagePath, locale));
    if (pageLocales.length) {
        return {
            group: Object.fromEntries([i18n.defaultLocale, ...pageLocales].map(locale => [locale,
                `${locale === i18n.defaultLocale ? '' : `/${locale}`}${pagePath}/`])),
            translatedLocales: data?.locales ?? [],
            managed: true,
        };
    }
    return {group: data?.alternates[route],
        // Locales with translation state. A page outside a translated route
        // group must not offer them as an alternate, because the target page
        // would only repeat the default locale's content.
        translatedLocales: data?.locales ?? [],
        managed: !!data?.prefixes.some(prefix => route === prefix || route.startsWith(prefix.replace(/\/$/, '') + '/'))};
}
