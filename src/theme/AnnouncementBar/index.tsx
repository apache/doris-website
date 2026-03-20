import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useAnnouncementBar } from '@docusaurus/theme-common/internal';
import AnnouncementBarCloseButton from '@theme/AnnouncementBar/CloseButton';
import AnnouncementBarContent from '@theme/AnnouncementBar/Content';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import { isDocsPath } from '@site/src/utils/locale';

import styles from './styles.module.css';

export default function AnnouncementBar(): React.ReactElement | null {
    const { announcementBar } = useThemeConfig();
    const { isActive, close } = useAnnouncementBar();
    const { i18n } = useDocusaurusContext();
    const { currentLocale, locales } = i18n;
    const location = useLocation();
    const { backgroundColor, textColor, isCloseable, content } = announcementBar!;
    const contentMap = JSON.parse(content);
    const localeContent = currentLocale === 'zh-CN' ? contentMap.zh : contentMap.en;
    
    if (!isActive || !localeContent) {
        return null;
    }
    return (
        <div
            className={styles.announcementBar}
            style={
                isDocsPath(location.pathname, locales)
                    ? { backgroundColor, color: textColor }
                    : { display: 'none' }
            }
            role="banner"
        >
            {isCloseable && <div className={styles.announcementBarPlaceholder} />}
            <AnnouncementBarContent className={styles.announcementBarContent} />
            {isCloseable && <AnnouncementBarCloseButton onClick={close} className={styles.announcementBarClose} />}
        </div>
    );
}
