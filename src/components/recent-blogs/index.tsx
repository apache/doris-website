import React from 'react';
import { RECENT_BLOGS_POSTS } from './recent-blogs.data';
import Link from '@docusaurus/Link';
import LinkWithArrow from '@site/src/components/link-arrow';
import {translate} from '@docusaurus/Translate';
import {useLocalizedRoute} from '@site/src/utils/useLocalizedRoute';

export default function RecentBlogs() {
    const localize = useLocalizedRoute();
    return (
        <div className="pl-4 mt-20 text-[#1D1D1D] ">
            <div className=" text-[2rem] leading-[3.25rem]">{translate({id: 'blog.recent', message: 'Recent posts (English)'})}</div>
            <div className="mt-4 flex flex-col">
                {RECENT_BLOGS_POSTS.map(({ label, link }) => (
                    <Link key={link} lang="en" className="text-lg leading-10 hover:no-underline hover:text-primary" to={link}>
                        {label}
                    </Link>
                ))}
            </div>
            <LinkWithArrow className="mt-4" to={localize('/blog/').href} text={translate({id: 'blog.viewAll', message: 'View all blogs'})} />
        </div>
    );
}
