import {usesSegmenterTokenizer} from './tokenize';
import {language} from './proxiedGeneratedConstants';
import {normalizeRussianSearch} from './searchNormalization';

// The segmenter behind some languages emits standalone '_' and '-' tokens for
// SQL identifiers, but lunr removes those punctuation tokens from its index.
// Try the parts again when the full identifier finds nothing; section-level
// indexing may also put the useful term in a different section from a discarded
// stop word. The configured index language decides, so this needs no locale.
export async function searchWithLocaleFallback(searchByWorker, versionUrl, context, input, limit) {
    const segmented = usesSegmenterTokenizer(language);
    const normalized = language.includes('ru') ? normalizeRussianSearch(input)
        : segmented ? input.replace(/[_-]/g, ' ') : input;
    const results = await searchByWorker(versionUrl, context, normalized, limit);
    if (!segmented || results.length || !/[_-]/.test(input)) return results;
    const parts = [...new Set(input.split(/[_-]+/).filter(part => part.length > 1))]
        .sort((a, b) => b.length - a.length);
    for (const part of parts) {
        const fallback = await searchByWorker(versionUrl, context, part, limit);
        if (fallback.length) return fallback;
    }
    return results;
}
