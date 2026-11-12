import React from 'react';
import Original from '@theme-original/BlogTagsPostsPage';
import type {Props} from '@theme/BlogTagsPostsPage';
import {blogCategoryLabel} from '@site/src/utils/blogLocale';
export default function BlogTagsPostsPage(props: Props) {
    return <Original {...props} tag={{...props.tag, label: blogCategoryLabel(props.tag.label)}} />;
}
