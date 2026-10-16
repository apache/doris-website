import i18n from '@generated/i18n';
import siteConfig from '@generated/docusaurus.config';
import { translate } from '@docusaurus/Translate';
import { applyTrailingSlash } from '@docusaurus/utils-common';
import { normalizePathname } from './locale';

// The build writes locale facts into the site configuration, so this module
// reads configuration instead of naming a language. See config/i18n.js.
const fields = (siteConfig.customFields ?? {}) as {
    translatedLocales?: string[];
    defaultLocalePageLocales?: string[];
    defaultLocaleBlogLocales?: string[];
};
const translatedLocales = fields.translatedLocales ?? [];
const defaultLocalePageLocales = fields.defaultLocalePageLocales ?? [];
const defaultLocaleBlogLocales = fields.defaultLocaleBlogLocales ?? [];

/** A locale with per-document translation state, which renders its notices. */
export function isTranslatedLocale(locale: string): boolean {
    return translatedLocales.includes(locale);
}

/**
 * A locale that is still being introduced: its ordinary pages are not
 * translated and render the default locale's content, so a link to one must
 * target the default locale instead of a locale-prefixed page. The same
 * locales label their embedded UI — the AI widget and the illustration frames.
 */
export function usesDefaultLocalePages(): boolean {
    return defaultLocalePageLocales.includes(i18n.currentLocale);
}

/**
 * A locale whose blog has no translated posts, so every blog route under it
 * repeats the default locale's posts at its own URL. Those routes stay
 * reachable but must not be indexed as a second copy of the articles.
 */
export function usesDefaultLocaleBlog(): boolean {
    return defaultLocaleBlogLocales.includes(i18n.currentLocale);
}

/** Whether a route is one of those blog routes. */
export function isDefaultLocaleBlogRoute(pathname: string): boolean {
    if (!usesDefaultLocaleBlog()) return false;
    // Blog routes live under the default locale's /blog, so its own prefix is
    // what a localized route has to drop before the section can be told apart.
    const path = normalizePathname(pathname, [i18n.currentLocale]).replace(/\/+$/, '');
    return path === '/blog' || path.startsWith('/blog/');
}

/**
 * The default locale's path for a page the current locale served as a fallback,
 * so the page can point search engines at the copy worth ranking.
 */
export function defaultLocalePath(permalink: string): string {
    const prefix = `/${i18n.currentLocale}/`;
    const path = permalink.startsWith(prefix) ? `/${permalink.slice(prefix.length)}` : permalink;
    // Permalinks carry no trailing slash; the served URLs do.
    return applyTrailingSlash(path, { trailingSlash: siteConfig.trailingSlash, baseUrl: siteConfig.baseUrl });
}

export function localizedHomeLink(href: string): string {
    if (!usesDefaultLocalePages() || !href.startsWith('/')) return href;
    const prefix = siteConfig.baseUrl.replace(/\/$/, '');
    if (prefix && href.startsWith(`${prefix}/`)) return href;
    // The course hub is an ordinary page; lessons use the docs plugin.
    if (/^\/course\/?(?:[?#]|$)/.test(href)) return `pathname://${href}`;
    if (/^\/(docs|community|releases|course)(\/|$)/.test(href)) return href;
    return `pathname://${href}`;
}

// Plain HTML anchors do not receive Docusaurus Link's locale prefix.
export function localizedDocLink(href: string): string {
    return usesDefaultLocalePages()
        ? `${siteConfig.baseUrl.replace(/\/$/, '')}${href}`
        : href;
}

export function localizedFrameSource(src: string): string {
    return usesDefaultLocalePages() ? `${src}?locale=${i18n.currentLocale}` : src;
}

export function localizedAiLabels(): Record<string, string> {
    if (!usesDefaultLocalePages()) return {};
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
