import React from 'react';
import clsx from 'clsx';
import { translate } from '@docusaurus/Translate';
import { usePluralForm } from '@docusaurus/theme-common';
import { useDateTimeFormat } from '@docusaurus/theme-common/internal';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { Props } from '@theme/BlogPostItem/Header/Info';

// Very simple pluralization: probably good enough for now
function useReadingTimePlural() {
    const { selectMessage } = usePluralForm();
    return (readingTimeFloat: number) => {
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

function DateTime({ date, formattedDate }: { date: string; formattedDate: string }) {
    return (
        <time dateTime={date} itemProp="datePublished" className="text-black ml-4">
            {formattedDate}
        </time>
    );
}

export default function BlogPostItemHeaderInfo({ className }: Props): JSX.Element {
    const { metadata } = useBlogPost();
    console.log('metadata', metadata);

    const { date, readingTime, authors } = metadata;

    const formatDate = (blogDate: string) => dateTimeFormat.format(new Date(blogDate));

    const dateTimeFormat = useDateTimeFormat({
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

    const authorsExists = authors && authors.length > 0;
    return (
        <div className="blog-info text-center flex justify-center text-sm text-black">
            {authorsExists && (
                <>
                    <span className="authors">
                        {authors.map((author, i) => (
                            <span className="s-author text-black" key={i}>
                                {author.name}
                            </span>
                        ))}
                    </span>
                </>
            )}
            <DateTime date={date} formattedDate={formatDate(date)} />
        </div>
    );
}
