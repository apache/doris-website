export interface BlogSearchItem {
    frontMatter?: {
        title?: string;
        summary?: string;
        description?: string;
        author?: string | { name?: string };
        authors?: Array<string | { name?: string }>;
        tags?: Array<string | { label?: string; name?: string }>;
        keywords?: string | Array<string | { label?: string; name?: string }>;
    };
    metadata?: {
        title?: string;
        authors?: Array<string | { name?: string }>;
        tags?: Array<string | { label?: string; name?: string }>;
    };
}

export function normalizeSearchValue(value: unknown): string;
export function getBlogSearchText(blog: BlogSearchItem): string;
export function matchesBlogSearch(blog: BlogSearchItem, query: string): boolean;
export function filterBlogs<T extends BlogSearchItem>(blogs: T[], query: string): T[];
