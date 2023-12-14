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
    // console.log(blogs);
    const { children, frontMatter, assets, metadata, items, truncated, isBlogPostPage = false } = props;
    // const { date, formattedDate, permalink, tags, readingTime, title, editUrl, authors } = metadata;
    // console.log(props);
    // const { data: blogs }: { data: IBlog[] } = getHeadData();
    // const topNews = blogs.filter(blog => {
    //     if (blog.attributes.tags.data.some((item: any) => item.attributes.uid.includes('blog-banner'))) {
    //         return true;
    //     }
    // })[0];
    const topNews = blogs[0];
    const news = blogs.filter(blog => blog.frontMatter.title !== topNews.frontMatter.title);
    console.log(blogs);
    return (
        <>
            <section className="container relative mx-auto">
                <div className="lg:flex">
                    <div className="mb-4 lg:mb-0 lg:flex-1 lg:pr-6">
                        <BlogListItem
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
                    {/* {items && (
                        <div className="mb-4 lg:mb-0 lg:flex-1 lg:pr-6">
                            <BlogItem large blog={items[0]} />
                        </div>
                    )}
                    <ul className="space-y-4 lg:flex-1">
                        {news.map((item: any) => (
                            <li key={item.id} className="" id={item.id}>
                                {item.attributes && (
                                    <a
                                        href={`/blog/${item.id}`}
                                        className="transition-scale relative block rounded-lg border border-[#DFE5F0] px-6 py-5 hover:border-[#0065FD] "
                                    >
                                        <div className=" ">
                                            <h1 className="line-clamp-2 text-xl font-medium leading-normal text-black-dark transition group-hover:text-primary">
                                                {item.attributes.title}
                                            </h1>
                                            <div className="mt-4 line-clamp-2 h-11 text-sm leading-relaxed text-[#4C576C] transition group-hover:text-primary">
                                                {item.attributes.summary}
                                            </div>
                                            <div className="mt-4 flex justify-start space-x-2 text-sm  leading-[1.375rem] text-[#4C576C]">
                                                <span>{item.attributes.date}</span>
                                                <span>{item.attributes.author}</span>
                                            </div>
                                        </div>
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul> */}
                </div>
            </section>
        </>
    );
}
