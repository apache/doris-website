import React from 'react';
import clsx from 'clsx';
import { useThemeConfig } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { Props } from '@theme/AnnouncementBar/Content';
import styles from './styles.module.css';

export default function AnnouncementBarContent(props: Props): React.ReactElement | null {
    const { announcementBar } = useThemeConfig();
    const { i18n } = useDocusaurusContext();
    const { currentLocale } = i18n;
    const { content } = announcementBar!;

    return (
        <div
            {...props}
            className={clsx(styles.content, props.className)}
            // Developer provided the HTML, so assume it's safe.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
                __html: currentLocale === 'en' ? JSON.parse(content).en : JSON.parse(content).zh,
            }}
        />
    );
}
