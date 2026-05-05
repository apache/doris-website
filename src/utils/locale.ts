export function normalizePathname(pathname: string, locales: string[]): string {
    const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) {
        return '/';
    }
    if (locales.includes(segments[0])) {
        const normalized = `/${segments.slice(1).join('/')}`;
        return normalized === '' ? '/' : normalized;
    }
    return path;
}

export function getLocalePrefix(currentLocale: string, defaultLocale: string): string {
    return currentLocale === defaultLocale ? '' : `/${currentLocale}`;
}

export function isDocsPath(pathname: string, locales: string[]): boolean {
    const normalizedPathname = normalizePathname(pathname, locales);
    return normalizedPathname === '/docs' || normalizedPathname.startsWith('/docs/');
}

export function isDocsNextPath(pathname: string, locales: string[]): boolean {
    const normalizedPathname = normalizePathname(pathname, locales);
    return normalizedPathname === '/docs-next' || normalizedPathname.startsWith('/docs-next/');
}

export function isReleasesPath(pathname: string, locales: string[]): boolean {
    const normalizedPathname = normalizePathname(pathname, locales);
    return normalizedPathname === '/releases' || normalizedPathname.startsWith('/releases/');
}

export function isEventsPath(pathname: string, locales: string[]): boolean {
    const normalizedPathname = normalizePathname(pathname, locales);
    return normalizedPathname === '/events' || normalizedPathname.startsWith('/events/');
}

export function isCommunityPath(pathname: string, locales: string[]): boolean {
    const normalizedPathname = normalizePathname(pathname, locales);
    return normalizedPathname === '/community' || normalizedPathname.startsWith('/community/')
        || normalizedPathname === '/releases' || normalizedPathname.startsWith('/releases/');
}
