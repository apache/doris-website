/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { useHistory, useLocation } from "@docusaurus/router";
import useIsBrowser from "@docusaurus/useIsBrowser";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { resolveSearchScope } from "../utils/searchScopes";
const SEARCH_PARAM_QUERY = "q";
const SEARCH_PARAM_CONTEXT = "ctx";
const SEARCH_PARAM_VERSION = "version";
function useSearchQuery(scopeOptions) {
    const isBrowser = useIsBrowser();
    const history = useHistory();
    const location = useLocation();
    const { siteConfig: { baseUrl }, } = useDocusaurusContext();
    const params = isBrowser ? new URLSearchParams(location.search) : null;
    const searchValue = params?.get(SEARCH_PARAM_QUERY) || "";
    const scope = resolveSearchScope({context:params?.get(SEARCH_PARAM_CONTEXT) || '',
        version:params?.get(SEARCH_PARAM_VERSION) || ''}, scopeOptions);
    const getSearchParams = (searchValue) => {
        const searchParams = new URLSearchParams(location.search);
        if (searchValue) {
            searchParams.set(SEARCH_PARAM_QUERY, searchValue);
        }
        else {
            searchParams.delete(SEARCH_PARAM_QUERY);
        }
        return searchParams;
    };
    return {
        searchValue,
        searchContext:scope.context,
        searchVersion:scope.version,
        sourceOnlyVersion:scope.sourceOnlyVersion,
        queryParams:params??new URLSearchParams(),
        hash:location.hash,
        updateSearchPath: (searchValue) => {
            const searchParams = getSearchParams(searchValue);
            history.replace({
                pathname:location.pathname,
                search: searchParams.toString(),
                hash:location.hash,
            });
        },
        updateSearchContext: (value) => {
            const searchParams = new URLSearchParams(location.search);
            searchParams.set(SEARCH_PARAM_CONTEXT, value);
            searchParams.delete(SEARCH_PARAM_VERSION);
            history.replace({
                pathname:location.pathname,
                search: searchParams.toString(),
                hash:location.hash,
            });
        },
        generateSearchPageLink: (searchValue) => {
            const searchParams = getSearchParams(searchValue);
            // Refer to https://github.com/facebook/docusaurus/pull/2838
            return `${baseUrl}search?${searchParams.toString()}`;
        },
    };
}
export default useSearchQuery;
