import React from 'react';
import { RECENT_BLOGS_POSTS } from './recent-blogs.data';
import Link from '@docusaurus/Link';
import LinkWithArrow from '@site/src/components/link-arrow';

export default function RecentBlogs() {
    return (
        <div className="pl-4 mt-20 text-[#1D1D1D] ">
            <div className=" text-[2rem] leading-[3.25rem]">Recent posts</div>
            <div className="mt-4 flex flex-col">
                {RECENT_BLOGS_POSTS.map(({ label, link }) => (
                    <Link className="text-lg leading-10 hover:no-underline hover:text-[#444FD9]" to={link}>
                        {label}
                    </Link>
                ))}
            </div>
            <LinkWithArrow className="mt-4" to="/blog" text="View all blogs" />
        </div>
    );
}
