import React from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type { Props } from '@theme/TOC';

import styles from './styles.module.css';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import { ExternalLinkArrowIcon } from '../../components/Icons/external-link-arrow-icon';

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({ className, ...props }: Props): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;
    return (
        <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
            {/* {isCN ? (
                <Link
                    className={clsx(styles.bgCustomGradient, "ml-4 mb-8 text-sm flex items-center hover:no-underline border border-[#aac8d6] rounded-md")}
                    href="https://hdxu.cn/S44O0"
                    target="_blank"
                >
                    <div className="px-2 grid gap-1">
                        <span className="block">8 月 3 日 Apache Doris x 腾讯云 Meetup 深圳站限时免费参加🔥</span>
                        <span>立即报名<span className="ml-1"><ExternalLinkArrowIcon /></span></span>
                    </div>
                </Link>
            ) : ( */}
                <Link
                    className="ml-4 mb-8 flex items-center hover:no-underline"
                    href={isCN ? 'https://ask.selectdb.com/' : 'https://github.com/apache/doris/discussions'}
                    target="_blank"
                >
                    <span className="pr-2">{isCN ? '问答论坛' : 'Join Discussion'}</span>
                    <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="8500"
                        id="mx_n_1711090272569"
                        width="16"
                        height="16"
                    >
                        <path
                            d="M522.24 896.512c-25.6 4.608-51.712 7.168-78.336 7.168-79.36 0-157.696-21.504-225.792-62.464l-18.432-10.752-103.936 28.16c-28.672 7.68-54.784-18.432-47.104-47.104l28.16-103.936c-10.752-17.92-17.408-30.208-20.992-36.864C20.992 607.232 3.072 536.064 3.584 463.36c0-243.2 197.12-440.32 440.32-440.32 221.696 0 405.504 164.352 435.712 377.856 90.112 55.808 144.896 154.112 144.896 260.096 0 51.2-12.8 100.352-36.352 144.384-2.048 4.096-6.144 10.752-11.776 20.48l17.408 64c7.68 28.672-18.432 54.784-47.104 47.104l-64-17.408-7.68 4.608c-47.616 28.672-101.888 43.52-157.184 43.52-71.68-0.512-140.8-25.088-195.584-71.168z m95.232-28.672c31.232 15.36 65.536 23.04 100.352 23.04 41.472 0 82.432-11.264 117.76-32.768 2.56-1.536 9.728-5.632 22.016-12.8 8.704-5.12 19.456-6.656 29.184-3.584l14.848 4.096-4.096-14.848c-2.56-10.24-1.536-20.48 4.096-29.696 6.144-10.24 12.288-20.992 18.432-31.232 17.92-33.28 27.136-70.656 27.136-108.544 0-59.904-23.552-117.76-65.536-160.256-13.312 164.352-118.272 303.616-264.192 366.592z m-462.848-155.648l-14.848 54.784 54.784-14.848c9.728-2.56 20.48-1.536 29.184 4.096 18.432 10.752 29.184 16.896 32.768 19.456 56.32 33.792 120.832 51.712 186.88 51.712 200.704 0 363.52-162.816 363.52-363.52s-162.816-363.52-363.52-363.52-363.52 162.816-363.52 363.52c0 60.928 14.848 119.296 43.008 171.52 3.584 7.168 13.312 23.04 27.648 47.616 5.632 8.704 6.656 19.456 4.096 29.184z m448.512-382.976c20.992 0 38.4 16.896 38.4 38.4 0 20.992-16.896 38.4-38.4 38.4H284.16c-20.992 0-38.4-16.896-38.4-38.4 0-20.992 16.896-38.4 38.4-38.4h318.976z m-153.088 191.488c20.992 0 38.4 16.896 38.4 38.4 0 20.992-16.896 38.4-38.4 38.4H284.16c-20.992 0-38.4-16.896-38.4-38.4 0-20.992 16.896-38.4 38.4-38.4h165.888z m0 0"
                            p-id="8501"
                            fill="currentColor"
                        ></path>
                    </svg>
                </Link>
            {/* )} */}
            <span className="ml-4">{!isCN ? 'On This Page' : '本页导航'}</span>
            <TOCItems {...props} linkClassName={LINK_CLASS_NAME} linkActiveClassName={LINK_ACTIVE_CLASS_NAME} />
        </div>
    );
}
