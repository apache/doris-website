import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import TagsListInline from '@theme/TagsListInline';

import EditMetaRow from '@theme/EditMetaRow';

export default function DocItemFooter(): JSX.Element | null {
  const {metadata} = useDoc();
  const {editUrl, lastUpdatedAt, lastUpdatedBy, tags} = metadata;
  const {pluginId, version, isLast} = useDocsVersion();

  // Only surface "last updated" on the Dev and latest-stable (4.x) docs, plus
  // the community docs. Older versions (2.1, 3.x) would show stale dates, so we
  // hide the row there — the timestamp data exists for them, we just don't show
  // it. Kept in sync with which plugins enable showLastUpdateTime in the config.
  const showLastUpdate =
    pluginId === 'community' ||
    (pluginId === 'default' && (version === 'current' || isLast));
  const shownLastUpdatedAt = showLastUpdate ? lastUpdatedAt : undefined;
  const shownLastUpdatedBy = showLastUpdate ? lastUpdatedBy : undefined;

  const canDisplayTagsRow = tags.length > 0;
  const canDisplayEditMetaRow = !!(editUrl || shownLastUpdatedAt || shownLastUpdatedBy);

  const canDisplayFooter = canDisplayTagsRow || canDisplayEditMetaRow;

  if (!canDisplayFooter) {
    return null;
  }

  return (
    <footer
      className={clsx(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      {canDisplayTagsRow && (
        <div
          className={clsx(
            'row margin-top--sm',
            ThemeClassNames.docs.docFooterTagsRow,
          )}>
          <div className="col">
            <TagsListInline tags={tags} />
          </div>
        </div>
      )}
      {canDisplayEditMetaRow && (
        <EditMetaRow
          className={clsx(
            'margin-top--sm',
            ThemeClassNames.docs.docFooterEditMetaRow,
          )}
          editUrl={editUrl}
          lastUpdatedAt={shownLastUpdatedAt}
          lastUpdatedBy={shownLastUpdatedBy}
        />
      )}
    </footer>
  );
}
