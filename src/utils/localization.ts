import i18n from '@generated/i18n';
import siteConfig from '@generated/docusaurus.config';
import { translate } from '@docusaurus/Translate';

// The build writes locale facts into the site configuration, so this module
// reads configuration instead of naming a language. See config/i18n.js.
const fields = (siteConfig.customFields ?? {}) as {
    translatedLocales?: string[];
    defaultLocalePageLocales?: string[];
};
const translatedLocales = fields.translatedLocales ?? [];
const defaultLocalePageLocales = fields.defaultLocalePageLocales ?? [];

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
