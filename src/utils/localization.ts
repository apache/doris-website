import i18n from '@generated/i18n';
import siteConfig from '@generated/docusaurus.config';
import { translate } from '@docusaurus/Translate';
import { applyTrailingSlash } from '@docusaurus/utils-common';
import { normalizePathname } from './locale';
import {resolveLocalizedRoute, rootBaseUrl} from './localizedRoute';

// The build writes locale facts into the site configuration, so this module
// reads configuration instead of naming a language. See config/i18n.js.
const fields = (siteConfig.customFields ?? {}) as {
    translatedLocales?: string[];
    defaultLocalePageLocales?: string[];
    translatedPagePaths?: Record<string, string[]>;
};
const translatedLocales = fields.translatedLocales ?? [];
const defaultLocalePageLocales = fields.defaultLocalePageLocales ?? [];
export const translatedPagePaths = fields.translatedPagePaths ?? {};

/** Ordinary pages with an explicit translation, even in a docs-first locale. */
export function hasTranslatedPage(pathname: string, locale = i18n.currentLocale): boolean {
    const path = normalizePathname(pathname, i18n.locales).replace(/\/+$/, '');
    return translatedPagePaths[locale]?.includes(path) ?? false;
}

/** A locale with per-document translation state, which renders its notices. */
export function isTranslatedLocale(locale: string): boolean {
    return translatedLocales.includes(locale);
}

/**
 * A locale that is still being introduced: its ordinary pages are not
 * translated by default, apart from its registered translated pages, so other
 * ordinary links must target the default locale. The same
 * locales label their embedded UI — the AI widget and the illustration frames.
 */
export function usesDefaultLocalePages(): boolean {
    return defaultLocalePageLocales.includes(i18n.currentLocale);
}

/**
 * The default locale's path for a page the current locale served as a fallback,
 * so the page can point search engines at the copy worth ranking.
 */
export function defaultLocalePath(permalink: string): string {
    const path = normalizePathname(permalink, [i18n.currentLocale]);
    // Permalinks carry no trailing slash; the served URLs do.
    return applyTrailingSlash(path, { trailingSlash: siteConfig.trailingSlash, baseUrl: siteConfig.baseUrl });
}

export function localizedHomeLink(href: string): string {
    return resolveLocalizedRoute({href, locale: i18n.currentLocale, currentUrl: siteConfig.baseUrl,
        options: {url: siteConfig.url, baseUrl: rootBaseUrl(siteConfig.baseUrl, i18n.currentLocale, i18n.defaultLocale),
            defaultLocale: i18n.defaultLocale, locales: i18n.locales, trailingSlash: siteConfig.trailingSlash}}).href;
}

// Plain HTML anchors do not receive Docusaurus Link's locale prefix.
export function localizedDocLink(href: string): string {
    return localizedHomeLink(href);
}

export function localizedFrameSource(src: string): string {
    const url = new URL(src, siteConfig.url);
    if (url.origin !== new URL(siteConfig.url).origin) return src;
    url.searchParams.set('locale', i18n.currentLocale);
    return url.pathname + url.search + url.hash;
}

export function localizedAiLabels(): Record<string, string> {
    return {
        'data-kapa-loading-label': translate({ id: 'homepage.ai.loading', message: 'Loading AI…' }),
        'data-kapa-slow-label': translate({ id: 'homepage.ai.slow', message: 'Still loading…' }),
        'data-kapa-error-label': translate({ id: 'homepage.ai.error', message: 'AI unavailable' }),
    };
}

/** A document whose content came from a source locale, not from a translation. */
export function isFallbackSource(source: string, locale: string): boolean {
    return isTranslatedLocale(locale) && !source.startsWith(`@site/i18n/${locale}/`);
}
