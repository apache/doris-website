export * from './localization';
// English body variants keep URL routing in siteLocale, and embeds/body labels
// in English. Shared chrome imports the ordinary localization module.
export function localizedFrameSource(src: string): string {return src;}
export function localizedAiLabels(): Record<string, string> {return {};}
export function usesDefaultLocalePages(): boolean {return false;}
