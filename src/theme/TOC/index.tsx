import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import type { Props } from '@theme/TOC';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { HomeIcon } from '../../components/Icons/home-icon';
import { PdfIcon } from '../../components/Icons/pdf-icon';
import { ForumIcon } from '../../components/Icons/forum-icon';
import { GithubIcon } from '../../components/Icons/github-icon';
import { SlackIcon } from '../../components/Icons/slack-icon';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { DOWNLOAD_PDFS } from '@site/src/constant/download.data';
import { VERSIONS, DEFAULT_VERSION } from '@site/src/constant/version';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export function downloadFile(url: string, filename: string) {
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

export default function TOC({ className, ...props }: Props): React.ReactElement {
    const { siteConfig } = useDocusaurusContext();
    const isBrowser = useIsBrowser();
    const isCN = siteConfig.baseUrl.indexOf('zh-CN') > -1;
    const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION);

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
            <div style={isBrowser && location.pathname.startsWith('/blog') ? { display: 'none' } : {}}>
                <Link to={'/'}>
                    <div className="toc-icon-content group">
                        <HomeIcon className="group-hover:text-[#444FD9]" />
                        <span className="group-hover:text-[#444FD9]">{isCN ? 'Doris 首页' : 'Doris Homepage'}</span>
                    </div>
                </Link>
                {isCN && ['3.0', '2.0', '2.1'].includes(currentVersion) ? (
                    <div
                        className="toc-icon-content group"
                        onClick={() => {
                            const pdfInfo = DOWNLOAD_PDFS.find(item => item.version === currentVersion);
                            downloadFile(pdfInfo.link, pdfInfo.filename);
                        }}
                    >
                        <PdfIcon className="group-hover:text-[#444FD9]" />
                        <span className="group-hover:text-[#444FD9]">{isCN ? '下载 PDF' : 'Download PDF'}</span>
                    </div>
                ) : null}
                {isCN ? (
                    <Link to={'https://doris-forum.org.cn'}>
                        <div className="toc-icon-content group">
                            <ForumIcon className="group-hover:text-[#444FD9]" />{' '}
                            <span className="group-hover:text-[#444FD9]">技术论坛</span>
                        </div>
                    </Link>
                ) : null}
                {!isCN ? (
                    <Link className="toc-icon-content group" to={'https://github.com/apache/doris/discussions'}>
                        <GithubIcon className="group-hover:text-[#444FD9]" />
                        <span className="group-hover:text-[#444FD9]">Ask Questions on Discussion</span>
                    </Link>
                ) : null}

                {!isCN ? (
                    <Link
                        className="toc-icon-content group"
                        to={
                            'https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-35mzao67o-BrpU70FNKPyB6UlgpXf8_w'
                        }
                    >
                        <div style={{ padding: '2px' }}>
                            <SlackIcon className="group-hover:text-[#444FD9]" />
                        </div>
                        <span className="group-hover:text-[#444FD9]">Chat on Slack</span>
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
