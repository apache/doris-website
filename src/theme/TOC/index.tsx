import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type { Props } from '@theme/TOC';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HomeIcon from '@site/static/images/toc-icon/home.svg';
import PdfIcon from '@site/static/images/toc-icon/pdf.svg';
import GithubIcon from '@site/static/images/toc-icon/github.svg';
import ConcatIcon from '@site/static/images/toc-icon/concat.svg';
import { DOWNLOAD_PDFS } from '@site/src/constant/download.data';
import { VERSIONS } from '@site/src/constant/common';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

function downloadFile(url, filename) {
    var xml = new XMLHttpRequest();
    xml.open('GET', url, true);
    xml.responseType = 'blob';
    xml.onload = function () {
        var url = window.URL.createObjectURL(xml.response);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };
    xml.send();
}

export default function TOC({ className, ...props }: Props): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;
    const DEFAULT_VERSION = '2.1';
    const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION);
    const handleMouseEnter = (id: string) => {
        const dom = document.getElementById(id);
        dom!.style.color = '#444FD9';
        dom!.firstChild!.style.fill = '#444FD9';
    };

    const handleMouseLeave = (id: string) => {
        const dom = document.getElementById(id);
        dom!.style.color = '#1F1F26';
        dom!.firstChild!.style.fill = '#7F7F83';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.includes('zh-CN/docs')
                ? location.pathname.split('/')[2]
                : location.pathname.split('/')[1];
            const secPath = location.pathname.includes('zh-CN/docs')
                ? location.pathname.split('/')[3]
                : location.pathname.split('/')[2];
            if (pathname === 'docs' && VERSIONS.includes(secPath)) {
                setCurrentVersion(secPath);
            } else {
                setCurrentVersion(DEFAULT_VERSION);
            }
        }
    }, [typeof window !== 'undefined' && location.pathname]);

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
                        <span>{isCN ? 'Doris 首页' : 'Doris Homepage'}</span>
                    </div>
                </Link>
                {isCN && ['3.0', '2.0', '2.1'].includes(currentVersion) ? (
                    <div
                        className="toc-icon-content"
                        id="toc-icon-pdf"
                        onClick={() => {
                            const pdfInfo = DOWNLOAD_PDFS.find(item => item.version === currentVersion);
                            downloadFile(pdfInfo.link, pdfInfo.filename);
                        }}
                        onMouseEnter={() => handleMouseEnter('toc-icon-pdf')}
                        onMouseLeave={() => handleMouseLeave('toc-icon-pdf')}
                    >
                        <PdfIcon />
                        <span>{isCN ? '下载 PDF' : 'Download PDF'}</span>
                    </div>
                ) : null}

                {!isCN ? (
                    <Link
                        className="toc-icon-content"
                        to={'https://github.com/apache/doris/discussions'}
                        id="toc-icon-github"
                        onMouseEnter={() => handleMouseEnter('toc-icon-github')}
                        onMouseLeave={() => handleMouseLeave('toc-icon-github')}
                    >
                        <GithubIcon />
                        <span>Ask Questions on Discussion</span>
                    </Link>
                ) : null}
            </div>
            <div>
                <span className="ml-4 title-text">{!isCN ? 'On This Page' : '本页导航'}</span>
                <TOCItems {...props} linkClassName={LINK_CLASS_NAME} linkActiveClassName={LINK_ACTIVE_CLASS_NAME} />
            </div>
        </div>
    );
}
