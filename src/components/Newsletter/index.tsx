import React from 'react';
import { ComponentProps, JSXElementConstructor } from 'react';
import { ReleaseNoteIcon } from '../Icons/release-note';
import './style.scss';
import Link from '@docusaurus/Link';
import { BLOG_TAG_ICONS } from '@site/src/constant/common';
interface NewsLetterProps extends ComponentProps<'div'> {
    newsList: any[];
}
export default function NewsLetter(props: NewsLetterProps): JSX.Element {
    const { newsList, ...restProps } = props;
    return (
        <div style={{ padding: '0 1rem' }}>
            <div className="newsletter-wrapper container" {...restProps}>
                {newsList.map(news => {
                    return (
                        <div className="newsletter" key={news.title}>
                            <Link to={news.to} style={{ textDecoration: 'none' }}>
                                <span className="newsletter-tag">
                                    {BLOG_TAG_ICONS[news.tag]}
                                    {news.tag}
                                    {news.hot && (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="35"
                                            height="16"
                                            viewBox="0 0 35 16"
                                            fill="none"
                                        >
                                            <path
                                                d="M3.01334 1.29775C3.30607 0.517145 4.05231 0 4.886 0H32.5C33.6046 0 34.5 0.895431 34.5 2V14C34.5 15.1046 33.6046 16 32.5 16H4.886C4.05231 16 3.30607 15.4829 3.01334 14.7022L0.763342 8.70225C0.593554 8.24948 0.593554 7.75052 0.763343 7.29775L3.01334 1.29775Z"
                                                fill="#444FD9"
                                            />
                                            <path
                                                d="M9.5 4H10.484V7.72H15.44V4H16.424V12.568H15.44V8.572H10.484V12.568H9.5V4Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M20.7887 6.196C21.7127 6.196 22.4567 6.508 23.0087 7.156C23.5367 7.768 23.8007 8.536 23.8007 9.472C23.8007 10.396 23.5367 11.164 23.0207 11.764C22.4567 12.412 21.7127 12.736 20.7887 12.736C19.8527 12.736 19.1207 12.412 18.5687 11.764C18.0407 11.164 17.7767 10.396 17.7767 9.472C17.7767 8.536 18.0407 7.768 18.5687 7.156C19.1207 6.508 19.8527 6.196 20.7887 6.196ZM20.7887 7C20.1287 7 19.6127 7.252 19.2527 7.756C18.9167 8.212 18.7607 8.776 18.7607 9.472C18.7607 10.156 18.9167 10.72 19.2527 11.176C19.6127 11.68 20.1287 11.932 20.7887 11.932C21.4367 11.932 21.9527 11.68 22.3367 11.176C22.6607 10.72 22.8287 10.144 22.8287 9.472C22.8287 8.776 22.6607 8.212 22.3367 7.756C21.9527 7.252 21.4367 7 20.7887 7Z"
                                                fill="white"
                                            />
                                            <path
                                                d="M26.704 4.36V6.364H28.24V7.168H26.704V11.116C26.704 11.344 26.74 11.512 26.836 11.608C26.92 11.704 27.076 11.764 27.292 11.764H28.084V12.568H27.148C26.644 12.568 26.272 12.436 26.056 12.172C25.852 11.932 25.756 11.584 25.756 11.116V7.168H24.508V6.364H25.756V4.756L26.704 4.36Z"
                                                fill="white"
                                            />
                                        </svg>
                                    )}
                                </span>
                                <span className="newsletter-title" key={news.id}>
                                    {news.title}
                                </span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
