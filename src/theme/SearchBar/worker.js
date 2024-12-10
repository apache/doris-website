import * as Comlink from "comlink";
import lunr from "lunr";
import { searchIndexUrl, searchResultLimits, language } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGeneratedConstants";
import { tokenize } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/tokenize";
import { smartQueries } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/smartQueries";
import { SearchDocumentType, } from "../../shared/interfaces";
import { sortSearchResults } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/sortSearchResults";
import { processTreeStatusOfSearchResults } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/processTreeStatusOfSearchResults";
const cache = new Map();
export class SearchWorker {
    async fetchIndexes(baseUrl, searchContext) {
        await this.lowLevelFetchIndexes(baseUrl, searchContext);
    }
    async lowLevelFetchIndexes(baseUrl, searchContext) {
        console.log('lowLevelFetchIndexes');
        
        const cacheKey = `${baseUrl}${searchContext}`;
        let promise = cache.get(cacheKey);
        if (!promise) {
            console.log('no cache');
            
            promise = legacyFetchIndexes(baseUrl, searchContext);
            cache.set(cacheKey, promise);
        }
        return promise;
    }
    async search(baseUrl, searchContext, input) {
        const rawTokens = tokenize(input, language);
        if (rawTokens.length === 0) {
            return [];
        }
        const { wrappedIndexes, zhDictionary } = await this.lowLevelFetchIndexes(baseUrl, searchContext);
        const queries = smartQueries(rawTokens, zhDictionary);
        const results = [];
        search: for (const { term, tokens } of queries) {
            for (const { documents, index, type } of wrappedIndexes) {
                results.push(...index
                    .query((query) => {
                    for (const item of term) {
                        query.term(item.value, {
                            wildcard: item.wildcard,
                            presence: item.presence,
                        });
                    }
                })
                    .slice(0, searchResultLimits)
                    // Remove duplicated results.
                    .filter((result) => !results.some((item) => item.document.i.toString() === result.ref))
                    .slice(0, searchResultLimits - results.length)
                    .map((result) => {
                    const document = documents.find((doc) => doc.i.toString() === result.ref);
                    return {
                        document,
                        type,
                        page: type !== SearchDocumentType.Title &&
                            wrappedIndexes[0].documents.find((doc) => doc.i === document.p),
                        metadata: result.matchData.metadata,
                        tokens,
                        score: result.score,
                    };
                }));
                if (results.length >= searchResultLimits) {
                    break search;
                }
            }
        }
        sortSearchResults(results);
        processTreeStatusOfSearchResults(results);
        return results;
    }
}
async function legacyFetchIndexes(baseUrl, searchContext) {
    const url = `${baseUrl}${searchIndexUrl.replace("{dir}", searchContext ? `-${searchContext.replace(/\//g, "-")}` : "")}`;
    // Catch potential attacks.
    const fullUrl = new URL(url, 'https://cdnd.selectdb.com');
    console.log('url',url);
    console.log('fullUrl',fullUrl);
    console.log('location.origin',location.origin);
    
    // if (fullUrl.origin !== location.origin) {
    //     throw new Error("Unexpected version url");
    // }
    const json = (await (await fetch(fullUrl)).json());
    const wrappedIndexes = json.map(({ documents, index }, type) => ({
        type: type,
        documents,
        index: lunr.Index.load(index),
    }));
    const zhDictionary = json.reduce((acc, item) => {
        for (const tuple of item.index.invertedIndex) {
            if (/\p{Unified_Ideograph}/u.test(tuple[0][0])) {
                acc.add(tuple[0]);
            }
        }
        return acc;
    }, new Set());
    return {
        wrappedIndexes,
        zhDictionary: Array.from(zhDictionary),
    };
}
Comlink.expose(SearchWorker);
