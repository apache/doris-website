import policy from '@site/config/locale-entry.json';
export const LOCALE_PREFERENCE_KEY = policy.preference.key;
const lifetime = policy.preference.maxAgeDays * 24 * 60 * 60 * 1000;
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
export function clearLocalePreference(storage = browserStorage()): boolean {
    try {
        if (!storage) return false;
        storage.removeItem(LOCALE_PREFERENCE_KEY);
    } catch {return false;}
    try {if (typeof window !== 'undefined') window.sessionStorage.removeItem(policy.sessionKey);} catch { /* Optional guard. */ }
    return true;
}
// Reading a preference never navigates. Explicit URL language remains authoritative.
