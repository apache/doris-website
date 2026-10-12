// TinySegmenter emits standalone '_' and '-' tokens for SQL identifiers, but
// lunr removes those punctuation tokens from its index. Try the parts again
// when the full identifier finds nothing; section-level indexing may also put
// the useful term in a different section from a discarded stop word.
export async function searchWithLocaleFallback(searchByWorker, versionUrl, context, input, limit, locale) {
    const normalized = locale === 'ja' ? input.replace(/[_-]/g, ' ') : input;
    const results = await searchByWorker(versionUrl, context, normalized, limit);
    if (locale !== 'ja' || results.length || !/[_-]/.test(input)) return results;
    const parts = [...new Set(input.split(/[_-]+/).filter(part => part.length > 1))]
        .sort((a, b) => b.length - a.length);
    for (const part of parts) {
        const fallback = await searchByWorker(versionUrl, context, part, limit);
        if (fallback.length) return fallback;
    }
    return results;
}
