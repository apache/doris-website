import React from 'react';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import LinkWithArrow from '@site/src/components/link-arrow';
import {translate} from '@docusaurus/Translate';
import {useLocalizedRoute} from '@site/src/utils/useLocalizedRoute';

type RecentBlogsData = {
    count: number;
    posts: {title: string; permalink: string; contentLocale: string}[];
};

export default function RecentBlogs() {
    const localize = useLocalizedRoute();
    const {metadata} = useBlogPost();
    const data = usePluginData('recent-blog-posts') as RecentBlogsData | undefined;
    const currentPath = metadata.permalink.replace(/\/+$/, '');
    const posts = data?.posts
        .filter(post => post.permalink.replace(/\/+$/, '') !== currentPath)
        .slice(0, data.count) ?? [];

    if (!posts.length) return null;

    return (
        <section className="pl-4 mt-20 text-[var(--global-colors-text-primary)]" aria-labelledby="recent-blog-posts-title">
            <h2 id="recent-blog-posts-title" className="m-0 text-[2rem] font-normal leading-[3.25rem]">
                {translate({id: 'blog.recent', message: 'Recent posts'})}
            </h2>
            <ul className="mt-4 mb-0 flex list-none flex-col p-0">
                {posts.map(({title, permalink, contentLocale}) => (
                    <li key={permalink}>
                        <Link lang={contentLocale} className="block text-lg leading-10 hover:no-underline hover:text-primary" to={permalink}>
                            {title}
                        </Link>
                    </li>
                ))}
            </ul>
            <LinkWithArrow className="mt-4" to={localize('/blog/').href} text={translate({id: 'blog.viewAll', message: 'View all blogs'})} />
        </section>
    );
}
