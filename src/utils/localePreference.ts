export const LOCALE_PREFERENCE_KEY = 'doris.localePreference';
const lifetime = 180 * 24 * 60 * 60 * 1000;
type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
function browserStorage(): StorageAccess | undefined {
    try {return typeof window === 'undefined' ? undefined : window.localStorage;} catch {return undefined;}
}
export function readLocalePreference(locales: readonly string[], now = Date.now(), storage = browserStorage()): string | undefined {
    try {
        const value = storage?.getItem(LOCALE_PREFERENCE_KEY);
        if (!value) return undefined;
        const record = JSON.parse(value);
        if (record.version === 1 && locales.includes(record.locale) && Number.isFinite(record.updatedAt)
            && record.updatedAt <= now && now - record.updatedAt < lifetime) return record.locale;
        storage?.removeItem(LOCALE_PREFERENCE_KEY);
    } catch { /* Storage is optional, including in private browsing and SSR. */ }
    return undefined;
}
export function saveLocalePreference(locale: string, locales: readonly string[], now = Date.now(), storage = browserStorage()): boolean {
    if (!locales.includes(locale) || !Number.isFinite(now)) return false;
    try {
        if (!storage) return false;
        storage.setItem(LOCALE_PREFERENCE_KEY, JSON.stringify({version: 1, locale, updatedAt: now}));
        return true;
    } catch {return false;}
}
// Reading a preference never navigates. URL language remains authoritative;
// only the future root-entry policy (T21) may consume a saved default.
