import React from 'react';
import Original from '@theme-original/BlogTagsListPage';
import type {Props} from '@theme/BlogTagsListPage';
import {blogCategoryLabel} from '@site/src/utils/blogLocale';
export default function BlogTagsListPage(props: Props) {
    return <Original {...props} tags={props.tags.map(tag => ({...tag, label: blogCategoryLabel(tag.label)}))} />;
}
