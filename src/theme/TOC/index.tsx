import React from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type { Props } from '@theme/TOC';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomeIcon from '@site/static/images/toc-icon/home.svg';
import PdfIcon from '@site/static/images/toc-icon/pdf.svg';
import GithubIcon from '@site/static/images/toc-icon/github.svg';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({ className, ...props }: Props): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;

    const handleMouseEnter = (id: string) => {
        const dom = document.getElementById(id);
        dom.style.color = '#444FD9';
        dom.firstChild.style.fill = '#444FD9';
    };

    const handleMouseLeave = (id: string) => {
        const dom = document.getElementById(id);
        dom.style.color = '#1F1F26';
        dom.firstChild.style.fill = '#7F7F83';
    };
    return (
        <div className={clsx(styles.tableOfContents, 'thin-scrollbar', 'toc-container', className)}>
            <div>
                <Link to={'/'}>
                    <div
                        className="toc-icon-content"
                        id="toc-icon-home"
                        onMouseEnter={() => handleMouseEnter('toc-icon-home')}
                        onMouseLeave={() => handleMouseLeave('toc-icon-home')}
                    >
                        <HomeIcon />
                        <span>Doris Homepage</span>
                    </div>
                </Link>
                <Link
                    className="toc-icon-content"
                    id="toc-icon-pdf"
                    onMouseEnter={() => handleMouseEnter('toc-icon-pdf')}
                    onMouseLeave={() => handleMouseLeave('toc-icon-pdf')}
                >
                    <PdfIcon />
                    <span>Download PDF</span>
                </Link>
                <Link
                    className="toc-icon-content"
                    to={isCN ? 'https://ask.selectdb.com/' : 'https://github.com/apache/doris/discussions'}
                    id="toc-icon-github"
                    onMouseEnter={() => handleMouseEnter('toc-icon-github')}
                    onMouseLeave={() => handleMouseLeave('toc-icon-github')}
                >
                    <GithubIcon />
                    <span>Ask Questions on Discussion</span>
                </Link>
            </div>
            <div>
                <span className="ml-4 title-text">{!isCN ? 'On This Page' : '本页导航'}</span>
                <TOCItems {...props} linkClassName={LINK_CLASS_NAME} linkActiveClassName={LINK_ACTIVE_CLASS_NAME} />
            </div>
        </div>
    );
}
