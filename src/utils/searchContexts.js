import {sortSearchResults} from '@yang1666204/docusaurus-search-local/dist/client/client/utils/sortSearchResults';
import {processTreeStatusOfSearchResults} from '@yang1666204/docusaurus-search-local/dist/client/client/utils/processTreeStatusOfSearchResults';
import {SearchDocumentType} from '../../shared/interfaces';
import {searchContextByPaths, useAllContextsWithNoSearchContext} from './proxiedGenerated';

// With useAllContextsWithNoSearchContext, a page outside every search context
// searches all of them. The localized build writes no union of the context
// indexes for that (see indexGroups in scripts/i18n/search-plugin.cjs), so the
// browser queries each context index and merges the results.
export function indexContexts(searchContext) {
    if (searchContext || !useAllContextsWithNoSearchContext || !Array.isArray(searchContextByPaths)) {
        return [searchContext];
    }
    return searchContextByPaths.map(item => (typeof item === 'string' ? item : item.path));
}

export async function fetchContextIndexes(fetchIndexesByWorker, versionUrl, searchContext) {
    await Promise.all(indexContexts(searchContext).map(context => fetchIndexesByWorker(versionUrl, context)));
}

// Takes and returns the plugin's searchByWorker signature.
export function searchAcrossContexts(searchByWorker) {
    return async (versionUrl, searchContext, input, limit) => {
        const contexts = indexContexts(searchContext);
        if (contexts.length === 1) return searchByWorker(versionUrl, contexts[0], input, limit);
        const lists = await Promise.all(contexts.map(context => searchByWorker(versionUrl, context, input, limit)));
        return mergeSearchResults(lists, limit);
    };
}

// Each list arrives ranked and grouped by the worker, whose sort also raises
// title scores by half. Undo that so the same sort ranks all lists together and
// applies it once, keeping each page's sections after its title.
export function mergeSearchResults(lists, limit) {
    const results = lists.flat().map(result => ({
        ...result,
        isInterOfTree: undefined,
        isLastOfTree: undefined,
        score: result.type === SearchDocumentType.Title && result.score ? result.score / 1.5 : result.score,
    }));
    sortSearchResults(results);
    const merged = results.slice(0, limit);
    processTreeStatusOfSearchResults(merged);
    return merged;
}
