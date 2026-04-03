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
import { normalizePathname } from '@site/src/utils/locale';
import { Spin } from 'antd';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

// Using a custom className
// This prevents TOCInline/TOCCollapsible getting highlighted by mistake
const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({ className, ...props }: Props): React.ReactElement {
    const {
        i18n: { currentLocale, locales },
    } = useDocusaurusContext();
    const isBrowser = useIsBrowser();
    const locale = currentLocale;
    const isCN = locale === 'zh-CN';
    const uiText =
        locale === 'ja'
            ? {
                  homepage: 'Doris ホーム',
                  downloadPdf: 'PDF をダウンロード',
                  onThisPage: 'このページ',
                  forum: '技術フォーラム',
              }
            : locale === 'zh-CN'
              ? {
                    homepage: 'Doris 首页',
                    downloadPdf: '下载 PDF',
                    onThisPage: '本页导航',
                    forum: '技术论坛',
                }
              : {
                    homepage: 'Doris Homepage',
                    downloadPdf: 'Download PDF',
                    onThisPage: 'On This Page',
                    forum: 'Forum',
                };
    const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION);
    const [loading, setLoading] = useState(false);

    function downloadFileWithLoading(url: string, filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            setLoading(true);
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function () {
                setLoading(false);
                if (xhr.status === 200) {
                    try {
                        const blobUrl = window.URL.createObjectURL(xhr.response);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        a.click();
                        window.URL.revokeObjectURL(blobUrl);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            };
            xhr.onerror = function () {
                setLoading(false);
                reject(new Error('netwo'));
            };
            xhr.ontimeout = function () {
                setLoading(false);
                reject(new Error('timeout'));
            };

            xhr.send();
        });
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const normalizedPathname = normalizePathname(location.pathname, locales);
            const pathname = normalizedPathname.split('/')[1];
            const secPath = normalizedPathname.split('/')[2];
            if (pathname === 'docs' && VERSIONS.includes(secPath)) {
                setCurrentVersion(secPath);
            } else {
                setCurrentVersion(DEFAULT_VERSION);
            }
        }
    }, [locales, typeof window !== 'undefined' && location.pathname]);

    return (
        <div className={clsx(styles.tableOfContents, 'thin-scrollbar', 'toc-container', className)}>
            <div style={isBrowser && location.pathname.startsWith('/blog') ? { display: 'none' } : {}}>
                <Link to={'/'}>
                    <div className="toc-icon-content group">
                        <HomeIcon className="group-hover:text-primary" />
                        <span className="group-hover:text-primary">{uiText.homepage}</span>
                    </div>
                </Link>
                {isCN && ['4.x', '3.x', '2.0', '2.1'].includes(currentVersion) ? (
                    <div
                        className={`${loading ? '!cursor-not-allowed' : 'cursor-pointer'} toc-icon-content group`}
                        onClick={async () => {
                            if (loading) return;
                            const pdfInfo = DOWNLOAD_PDFS.find(item => item.version === currentVersion);
                            await downloadFileWithLoading(pdfInfo.link, pdfInfo.filename);
                        }}
                    >
                        <PdfIcon className="group-hover:text-primary" />
                        <span className={` group-hover:text-primary mr-2`}>{uiText.downloadPdf}</span>
                        <Spin size="small" spinning={loading} />
                    </div>
                ) : null}
                {isCN ? (
                    <Link to={'https://doris-forum.org.cn'}>
                        <div className="toc-icon-content group">
                            <ForumIcon className="group-hover:text-primary" />{' '}
                            <span className="group-hover:text-primary">{uiText.forum}</span>
                        </div>
                    </Link>
                ) : null}
                {!isCN ? (
                    <Link className="toc-icon-content group" to={'https://github.com/apache/doris/discussions'}>
                        <GithubIcon className="group-hover:text-primary" />
                        <span className="group-hover:text-primary">Ask Questions on Discussion</span>
                    </Link>
                ) : null}

                {!isCN ? (
                    <Link
                        className="toc-icon-content group"
                        to={
                            'https://doris.apache.org/slack'
                        }
                    >
                        <div style={{ padding: '2px' }}>
                            <SlackIcon className="group-hover:text-primary" />
                        </div>
                        <span className="group-hover:text-primary">Chat on Slack</span>
                    </Link>
                ) : null}
            </div>
            <div>
                <span className="ml-4 title-text">{uiText.onThisPage}</span>
                <TOCItems {...props} linkClassName={LINK_CLASS_NAME} linkActiveClassName={LINK_ACTIVE_CLASS_NAME} />
            </div>
        </div>
    );
}
