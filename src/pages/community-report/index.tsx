import React, { JSX } from 'react';
import CommunityReportNext, { WeeklyReportEntry } from '@site/src/components/community-report-next/CommunityReportNext';

// Build-time glob of every report in ./_reports. The files live under
// src/pages inside an underscore folder, so Docusaurus compiles each one as an
// MDX partial: a React component (`default`) plus any `export const` metadata
// (label / week / stats). The regex skips files whose name starts with "_"
// (e.g. _TEMPLATE.mdx).
function loadReports(): WeeklyReportEntry[] {
    // require.context is a webpack build-time API and is not typed on `require`.
    const ctx = (require as any).context('./_reports', false, /^\.\/[^_].*\.mdx?$/);
    const entries = ctx.keys().map((key: string): WeeklyReportEntry => {
        const mod = ctx(key);
        const id = key.replace(/^\.\//, '').replace(/\.mdx?$/, '');
        return {
            id,
            label: mod.label ?? id,
            week: mod.week,
            stats: Array.isArray(mod.stats) ? mod.stats : undefined,
            Component: mod.default,
        };
    });
    // Filenames follow YYYY-MM-DD, so a descending sort puts the latest first.
    entries.sort((a, b) => (a.id < b.id ? 1 : -1));
    return entries;
}

const REPORTS = loadReports();

export default function CommunityReportPage(): JSX.Element {
    return <CommunityReportNext reports={REPORTS} />;
}
