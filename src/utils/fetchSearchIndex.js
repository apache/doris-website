// Only production pages use the configured asset CDN. Local previews and
// alternate hosts read their own index, just like their own same-origin worker.
export async function fetchSearchIndex(url, {
    assetOrigin = '', siteOrigin = '', origin = globalThis.location?.origin,
    timeoutMs = 60000, fetchImpl = globalThis.fetch,
} = {}) {
    const source = new URL(url, origin);
    if (source.origin !== origin) throw new Error('Unexpected search index origin');
    const candidates = [source];
    if (assetOrigin && siteOrigin && new URL(siteOrigin).origin === origin) {
        const cdn = new URL(source.pathname + source.search, assetOrigin);
        if (!['http:', 'https:'].includes(cdn.protocol)) throw new Error('Invalid search asset origin');
        if (cdn.origin !== source.origin) candidates.unshift(cdn);
    }
    let failure;
    for (const candidate of candidates) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(candidate.href, {signal: controller.signal});
            if (!response.ok) throw new Error(`Search index HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Invalid search index');
            return data;
        } catch (error) {
            failure = error;
        } finally {
            clearTimeout(timeout);
        }
    }
    throw failure;
}
