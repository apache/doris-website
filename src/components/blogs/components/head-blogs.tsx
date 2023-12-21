import React from 'react';
import { IBlog } from '../blogs.type';
import BlogItem from './blog-item';
import BlogListItem from '@site/src/theme/BlogListItem';

function getHeadData() {
    return {
        data: [],
    };
}

export default function HeadBlogs(props) {
    const blogs = props.blogs;
    const topNews = blogs.filter(blog => +blog.frontMatter.order === 1)[0];
    const news = blogs.filter(blog => blog.frontMatter.title !== topNews.frontMatter.title);
    return (
        <>
            <div className="flex lg:flex-row flex-col px-[1rem]">
                <div className="mb-4 lg:mb-0 lg:flex-1 lg:pr-6">
                    <BlogListItem
                        large={true}
                        headBlog={true}
                        frontMatter={topNews.frontMatter}
                        assets={topNews.assets}
                        metadata={topNews.metadata}
                        truncated={topNews.metadata.truncated}
                    />
                </div>
                <ul className="space-y-4 lg:flex-1">
                    {news
                        .filter(BlogPostContent => BlogPostContent.frontMatter.picked)
                        .sort((a, b) => +a.frontMatter.order - +b.frontMatter.order)
                        .map((BlogPostContent, i) => (
                            <BlogListItem
                                headBlog={true}
                                large={false}
                                key={BlogPostContent.metadata.permalink + i}
                                frontMatter={BlogPostContent.frontMatter}
                                assets={BlogPostContent.assets}
                                metadata={BlogPostContent.metadata}
                                truncated={BlogPostContent.metadata.truncated}
                            >
                                <BlogPostContent />
                            </BlogListItem>
                        ))}
                </ul>
            </div>
        </>
    );
}
