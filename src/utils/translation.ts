import useGlobalData from '@docusaurus/useGlobalData';
import {useLocation} from '@docusaurus/router';

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
    return {group: data?.alternates[route],
        // Locales with translation state. A page outside a translated route
        // group must not offer them as an alternate, because the target page
        // would only repeat the default locale's content.
        translatedLocales: data?.locales ?? [],
        managed: !!data?.prefixes.some(prefix => route === prefix || route.startsWith(prefix.replace(/\/$/, '') + '/'))};
}
