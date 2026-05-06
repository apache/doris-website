import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { applyFilter } from './glossaryFilter';
import type { GlossaryEntry } from './glossaryFilter';

const TAG_QUERY_KEY = 'tag';

function parseTagsFromUrl(search: string): string[] {
    const params = new URLSearchParams(search);
    const raw = params.get(TAG_QUERY_KEY);
    if (!raw) return [];
    return Array.from(new Set(raw.split(',').filter(Boolean)));
}

function buildUrlSearch(currentSearch: string, tags: string[]): string {
    const params = new URLSearchParams(currentSearch);
    if (tags.length === 0) {
        params.delete(TAG_QUERY_KEY);
    } else {
        params.set(TAG_QUERY_KEY, tags.join(','));
    }
    const out = params.toString();
    return out ? `?${out}` : '';
}

export function useGlossaryFilters(entries: GlossaryEntry[]) {
    const history = useHistory();
    const location = useLocation();

    const [activeTags, setActiveTags] = useState<string[]>(() => parseTagsFromUrl(location.search));
    const [searchQuery, setSearchQuery] = useState('');

    // Keep state in sync with back/forward navigation
    useEffect(() => {
        const fromUrl = parseTagsFromUrl(location.search);
        setActiveTags(prev => {
            if (prev.length === fromUrl.length && prev.every(t => fromUrl.includes(t))) return prev;
            return fromUrl;
        });
    }, [location.search]);

    // Push state changes to URL
    const commitTags = useCallback((next: string[]) => {
        setActiveTags(next);
        const newSearch = buildUrlSearch(location.search, next);
        if (newSearch !== location.search) {
            history.replace({ ...location, search: newSearch });
        }
    }, [history, location]);

    const toggleTag = useCallback((tagId: string) => {
        commitTags(
            activeTags.includes(tagId)
                ? activeTags.filter(t => t !== tagId)
                : [...activeTags, tagId]
        );
    }, [activeTags, commitTags]);

    const clearTags = useCallback(() => commitTags([]), [commitTags]);

    const filtered = useMemo(
        () => applyFilter(entries, activeTags, searchQuery),
        [entries, activeTags, searchQuery]
    );

    return {
        activeTags,
        searchQuery,
        setSearchQuery,
        toggleTag,
        clearTags,
        filtered,
    };
}
