import i18n from '@generated/i18n';
import siteConfig from '@generated/docusaurus.config';
import { translate } from '@docusaurus/Translate';

// Ordinary pages beyond the homepage are translated in later tasks. Their
// Japanese navigation labels explicitly identify the English destination.
export function japaneseHomeLink(href: string): string {
    if (i18n.currentLocale !== 'ja' || !href.startsWith('/')) return href;
    if (href.startsWith('/ja/')) return href;
    if (/^\/(docs|community|releases|course)(\/|$)/.test(href)) return href;
    return `pathname://${href}`;
}

// Plain HTML anchors do not receive Docusaurus Link's locale prefix.
export function japaneseDocLink(href: string): string {
    return i18n.currentLocale === 'ja'
        ? `${siteConfig.baseUrl.replace(/\/$/, '')}${href}`
        : href;
}

export function japaneseFrameSource(src: string): string {
    return i18n.currentLocale === 'ja' ? `${src}?locale=ja` : src;
}

export function japaneseAiLabels(): Record<string, string> {
    if (i18n.currentLocale !== 'ja') return {};
    return {
        'data-kapa-loading-label': translate({ id: 'homepage.ai.loading', message: 'Loading AI…' }),
        'data-kapa-slow-label': translate({ id: 'homepage.ai.slow', message: 'Still loading…' }),
        'data-kapa-error-label': translate({ id: 'homepage.ai.error', message: 'AI unavailable' }),
    };
}
