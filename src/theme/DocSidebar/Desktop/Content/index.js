import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useAnnouncementBar, useScrollPosition } from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import DownloadPdf from '@site/static/images/download-pdf.svg';
import DownloadPdfActive from '@site/static/images/download-pdf-active.svg';
import DocSidebarItems from '@theme/DocSidebarItems';
import styles from './styles.module.css';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { DOWNLOAD_PDFS } from '@site/src/constant/download.data';
// import { getLatestVersion } from '../../../../../docusaurus.config';
// import { useActivePluginAndVersion } from '@docusaurus/plugin-content-docs/client';
// import { useGlobalData } from '@docusaurus/useGlobalData';
function useShowAnnouncementBar() {
    const { isActive } = useAnnouncementBar();
    const [showAnnouncementBar, setShowAnnouncementBar] = useState(isActive);

    useScrollPosition(
        ({ scrollY }) => {
            if (isActive) {
                setShowAnnouncementBar(scrollY === 0);
            }
        },
        [isActive],
    );
    return isActive && showAnnouncementBar;
}

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

export default function DocSidebarDesktopContent({ path, sidebar, className }) {
    const showAnnouncementBar = useShowAnnouncementBar();
    const { siteConfig } = useDocusaurusContext()
    const [isDocs, setIsDocs] = useState(true)
    const [isEN, setIsEn] = useState(true)
    const [showVersion, setShowVersion] = useState(false)
    const [isHover, setIshover] = useState(false)
    const DEFAULT_VERSION = '2.1';
    const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION);
    const {
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const tempPath = ['gettingStarted', 'benchmark', 'ecosystem', 'faq', 'releasenotes', 'community'];
            const isShowVersion = tempPath.some(path => location.pathname.includes(path))
            const pathname = location.pathname.includes('zh-CN/docs') ? location.pathname.split('/')[2] : location.pathname.split('/')[1];
            const secPath = location.pathname.includes('zh-CN/docs') ? location.pathname.split('/')[3] : location.pathname.split('/')[2]
            if (pathname === 'docs' && ['dev', '3.0', '2.0', '1.2'].includes(secPath)) {
                setCurrentVersion(secPath);
            } else {
                setCurrentVersion(DEFAULT_VERSION);
            }
            setIsDocs(pathname === 'docs' ? true : false)
            setIsEn(location.pathname.includes('zh-CN') ? false : true)
            setShowVersion(!isShowVersion)
        }
    }, [typeof window !== 'undefined' && location.pathname]);
    return (
        <nav
            aria-label={translate({
                id: 'theme.docs.sidebar.navAriaLabel',
                message: 'Docs sidebar',
                description: 'The ARIA label for the sidebar navigation',
            })}
            className={clsx(
                'menu custom-scrollbar',
                styles.menu,
                showAnnouncementBar && styles.menuWithAnnouncementBar,
                className,
            )}
        >
            <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
                {showVersion && <div className={styles.currentVersion}>
                    {isEN ? 'Version:' : '当前版本:'} {currentVersion}
                    {
                        currentLocale !== 'en' && 
                        ['3.0', '2.0', '2.1'].includes(currentVersion) && (
                            <div onMouseLeave={() => setIshover(false)} onMouseEnter={() => setIshover(true)} className="cursor-pointer" onClick={() => {
                                const pdfInfo = DOWNLOAD_PDFS.find(item => item.version === currentVersion);
                                downloadFile(pdfInfo.link, pdfInfo.filename);
                            }}>
                                {isHover ? <DownloadPdfActive /> : <DownloadPdf />}
                            </div>
                        )
                    }
                </div>}
                <DocSidebarItems items={sidebar} activePath={path} level={1} />
            </ul>
        </nav>
    );
}
