export interface IBlog {
    id: number;
    attributes: IBlogAttributes;
}

export interface IBlogAttributes {
    title: string;
    author: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
    summary: string;
    date: string;
    banner: any;
    tags: any;
    localizations: any;
    categories: any;
}
