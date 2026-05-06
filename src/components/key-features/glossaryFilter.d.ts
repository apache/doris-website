export interface GlossaryEntry {
    slug: string;
    title: string;
    summary?: string;
    tags: string[];
}

export function applyFilter(
    entries: GlossaryEntry[],
    activeTags: string[],
    searchQuery: string,
): GlossaryEntry[];
