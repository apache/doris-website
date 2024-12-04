import Link from '@docusaurus/Link';
import React from 'react';
import useFormatDate from '@site/src/hooks/use-format-date';

export default function HeadItem(props: any) {
    const {
        permalink,
        large,
        image,
        title,
        summary,
        date,
        authorsExists,
        authors,
        size = 'small',
    } = props;
    if (size === 'small') {
        return (
            <li>
                <Link
                    to={permalink}
                    className="hover:no-underline hover:decoration-none transition-scale relative block rounded-lg border border-[#DFE5F0] px-6 py-5 hover:border-[#0065FD] "
                >
                    <div className=" ">
                        <h1 className="line-clamp-2 text-xl font-medium leading-normal text-black-dark transition group-hover:text-primary">
                            {title}
                        </h1>
                        <div className="mt-4 line-clamp-2 h-11 text-sm leading-relaxed text-[#4C576C] transition group-hover:text-primary">
                            {summary}
                        </div>
                        <div className="mt-4 flex justify-start space-x-2 text-sm  leading-[1.375rem] text-[#8592a6]">
                            <time dateTime={date} itemProp="datePublished" className="mr-4">
                                {useFormatDate(date)}
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
            </li>
        );
    }
    return (
        <Link
            to={permalink}
            className={`hover:no-underline hover:decoration-none transition-scale group relative ${
                large ? 'h-full' : 'h-auto'
            } flex flex-col  `}
        >
            <img
                className="rounded-t-lg border border-b-0 border-[#DFE5F0] group-hover:border-[#0065FD]"
                src={image}
                alt=""
            />
            <div className="rounded-b-lg border border-t-0 border-[#DFE5F0] group-hover:border-[#0065FD] h-full   flex flex-col-reverse justify-between lg:flex-row lg:py-0 py-6 lg:pb-5 lg:space-x-10 px-6">
                <div className="flex-1">
                    <h1 className=" mt-4 line-clamp-2 text-2xl font-medium text-black-dark lg:text-[2rem] lg:leading-[3rem]">
                        {title}
                    </h1>
                    <div className="lg:h-[9.25rem]">
                        <p className="mt-4 line-clamp-2 text-sm leading-[1.6875rem] text-[#666666] lg:text-lg ">
                            {summary}
                        </p>
                    </div>
                    <div className="mt-4 flex space-x-6">
                        <span className="text-sm text-[#8592a6]">
                            <time dateTime={date} itemProp="datePublished" className="mr-4">
                                {useFormatDate(date)}
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
                    </div>
                </div>
            </div>
        </Link>
    );
}
