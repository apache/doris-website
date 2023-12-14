import React from 'react';

async function getHeadData() {
    return [];
}

export default function HeadBlog(props: { blogs: any[] }) {
    console.log(props.blogs);
    const blog = props.blogs[0];
    const attributes = blog.attributes;
    // const banner =
    //     attributes.banner.data && attributes.banner.data.attributes ? attributes.banner.data.attributes.url : '';
    const banner = 'https://cdn.selectdb.com/static/1_2release_5a6683fddc.png';
    const categories =
        attributes.categories && attributes.categories.data && attributes.categories.data.length > 0
            ? attributes.categories.data
            : [];
    return (
        <section className="container mx-auto py-8 lg:py-[4rem]">
            <div className="container mx-auto">
                <a href={`/blog/${blog.id}`}>
                    <div className=" flex flex-col-reverse justify-between lg:-mx-4 lg:flex-row lg:space-x-10">
                        <div className="flex-1  lg:pr-20">
                            <div className="mt-4 flex flex-wrap items-center space-x-2 whitespace-nowrap lg:mt-0 lg:space-x-6">
                                {categories.length &&
                                    categories.map((item: any) => (
                                        <span
                                            key={item.attributes.name}
                                            className="rounded-3xl border border-[#DADCE0] px-3 py-1 text-xs lg:text-sm"
                                        >
                                            {item.attributes.name}
                                        </span>
                                    ))}
                            </div>
                            <h1 className=" mt-4 line-clamp-2 text-2xl font-medium text-black-dark lg:text-[2rem] lg:leading-[3rem]">
                                {attributes.title}
                            </h1>
                            <p className="mt-4 line-clamp-2 text-sm leading-[1.6875rem] text-[#666666] lg:text-base">
                                {attributes.summary}
                            </p>
                            <div className="mt-4 flex space-x-6">
                                <span className="text-sm text-[#5F6368CC]">{attributes.author}</span>
                                <span className="text-sm text-[#5F6368CC]">{attributes.date}</span>
                            </div>
                        </div>
                        <image href={''} />
                    </div>
                </a>
            </div>
        </section>
    );
}
