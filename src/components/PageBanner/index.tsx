import clsx from 'clsx';
import Link from '@docusaurus/Link';
import React, { ComponentProps, JSXElementConstructor } from 'react';
import './styles.scss';

export interface ButtonProps extends ComponentProps<JSXElementConstructor<any>> {
    label: any;
    link: string | (() => void);
    type: 'primary' | 'ghost' | 'default';
}

interface PageBannerProps extends ComponentProps<JSXElementConstructor<any>> {
    title: any;
    subTitle: any;
    bannerImg: string;
    bannerImgPhone?: string;
    buttons: ButtonProps[];
    className?: string;
}

export default function PageBanner(props: PageBannerProps): JSX.Element {
    const { title, subTitle, bannerImg, bannerImgPhone, buttons, className } = props;

    return (
        <section className={clsx('banner-section', className)}>
            <div className="banner-container container">
                <div className="banner-info mb-10 lg:mb-20">
                    <div className="banner-title-wrap">
                        <div className="banner-title">{title}</div>
                        <div className="banner-sub-title">{subTitle}</div>
                    </div>
                    <div className="banner-buttons">
                        {buttons.map((btn, index) =>
                            typeof btn.link === 'string' ? (
                                <Link
                                    className={clsx('button button--secondary button--lg', btn.type)}
                                    to={btn.link}
                                    key={index}
                                >
                                    {btn.label}
                                </Link>
                            ) : (
                                <div
                                    onClick={btn.link}
                                    className={clsx('button button--secondary button--lg', btn.type)}
                                    key={index}
                                >
                                    {btn.label}
                                    <svg
                                        style={{ display: 'inline-block' }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="19"
                                        height="18"
                                        viewBox="0 0 19 18"
                                        fill="none"
                                    >
                                        <path
                                            d="M10.6251 13.5L15.125 9L10.6251 4.5"
                                            stroke="#444FD9"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M3.87506 9.00055L15.1251 9.00055"
                                            stroke="#444FD9"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
