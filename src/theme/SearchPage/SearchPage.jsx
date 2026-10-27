import React, { useCallback, useEffect, useMemo, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import { translate } from "@docusaurus/Translate";
import { usePluralForm } from "@docusaurus/theme-common";
import { useAllDocsData } from "@docusaurus/plugin-content-docs/client";
import clsx from "clsx";
import useSearchQuery from "../../hooks/use-search-query";
import { fetchIndexesByWorker, searchByWorker } from '@yang1666204/docusaurus-search-local/dist/client/client/theme/searchByWorker'
import { SearchDocumentType, } from "../../../shared/interfaces";
import { highlight } from "../../utils/highlight";
import { highlightStemmed } from "../../utils/highlightStemmed";
import { getStemmedPositions } from "../../utils/getStemmedPositions";
import LoadingRing from "../LoadingRing/LoadingRing";
import { concatDocumentPath } from "../../utils/concatDocumentPath";
import { Mark, searchContextByPaths, useAllContextsWithNoSearchContext, docsPluginIdForPreferredVersion } from "../../utils/proxiedGenerated";
import { searchResultLimits } from "../../utils/proxiedGeneratedConstants";
import styles from "./SearchPage.module.css";
import { normalizeContextByPath } from "../../utils/normalizeContextByPath";
import {searchWithLocaleFallback} from "../../utils/searchInput";
import {fetchContextIndexes, searchAcrossContexts} from "../../utils/searchContexts";
import {isTranslatedLocale} from "../../utils/localization";
import {searchIndexBaseUrl} from "../../utils/searchVersion";
import {searchMessages} from "../../utils/searchMessages";
import {convertSearchParams} from "../../utils/searchScopes";
const searchContextsByWorker = searchAcrossContexts(searchByWorker);
export default function SearchPage() {
    return (<Layout>
      <SearchPageContent />
    </Layout>);
}
function SearchPageContent() {
    const { siteConfig: { baseUrl,customFields }, i18n: { currentLocale }, } = useDocusaurusContext();
    const isBrowser = useIsBrowser();
    const { selectMessage } = usePluralForm();
    const sourceVersions = useAllDocsData()[docsPluginIdForPreferredVersion ?? 'default']?.versions ?? [];
    const { searchValue, searchContext, searchVersion, sourceOnlyVersion, updateSearchPath, updateSearchContext, queryParams, hash } = useSearchQuery({
        contexts:Array.isArray(searchContextByPaths)?searchContextByPaths:[],versions:sourceVersions,managed:isTranslatedLocale(currentLocale)});
    const [searchQuery, setSearchQuery] = useState(searchValue);
    const [searchResults, setSearchResults] = useState();
    const [searchWorkerReady, setSearchWorkerReady] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [retry, setRetry] = useState(0);
    const versionUrl = isTranslatedLocale(currentLocale) ? baseUrl
        : searchIndexBaseUrl(baseUrl, sourceVersions, {versionPath: searchVersion});
    const pageTitle = useMemo(() => searchQuery
        ? translate({
            id: "theme.SearchPage.existingResultsTitle",
            message: 'Search results for "{query}"',
            description: "The search page title for non-empty query",
        }, {
            query: searchQuery,
        })
        : translate({
            id: "theme.SearchPage.emptyResultsTitle",
            message: "Search the documentation",
            description: "The search page title for empty query",
        }), [searchQuery]);
    useEffect(() => {
        updateSearchPath(searchQuery);
        // `updateSearchPath` should not be in the deps,
        // otherwise will cause call stack overflow.
    }, [searchQuery]);
    const handleSearchInputChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);
    useEffect(() => {
        if (searchValue && searchValue !== searchQuery) {
            setSearchQuery(searchValue);
        }
    }, [searchValue]);
    // The source index lives at the site root, so drop this locale's prefix.
    const sourceBaseUrl = isTranslatedLocale(currentLocale)
        ? baseUrl.replace(new RegExp(`${currentLocale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/$`), '')
        : baseUrl;
    const sourceParams=new URLSearchParams(queryParams);
    if(searchQuery)sourceParams.set('q',searchQuery);else sourceParams.delete('q');
    const sourceContexts=customFields?.searchContexts?.source ?? ['docs','community','course','releases'];
    const englishSearch = `${sourceBaseUrl}search/?${convertSearchParams(sourceParams,
        {contexts:sourceContexts,versions:sourceVersions,managed:false}).toString()}${hash}`;
    useEffect(() => {
        let active = true;
        setLoadError(false);
        setSearchWorkerReady(false);
        setSearchResults(undefined);
        async function doFetchIndexes() {
            try {
                if(sourceOnlyVersion) {if(active)setSearchWorkerReady(true);return;}
                if (!Array.isArray(searchContextByPaths) ||
                    searchContext ||
                    useAllContextsWithNoSearchContext) {
                    await fetchContextIndexes(fetchIndexesByWorker, versionUrl, searchContext);
                }
                if (searchQuery) {
                    const results = await searchWithLocaleFallback(searchContextsByWorker, versionUrl, searchContext, searchQuery, searchResultLimits);
                    if (active) setSearchResults(results);
                }
                if (active) setSearchWorkerReady(true);
            } catch {
                if (active) setLoadError(true);
            }
        }
        // The context comes from the query string, which is only read in the
        // browser; before that an empty one would load every context index.
        if (isBrowser) {
            doFetchIndexes();
        }
        return () => {active = false;};
    }, [isBrowser, searchContext, versionUrl, searchQuery, retry, sourceOnlyVersion]);
    return (<React.Fragment>
      <Head>
        {/*
         We should not index search pages
          See https://github.com/facebook/docusaurus/pull/3233
        */}
        <meta name="robots" content="noindex, follow"/>
        <title>{pageTitle}</title>
      </Head>

      <div className="container margin-vert--lg">
        <h1>{pageTitle}</h1>

        <div className="row">
          <div className={clsx("col", {
            [styles.searchQueryColumn]: Array.isArray(searchContextByPaths),
            "col--9": Array.isArray(searchContextByPaths),
            "col--12": !Array.isArray(searchContextByPaths),
        })}>
            <input type="search" name="q" className={styles.searchQueryInput} aria-label={translate({id: 'theme.SearchBar.label', message: 'Search'})} onChange={handleSearchInputChange} value={searchQuery} autoComplete="off" autoFocus/>
          </div>
          {Array.isArray(searchContextByPaths) ? (<div className={clsx("col", "col--3", "padding-left--none", styles.searchContextColumn)}>
              <select name="search-context" className={styles.searchContextInput} aria-label={translate({id: 'site.search.context', message: 'Search context'})} id="context-selector" value={sourceOnlyVersion?'docs/'+sourceOnlyVersion:searchContext} onChange={(e) => updateSearchContext(e.target.value)}>
                {sourceOnlyVersion&&<option value={'docs/'+sourceOnlyVersion} disabled>{sourceOnlyVersion} · {searchMessages(currentLocale).sourceOnly}</option>}
                {useAllContextsWithNoSearchContext && (<option value="">
                    {translate({
                    id: "theme.SearchPage.searchContext.everywhere",
                    message: "Everywhere",
                })}
                  </option>)}
                {searchContextByPaths.map((context) => {
                const { label, path } = normalizeContextByPath(context, currentLocale);
                return (<option key={path} value={path}>
                      {label}
                    </option>);
            })}
              </select>
            </div>) : null}
        </div>

        {sourceOnlyVersion&&<p role="note">{searchMessages(currentLocale).sourceOnly}{' '}
            <a href={englishSearch} hrefLang="en">{translate({id:'theme.SearchPage.searchSource',message:'Search the source documents'})}</a>
        </p>}

        {!searchWorkerReady && !loadError && searchQuery && (<div>
            <LoadingRing />
          </div>)}
        {loadError && <p role="status">
            {searchMessages(currentLocale).error}{' '}
            <button type="button" className="button button--secondary button--sm" onClick={() => setRetry(value => value + 1)}>
                {searchMessages(currentLocale).retry}
            </button>
        </p>}

        {searchResults &&
            (searchResults.length > 0 ? (<p>
              {selectMessage(searchResults.length, translate({
                    id: "theme.SearchPage.documentsFound.plurals",
                    message: "1 document found|{count} documents found",
                    description: 'Pluralized label for "{count} documents found". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
                }, { count: searchResults.length }))}
            </p>) : process.env.NODE_ENV === "production" ? (<p>
              {translate({
                    id: "theme.SearchPage.noResultsText",
                    message: "No documents were found",
                    description: "The paragraph for empty search result",
                })}
              {isTranslatedLocale(currentLocale) && <> <a href={englishSearch}>{translate({id: 'theme.SearchPage.searchSource', message: 'Search the source documents'})}</a></>}
            </p>) : (<p>
              ⚠️ The search index is only available when you run docusaurus
              build!
            </p>))}

        <section>
          {searchResults &&
            searchResults.map((item) => (<SearchResultItem key={item.document.i} searchResult={item}/>))}
        </section>
      </div>
    </React.Fragment>);
}
function SearchResultItem({ searchResult: { document, type, page, tokens, metadata }, }) {
    const isTitle = type === SearchDocumentType.Title;
    const isKeywords = type === SearchDocumentType.Keywords;
    const isDescription = type === SearchDocumentType.Description;
    const isDescriptionOrKeywords = isDescription || isKeywords;
    const isTitleRelated = isTitle || isDescriptionOrKeywords;
    const isContent = type === SearchDocumentType.Content;
    const pathItems = (isTitle ? document.b : page.b).slice();
    const articleTitle = (isContent || isDescriptionOrKeywords ? document.s : document.t);
    if (!isTitleRelated) {
        pathItems.push(page.t);
    }
    let search = "";
    if (Mark && tokens.length > 0) {
        const params = new URLSearchParams();
        for (const token of tokens) {
            params.append("_highlight", token);
        }
        search = `?${params.toString()}`;
    }
    return (<article className={styles.searchResultItem}>
      <h2>
        <Link to={document.u + search + (document.h || "")} dangerouslySetInnerHTML={{
            __html: isContent || isDescriptionOrKeywords
                ? highlight(articleTitle, tokens)
                : highlightStemmed(articleTitle, getStemmedPositions(metadata, "t"), tokens, 100),
        }}></Link>
      </h2>
      {pathItems.length > 0 && (<p className={styles.searchResultItemPath}>
          {concatDocumentPath(pathItems)}
        </p>)}
      {(isContent || isDescription) && (<p className={styles.searchResultItemSummary} dangerouslySetInnerHTML={{
                __html: highlightStemmed(document.t, getStemmedPositions(metadata, "t"), tokens, 100),
            }}/>)}
    </article>);
}
