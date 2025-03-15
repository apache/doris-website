import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useAnnouncementBar } from '@docusaurus/theme-common/internal';
import AnnouncementBarCloseButton from '@theme/AnnouncementBar/CloseButton';
import AnnouncementBarContent from '@theme/AnnouncementBar/Content';
import { useLocation } from '@docusaurus/router';

import styles from './styles.module.css';

export default function AnnouncementBar(): JSX.Element | null {
    const { announcementBar } = useThemeConfig();
    const { isActive, close } = useAnnouncementBar();
    const location = useLocation();
    if (!isActive) {
        return null;
    }
    const { backgroundColor, textColor, isCloseable } = announcementBar!;
    return (
        <div
            className={styles.announcementBar}
            style={
                location.pathname.startsWith('/zh-CN/docs') || location.pathname.startsWith('/docs')
                    ? { backgroundColor, color: textColor }
                    : { display:'none' }
            }
            role="banner"
        >
            {isCloseable && <div className={styles.announcementBarPlaceholder} />}
            <AnnouncementBarContent className={styles.announcementBarContent} />
            {isCloseable && <AnnouncementBarCloseButton onClick={close} className={styles.announcementBarClose} />}
        </div>
    );
}
