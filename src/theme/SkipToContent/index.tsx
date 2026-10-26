import React from 'react';
import {SkipToContentLink} from '@docusaurus/theme-common';
import styles from './styles.module.scss';

export default function SkipToContent(): React.ReactElement {
    return <SkipToContentLink className={styles.skipToContent} />;
}
