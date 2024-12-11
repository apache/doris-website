import React from 'react';
import { BestPracticesIcon } from '../components/Icons/best-practices';
import { TechSharingIcon } from '../components/Icons/tech-sharing';
import { ReleaseNoteIcon } from '../components/Icons/release-note';
import { AllBlogIcon } from '../components/Icons/all-blog';
import { TopNewsIcon } from '../components/Icons/top-news';

export const CLOUD_URL = 'http://59.110.229.79/';
// export const CLOUD_URL = 'http://cloud.selectdb.com/';
export const DORIS_DOWNLOAD = 'https://doris.apache.org/downloads/downloads.html';
export const DORIS_GITHUB = 'https://github.com/apache/doris';
export const DORIS_OFFICIAL = 'https://doris.apache.org/';

export const BLOG_TAG_ICONS = {
    'Best Practice': <BestPracticesIcon />,
    'Tech Sharing': <TechSharingIcon />,
    'Release Notes': <ReleaseNoteIcon />,
    'Top News': <TopNewsIcon />,
    All: <AllBlogIcon />,
};

export const VERSIONS = ['1.2', '2.0', '2.1', '3.0', 'dev'];
export const DEFAULT_VERSION = '2.1';