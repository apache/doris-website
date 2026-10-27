const helper = require.resolve('../../src/utils/fetchSearchIndex.js');

// Keep the pinned plugin's tokenizer, ranking and result shape. Adapt only
// transport and its rejected-promise cache; fail closed on an upstream change.
function adaptSearchWorker(source, options = {}) {
    const replacements = [
        ['const cache = new Map();',
            `import {fetchSearchIndex} from ${JSON.stringify(helper)};\nconst cache = new Map();`],
        ['promise = legacyFetchIndexes(baseUrl, searchContext);',
            `promise = legacyFetchIndexes(baseUrl, searchContext).catch(error => {\n` +
            `                if (cache.get(cacheKey) === promise) cache.delete(cacheKey);\n` +
            `                throw error;\n            });`],
        ['const json = (await (await fetch(url)).json());',
            `const json = await fetchSearchIndex(fullUrl, ${JSON.stringify(options)});`],
    ];
    for (const [before, after] of replacements) {
        if (source.split(before).length !== 2) throw new Error('Unexpected search worker format; revalidate the pinned search plugin');
        source = source.replace(before, after);
    }
    return source;
}
module.exports = function searchWorkerLoader(source) {
    this.cacheable?.();
    return adaptSearchWorker(source, this.getOptions());
};
module.exports.adaptSearchWorker = adaptSearchWorker;
