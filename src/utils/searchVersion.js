const trimEnd = value => value.replace(/\/+$/, '');
const withSlash = value => `${trimEnd(value)}/`;

// The native search plugin writes the actual last version's index at the locale
// root. Other versions use their native paths. Scoped builds can choose a
// different last version, so the published default-version constant is not an
// index-location contract.
export function searchIndexBaseUrl(baseUrl, versions, {pathname, versionPath} = {}) {
    const base = withSlash(baseUrl);
    const requested = versionPath !== undefined
        ? trimEnd(base + versionPath.replace(/^\/+/, ''))
        : trimEnd(pathname ?? '');
    const candidates = versions.filter(version => {
        const route = trimEnd(version.path);
        return requested === route || (versionPath === undefined && requested.startsWith(`${route}/`));
    }).sort((a, b) => b.path.length - a.path.length);
    const version = candidates[0];
    return version && !version.isLast ? withSlash(version.path) : base;
}
