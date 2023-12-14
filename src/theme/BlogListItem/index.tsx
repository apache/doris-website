import React from 'react';
import clsx from 'clsx';
import Translate, { translate } from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { usePluralForm } from '@docusaurus/theme-common';
import { blogPostContainerID } from '@docusaurus/utils-common';
import MDXContent from '@theme/MDXContent';
import EditThisPage from '@theme/EditThisPage';
import TagsListInline from '@theme/TagsListInline';
import BlogPostAuthors from '@theme/BlogPostAuthors';
import './styles.scss';
// Very simple pluralization: probably good enough for now
function useReadingTimePlural() {
    const { selectMessage } = usePluralForm();
    return readingTimeFloat => {
        const readingTime = Math.ceil(readingTimeFloat);
        return selectMessage(
            readingTime,
            translate(
                {
                    id: 'theme.blog.post.readingTime.plurals',
                    description:
                        'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
                    message: 'One min read|{readingTime} min read',
                },
                { readingTime },
            ),
        );
    };
}
export default function BlogListItem(props) {
    const readingTimePlural = useReadingTimePlural();
    const { withBaseUrl } = useBaseUrlUtils();
    const { children, frontMatter, assets, metadata } = props;
    const { date, formattedDate, permalink, tags, readingTime, title, editUrl, authors } = metadata;
    const image = assets.image ?? frontMatter.image;
    const tagsExists = tags.length > 0;
    const summary = frontMatter.summary;
    const authorsExists = authors && authors.length > 0;
    const large = false;
    if (props?.headBlog) {
        return (
            <section className="container mx-auto py-8 lg:py-[4rem]">
                <div className="container mx-auto">
                    <Link to={permalink}>
                        <img src={image} alt="" />
                        <div className=" flex hover:decoration-none flex-col-reverse justify-between lg:-mx-4 lg:flex-row lg:space-x-10">
                            <div className="flex-1 lg:pr-20">
                                <h1 className=" mt-4 line-clamp-2 text-2xl font-medium text-black-dark lg:text-[2rem] lg:leading-[3rem]">
                                    {title}
                                </h1>
                                <p className="mt-4 line-clamp-2 text-sm leading-[1.6875rem] text-[#666666] lg:text-base">
                                    {summary}
                                </p>
                                <div className="mt-4 flex space-x-6">
                                    <span className="text-sm text-[#5F6368CC]">
                                        <time dateTime={date} itemProp="datePublished" className="mr-4">
                                            {formattedDate}
                                        </time>
                                        {authorsExists && (
                                            <>
                                                <span className="split-line"></span>
                                                <span className="authors">
                                                    {authors.map((author, i) => (
                                                        <span className="s-author" key={i}>
                                                            {author.name}
                                                        </span>
                                                    ))}
                                                </span>
                                            </>
                                        )}
                                    </span>
                                    {/* <span className="text-sm text-[#5F6368CC]">{attributes.date}</span> */}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>
        );
    }
    return (
        <article itemProp="blogPost" itemScope itemType="http://schema.org/BlogPosting">
            <Link
                itemProp="url"
                to={permalink}
                className="hover:no-underline transition-scale group relative flex h-full flex-col rounded-lg border border-[#DFE5F0] hover:border-[#0065FD] lg:border-0"
            >
                <div
                    className={`relative overflow-hidden rounded-t-lg border-[#DFE5F0] group-hover:border-[#0065FD] lg:border lg:border-b-0 lg:pb-0`}
                    style={{
                        width: '100%',
                        height: '165px',
                    }}
                >
                    <img src={image} alt="" />
                </div>
                <div
                    className={`px-6 ${
                        large ? 'py-6 lg:pt-12' : ' py-6'
                    } flex-1 rounded-b-lg border-[#DFE5F0] group-hover:border-[#0065FD] lg:border lg:border-t-0`}
                >
                    {!large && (
                        <div className="">
                            {tagsExists &&
                                tags.map((tag: any) => (
                                    <span
                                        key={tag.label}
                                        className="mr-4 inline-block rounded-3xl border border-[#DADCE0] px-2 py-1 text-xs leading-normal"
                                    >
                                        {tag.label}
                                    </span>
                                ))}
                        </div>
                    )}
                    <div className={`${large ? 'lg:h-[5.25rem]' : ''} h-12`}>
                        <h1
                            className={`${
                                large ? ' lg:text-[1.75rem] lg:leading-normal' : 'mt-4'
                            } line-clamp-2 break-keep  text-xl font-medium leading-tight text-black-dark transition`}
                        >
                            {title}
                        </h1>
                    </div>
                    <div className={`${large ? 'h-14' : 'h-12'} mt-6 `}>
                        <span
                            className={`${
                                large ? ' lg:text-lg' : '  leading-[1.375rem]'
                            }  line-clamp-2 break-all  text-sm   text-[#4C576C] transition`}
                        >
                            {summary}
                        </span>
                    </div>
                    <div
                        className={`${
                            large ? ' mt-8 lg:text-base' : ' mt-4'
                        }  justify-start space-x-2  text-sm leading-[1.375rem] text-[#4C576C]`}
                    >
                        <time dateTime={date} itemProp="datePublished">
                            {formattedDate}
                        </time>

                        {authorsExists && (
                            <>
                                <span className="split-line"></span>
                                <span className="authors">
                                    {authors.map((author, i) => (
                                        <span className="s-author" key={i}>
                                            {author.name}
                                        </span>
                                    ))}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        </article>
    );
}
