function getAssetOrigin() {
    return (process.env.DORIS_ASSET_ORIGIN ?? 'https://assets-cdn.selectdb.com/site').replace(/\/$/, '');
}

function getLocalAssetPath(url) {
    const origin = getAssetOrigin();
    if (!origin) return null;
    const base = new URL(origin + '/');
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
    return url.pathname.slice(base.pathname.length - 1) + url.search;
}

module.exports = { getAssetOrigin, getLocalAssetPath };
