import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { useHistory, useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
import { useAllDocsData } from '@docusaurus/plugin-content-docs/client';
import { fetchIndexesByWorker, searchByWorker } from '@yang1666204/docusaurus-search-local/dist/client/client/theme/searchByWorker'
import { SuggestionTemplate } from './SuggestionTemplate';
import { EmptyTemplate } from './EmptyTemplate';
import {
    Mark,
    searchBarShortcut,
    searchBarShortcutHint,
    searchBarPosition,
    docsPluginIdForPreferredVersion,
    searchContextByPaths,
    hideSearchBarWithNoSearchContext,
    useAllContextsWithNoSearchContext,
} from '../../utils/proxiedGenerated';
import LoadingRing from '../LoadingRing/LoadingRing';
import { VERSIONS } from '@site/src/constant/version';
import styles from './SearchBar.module.css';
import { normalizeContextByPath } from '../../utils/normalizeContextByPath';
import { searchResultLimits } from "../../utils/proxiedGeneratedConstants";
import useIsDocPage from '@site/src/hooks/use-is-doc';
import { debounce } from '@site/src/utils/debounce';
import { getLocalePrefix, normalizePathname } from '@site/src/utils/locale';
import {searchWithLocaleFallback} from '@site/src/utils/searchInput';
import {fetchContextIndexes, searchAcrossContexts} from '@site/src/utils/searchContexts';
import {isTranslatedLocale} from '@site/src/utils/localization';
import {searchIndexBaseUrl} from '@site/src/utils/searchVersion';
import {searchMessages} from '@site/src/utils/searchMessages';
import {docSearchSourceVersion} from '@site/src/utils/searchScopes';

const searchContextsByWorker = searchAcrossContexts(searchByWorker);

async function fetchAutoCompleteJS() {
    const autoCompleteModule = await import('@easyops-cn/autocomplete.js');
    const autoComplete = autoCompleteModule.default;
    if (autoComplete.noConflict) {
        // For webpack v5 since docusaurus v2.0.0-alpha.75
        autoComplete.noConflict();
    } else if (autoCompleteModule.noConflict) {
        // For webpack v4 before docusaurus v2.0.0-alpha.74
        autoCompleteModule.noConflict();
    }
    return autoComplete;
}

const SEARCH_PARAM_HIGHLIGHT = '_highlight';
export default function SearchBar({ handleSearchBarToggle }) {
    const isBrowser = useIsBrowser();
    const location = useLocation();
    const {
        siteConfig: { baseUrl },
        i18n: { currentLocale, defaultLocale, locales },
    } = useDocusaurusContext();
    const [isDocsPage] = useIsDocPage(false);
    const sourceVersions = useAllDocsData()[docsPluginIdForPreferredVersion ?? 'default']?.versions ?? [];
    const sourceOnlyVersion = isTranslatedLocale(currentLocale)
        ? docSearchSourceVersion(location.pathname,sourceVersions,Array.isArray(searchContextByPaths)?searchContextByPaths:[]) : null;
    const versionUrl = isTranslatedLocale(currentLocale) ? baseUrl
        : searchIndexBaseUrl(baseUrl, sourceVersions, {pathname: location.pathname});

    const searchLabel = translate({id: 'theme.SearchBar.label', message: 'Search',
        description: 'The ARIA label and placeholder for search button'});

    const history = useHistory();
    const searchBarRef = useRef(null);
    const sourceSearchRef = useRef(null);
    const indexStateMap = useRef(new Map());
    // Should the input be focused after the index is loaded?
    const focusAfterIndexLoaded = useRef(false);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [inputChanged, setInputChanged] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const search = useRef(null);
    // Bumped on every loadIndex call so a stale call (whose async fetches
    // finished after a newer call started) can abort before wrapping the
    // input with a second autocomplete instance — see #3655 race.
    const loadToken = useRef(0);
    const [searchContext, setSearchContext] = useState('');
    useEffect(() => {
        if (!Array.isArray(searchContextByPaths)) {
            return;
        }
        let nextSearchContext = '';
        // searchContextByPaths is expressed relative to the docs root
        // (e.g. ['docs']), so we must strip both the locale prefix and the
        // /docs/<version>/ version segment before matching. Subtracting
        // versionUrl from the raw pathname is not enough: for a non-default
        // version page the leftover starts with the doc slug (e.g.
        // 'data-operate/...') and never matches 'docs', leaving searchContext
        // empty and fetching the no-context index (which is empty when
        // useAllContextsWithNoSearchContext is false).
        const normalized = normalizePathname(location.pathname, locales);
        const parts = normalized.replace(/^\//, '').split('/').filter(Boolean);
        if (!isTranslatedLocale(currentLocale) && parts[0] === 'docs' && parts.length > 1 && VERSIONS.includes(parts[1])) {
            parts.splice(1, 1);
        }
        const uri = parts.join('/');
        let matchedPath;
        for (const _path of searchContextByPaths) {
            const path = typeof _path === 'string' ? _path : _path.path;
            if (uri === path || uri.startsWith(`${path}/`)) {
                matchedPath = path;
                break;
            }
        }
        if (matchedPath) {
            nextSearchContext = matchedPath;
        }
        setSearchContext(nextSearchContext);
    }, [location.pathname, locales, currentLocale]);
    const hidden = !!hideSearchBarWithNoSearchContext && Array.isArray(searchContextByPaths) && searchContext === '';
    const indexKey = `${versionUrl}:${searchContext}`;

    useEffect(() => {
        setLoadError(false);
        setLoading(false);
        return () => {
            ++loadToken.current;
            indexStateMap.current.clear();
            search.current?.autocomplete.destroy();
            search.current = null;
        };
    }, [versionUrl, searchContext, sourceOnlyVersion]);

    const loadIndex = useCallback(
        async (forceLoad = false) => {
            if (sourceOnlyVersion || hidden || (indexStateMap.current.get(indexKey) && !forceLoad)) {
                // Do not load the index (again) if its already loaded or in the process of being loaded.
                return;
            }
            const myToken = ++loadToken.current;
            indexStateMap.current.set(indexKey, 'loading');
            search.current?.autocomplete.destroy();
            search.current = null;
            setLoading(true);
            setLoadError(false);
            let autoComplete;
            try {
                [autoComplete] = await Promise.all([
                    fetchAutoCompleteJS(),
                    fetchContextIndexes(fetchIndexesByWorker, versionUrl, searchContext),
                ]);
            } catch {
                if (myToken !== loadToken.current) return;
                indexStateMap.current.delete(indexKey);
                setLoading(false);
                setLoadError(true);
                return;
            }
            if (myToken !== loadToken.current || !searchBarRef.current) {
                // Superseded by a newer loadIndex; don't mount a second autocomplete on the same input.
                return;
            }
            const searchFooterLinkElement = ({ query, isEmpty }) => {
                const a = document.createElement('a');
                const params = new URLSearchParams();
                params.set('q', query);
                let linkText;
                if (searchContext) {
                    const detailedSearchContext =
                        searchContext && Array.isArray(searchContextByPaths)
                            ? searchContextByPaths.find(item =>
                                  typeof item === 'string' ? item === searchContext : item.path === searchContext,
                              )
                            : searchContext;
                    const translatedSearchContext = detailedSearchContext
                        ? normalizeContextByPath(detailedSearchContext, currentLocale).label
                        : searchContext;
                    if (useAllContextsWithNoSearchContext && isEmpty) {
                        linkText = translate(
                            {
                                id: 'theme.SearchBar.seeAllOutsideContext',
                                message: 'See all results outside "{context}"',
                            },
                            { context: translatedSearchContext },
                        );
                    } else {
                        linkText = translate(
                            {
                                id: 'theme.SearchBar.searchInContext',
                                message: 'See all results within "{context}"',
                            },
                            { context: translatedSearchContext },
                        );
                    }
                } else {
                    linkText = translate({
                        id: 'theme.SearchBar.seeAll',
                        message: 'See all results',
                    });
                }
                if (
                    searchContext &&
                    Array.isArray(searchContextByPaths) &&
                    (!useAllContextsWithNoSearchContext || !isEmpty)
                ) {
                    params.set('ctx', searchContext);
                }
                if (!isTranslatedLocale(currentLocale) && versionUrl !== baseUrl) {
                    if (!versionUrl.startsWith(baseUrl)) {
                        throw new Error(
                            `Version url '${versionUrl}' does not start with base url '${baseUrl}', this is a bug of \`@yang1666204/docusaurus-search-local\`, please report it.`,
                        );
                    }
                    params.set('version', versionUrl.substring(baseUrl.length));
                }
                const url = `${baseUrl}search/?${params.toString()}`;
                a.href = url;
                a.textContent = linkText;
                a.addEventListener('click', e => {
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        search.current?.autocomplete.close();
                        history.push(url);
                    }
                });
                return a;
            };
            const pendingQuery = searchBarRef.current.value;
            search.current = autoComplete(
                searchBarRef.current,
                {
                    hint: false,
                    autoselect: true,
                    openOnFocus: true,
                    cssClasses: {
                        root: clsx(styles.searchBar, {
                            [styles.searchBarLeft]: searchBarPosition === 'left',
                        }),
                        noPrefix: true,
                        dropdownMenu: clsx(
                            {
                                [styles.mobileDropdownMenu]: document.body.clientWidth < 996,
                            },
                            styles.dropdownMenu,
                        ),
                        input: styles.input,
                        hint: styles.hint,
                        suggestions: styles.suggestions,
                        suggestion: styles.suggestion,
                        cursor: styles.cursor,
                        dataset: styles.dataset,
                        empty: styles.empty,
                    },
                },
                [
                    {
                        source: debounce(async (input, callback) => {
                            try {
                                const result = await searchWithLocaleFallback(searchContextsByWorker, versionUrl, searchContext, input, searchResultLimits);
                                callback(result);
                            } catch {
                                if (myToken !== loadToken.current) return;
                                indexStateMap.current.delete(indexKey);
                                setLoadError(true);
                                callback([]);
                            }
                        }, 300),
                        templates: {
                            suggestion: SuggestionTemplate,
                            empty: EmptyTemplate,
                            footer: ({ query, isEmpty }) => {
                                if (isEmpty && (!searchContext || !useAllContextsWithNoSearchContext)) {
                                    return;
                                }
                                const a = searchFooterLinkElement({ query, isEmpty });
                                const div = document.createElement('div');
                                div.className = styles.hitFooter;
                                div.appendChild(a);
                                return div;
                            },
                        },
                    },
                ],
            )
                .on('autocomplete:selected', function (event, { document: { u, h }, tokens }) {
                    searchBarRef.current?.blur();
                    let url = u;
                    if (Mark && tokens.length > 0) {
                        const params = new URLSearchParams();
                        for (const token of tokens) {
                            params.append(SEARCH_PARAM_HIGHLIGHT, token);
                        }
                        url += `?${params.toString()}`;
                    }
                    if (h) {
                        url += h;
                    }
                    history.push(url);
                })
                .on('autocomplete:closed', () => {
                    searchBarRef.current?.blur();
                });
            // Autocomplete was not listening while its index loaded. Replay
            // the current input so the user's first query needs no extra key.
            if (pendingQuery) {
                search.current.autocomplete.setVal('');
                search.current.autocomplete.setVal(pendingQuery);
            }
            indexStateMap.current.set(indexKey, 'done');
            setLoading(false);
            if (focusAfterIndexLoaded.current) {
                const input = searchBarRef.current;
                if (input.value) {
                    search.current?.autocomplete.open();
                }
                input.focus();
            }
        },
        [hidden, indexKey, searchContext, versionUrl, baseUrl, history, sourceOnlyVersion],
    );
    useEffect(() => {
        if (!Mark) {
            return;
        }
        const keywords = isBrowser ? new URLSearchParams(location.search).getAll(SEARCH_PARAM_HIGHLIGHT) : [];
        // A workaround to fix an issue of highlighting in code blocks.
        // See https://github.com/easyops-cn/docusaurus-search-local/issues/92
        // Code blocks will be re-rendered after this `useEffect` ran.
        // So we make the marking run after a macro task.
        setTimeout(() => {
            const root = document.querySelector('article');
            if (!root) {
                return;
            }
            const mark = new Mark(root);
            mark.unmark();
            if (keywords.length !== 0) {
                // Search tokens normalize ё to е; preserve both spellings
                // when highlighting the original Russian document.
                mark.mark(keywords, currentLocale === 'ru' ? {synonyms: {'е': 'ё'}} : {});
            }
            // Apply any keywords to the search input so that we can clear marks in case we loaded a page with a highlight in the url
            setInputValue(keywords.join(' '));
            search.current?.autocomplete.setVal(keywords.join(' '));
        });
    }, [isBrowser, location.search, location.pathname, currentLocale]);
    const [focused, setFocused] = useState(false);
    const onInputFocus = useCallback(() => {
        focusAfterIndexLoaded.current = true;
        loadIndex();
        setFocused(true);
        handleSearchBarToggle?.(true);
    }, [handleSearchBarToggle, loadIndex]);
    const onInputBlur = useCallback(
        e => {
            if (document.body.clientWidth < 996 && e.code === 'Enter') {
                return;
            }
            setFocused(false);
            handleSearchBarToggle?.(false);
        },
        [handleSearchBarToggle],
    );
    const onInputMouseEnter = useCallback(() => {
        loadIndex();
    }, [loadIndex]);
    const onInputChange = useCallback(event => {
        setInputValue(event.target.value);
        if (event.target.value) {
            setInputChanged(true);
        }
    }, []);

    // Implement hint icons for the search shortcuts on mac and the rest operating systems.
    const isMac = isBrowser ? /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform) : false;

    useEffect(() => {
        // On mount the page's search context is not resolved yet, and an empty
        // one can load the wrong index or every index. Leave outside-context
        // search to focus or hover, including the source-language search page.
        if (!searchContext) {
            return;
        }
        loadIndex(true);
    }, [loadIndex, searchContext]);
    useEffect(() => {
        if (!searchBarShortcut) {
            return;
        }
        // Add shortcuts command/ctrl + K
        const handleShortcut = event => {
            if ((isMac ? event.metaKey : event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
                event.preventDefault();
                if(sourceOnlyVersion) {sourceSearchRef.current?.focus();return;}
                searchBarRef.current?.focus();
                onInputFocus();
            }
        };
        document.addEventListener('keydown', handleShortcut);
        return () => {
            document.removeEventListener('keydown', handleShortcut);
        };
    }, [isMac, onInputFocus, sourceOnlyVersion]);
    useEffect(() => {
        if (inputValue) {
            const inputDoms = document.getElementsByClassName('navbar__search-input');
            let inputDom = null;
            for (let input of inputDoms) {
                if (input.getAttribute('value')) {
                    inputDom = input;
                }
            }
            if (inputDom) {
                const suggestionsContainer = inputDom.parentNode?.lastElementChild?.firstChild;
                if (suggestionsContainer) {
                    suggestionsContainer.addEventListener('click', () => {
                        setInputValue('');
                    });
                }
            }
        }
    }, [inputValue]);

    const onClearSearch = useCallback(() => {
        const params = new URLSearchParams(location.search);
        params.delete(SEARCH_PARAM_HIGHLIGHT);
        const paramsStr = params.toString();
        const searchUrl = location.pathname + (paramsStr != '' ? `?${paramsStr}` : '') + location.hash;
        if (searchUrl != location.pathname + location.search + location.hash) {
            history.push(searchUrl);
        }
        // We always clear these here because in case no match was selected the above history push wont happen
        setInputValue('');
        search.current?.autocomplete.setVal('');
    }, [location.pathname, location.search, location.hash, history]);

    if(sourceOnlyVersion) {
        const sourceBase=baseUrl.endsWith('/'+currentLocale+'/')?baseUrl.slice(0,-(currentLocale.length+1)):baseUrl;
        const params=new URLSearchParams({ctx:'docs',version:'docs/'+sourceOnlyVersion+'/'});
        if(inputValue)params.set('q',inputValue);
        return <div className={clsx('navbar__search',styles.searchBarContainer)}>
            <a ref={sourceSearchRef} className={styles.searchSourceLink} href={`${sourceBase}search/?${params}`} hrefLang="en"
                title={searchMessages(currentLocale).sourceOnly} data-source-search={sourceOnlyVersion}>
                {translate({id:'theme.SearchPage.searchSource',message:'Search the source documents'})} ({sourceOnlyVersion})
            </a>
        </div>;
    }

    return (
        <div
            className={clsx('navbar__search', styles.searchBarContainer, {
                [styles.searchIndexLoading]: loading && inputChanged,
                [styles.focused]: focused,
            })}
            hidden={hidden}
            aria-busy={loading || undefined}
            // Manually make the search bar be LTR even if in RTL
            dir="ltr"
        >
            <input
                placeholder={searchLabel}
                aria-label={searchLabel}
                className={clsx('navbar__search-input', styles.navbarSearchInput)}
                onMouseEnter={onInputMouseEnter}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                onChange={onInputChange}
                ref={searchBarRef}
                value={inputValue}
            />
            <LoadingRing className={styles.searchBarLoadingRing} />
            {loadError && <div className={styles.searchLoadError} role="status">
                <span>{searchMessages(currentLocale).error}</span>
                <button type="button" onClick={() => loadIndex(true)}>
                    {searchMessages(currentLocale).retry}
                </button>
            </div>}
            {searchBarShortcut &&
                searchBarShortcutHint &&
                (inputValue !== '' ? (
                    <button className={styles.searchClearButton} onClick={onClearSearch}>
                        ✕
                    </button>
                ) : (
                    isBrowser && (
                        <div className={styles.searchHintContainer}>
                            <kbd
                                className={clsx(styles.searchHint, {
                                    [styles.macFontStyle]: isMac,
                                })}
                            >
                                {isMac ? '⌘' : 'ctrl'}
                            </kbd>
                            <kbd className={styles.searchHint}>K</kbd>
                        </div>
                    )
                ))}
        </div>
    );
}
