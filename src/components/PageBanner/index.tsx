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
                <div className="banner-info">
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
                                </div>
                            ),
                        )}
                    </div>
                </div>
                <div className="banner-img-wrap">
                    <img className="banner-img" src={bannerImg} alt="" />
                </div>
            </div>
        </section>
    );
}
