function sourceForLocalized(file) {
    const match = file.match(/^i18n\/[^/]+\/docusaurus-plugin-content-docs(-[^/]+)?\/(current|version-([^/]+))\/(.*)$/);
    if (!match) return null;
    const plugin = match[1] || '', version = match[3], relative = match[4];
    const roots = {'':'docs', '-community':'community', '-releases':'releasenotes', '-course':'course',
        '-course-ui':'src', '-community-report':'src/pages/community-report/_reports',
        '-community-report-ui':'src'};
    if (!roots[plugin]) return null;
    if (version) return plugin === '' ? `versioned_docs/version-${version}/${relative}` : null;
    return `${roots[plugin]}/${relative}`;
}
module.exports = {sourceForLocalized};
