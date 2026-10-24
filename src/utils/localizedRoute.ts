/** Pure URL policy. Native manifest routes, including fallback routes, are authoritative. */
export type RouteGroup = {contentId: string; navigationRoutes: Record<string, string>};
export type RouteOptions = {
    url: string;
    baseUrl: string; // Unlocalized deployment root, e.g. / or /preview/.
    defaultLocale: string;
    locales: readonly string[];
    trailingSlash?: boolean;
};
export type RouteRequest = {
    href: string;
    locale: string;
    currentUrl: string;
    options: RouteOptions;
    routes?: readonly RouteGroup[]; // Current page or an explicitly loaded family only.
    contentId?: string;
    switchLocale?: boolean;
    preserveLocale?: boolean;
    queryString?: string;
};
const pathKey = (path: string) => path.replace(/\/+$/, '') || '/';
export function rootBaseUrl(baseUrl: string, currentLocale: string, defaultLocale: string): string {
    const base = '/' + baseUrl.split('/').filter(Boolean).join('/') + '/';
    return (currentLocale !== defaultLocale && base.endsWith('/' + currentLocale + '/')
        ? base.slice(0, -(currentLocale.length + 1)) : base).replace(/^\/\/$/, '/');
}
export function localePath(pathname: string, options: RouteOptions) {
    const base = options.baseUrl.replace(/\/$/, '');
    if (base && pathname !== base && !pathname.startsWith(base + '/')) return undefined;
    const rest = pathname.slice(base.length) || '/';
    const [first] = rest.slice(1).split('/');
    const explicit = options.locales.includes(first) && first !== options.defaultLocale;
    return {locale: explicit ? first : options.defaultLocale, explicit,
        path: explicit ? rest.slice(first.length + 1) || '/' : rest};
}
export function isSystemNoindexPath(pathname: string, options: RouteOptions): boolean {
    return /^\/(?:404\.html|search\/?)$/.test(localePath(pathname, options)?.path ?? '');
}
export function routeForLocale(path: string, locale: string, options: RouteOptions): string {
    const base = options.baseUrl.replace(/\/$/, '');
    const result = base + (locale === options.defaultLocale ? '' : '/' + locale) + '/' + path.replace(/^\/+/, '');
    if (options.trailingSlash === undefined) return result;
    const normalized = pathKey(result);
    return (options.trailingSlash || path === '/') && normalized !== '/' ? normalized + '/' : normalized;
}
const resourcePath = (path: string) => /^\/(?:assets|images|img|js|css|fonts|files|downloads|api)(?:\/|$)/i.test(path)
    || /\.[a-z\d]{1,8}$/i.test(path);
export function appendRouteSuffix(href: string, search = '', hash = '', extra = ''): string {
    const url = new URL(href, 'https://route.invalid');
    if (search) url.search = search;
    if (hash) url.hash = hash;
    if (extra) {
        const parameters = new URLSearchParams(extra.replace(/^\?/, ''));
        parameters.forEach((value, key) => url.searchParams.set(key, value));
    }
    return url.pathname + url.search + url.hash;
}
export function resolveLocalizedRoute(request: RouteRequest): {href: string; known: boolean; reason: string} {
    const {href, locale, options, currentUrl, switchLocale = false} = request;
    const unchanged = (reason: string) => ({href, known: false, reason});
    if (request.preserveLocale || href.startsWith('pathname://')) return unchanged('explicit-target');
    if (!options.locales.includes(locale)) return unchanged('disabled-locale');
    if (!href || (!switchLocale && /^[?#]/.test(href))) return unchanged('same-page');
    let target: URL;
    try {target = new URL(href, new URL(currentUrl, options.url));} catch {return unchanged('invalid');}
    if (!/^https?:$/.test(target.protocol) || target.origin !== new URL(options.url).origin) return unchanged('external');
    let info = localePath(target.pathname, options);
    let rebased = false;
    if (!info && href.startsWith('/') && !href.startsWith('//')) {
        const projectPath = localePath(target.pathname, {...options, baseUrl: '/'});
        if (projectPath && !resourcePath(projectPath.path)) {
            target.pathname = options.baseUrl.replace(/\/$/, '') + target.pathname;
            info = localePath(target.pathname, options); rebased = true;
        }
    }
    if (!info || resourcePath(info.path)) return unchanged('resource');
    if (info.explicit && !switchLocale && /^(?:\/|https?:)/i.test(href)) return {
        href: rebased ? target.pathname + target.search + target.hash : href, known: false, reason: 'explicit-locale'};
    // A second locale segment is malformed, rather than a license to create /ja/ko/... .
    if (options.locales.includes(info.path.split('/')[1])) return unchanged('duplicate-locale');
    const group = request.routes?.find(page => request.contentId ? page.contentId === request.contentId
        : Object.values(page.navigationRoutes).some(route => pathKey(route) === pathKey(target.pathname)));
    const counterpart = group?.navigationRoutes[locale];
    if (group && !counterpart) return unchanged('missing-counterpart');
    const result = counterpart ?? routeForLocale(info.path, locale, options);
    // Unknown paths keep their identity and reach a genuine localized 404; never use a home URL.
    return {href: appendRouteSuffix(result, target.search, target.hash, request.queryString),
        known: !!counterpart, reason: counterpart ? 'native-route' : 'unresolved-path'};
}
