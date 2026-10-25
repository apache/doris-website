// Translate report prose while preserving GitHub references and numeric data.
// Both the renderer and publication validator use these stable message paths.
const proseFields = new Set([
    'label',
    'week',
    'lead',
    'title',
    'name',
    'narrative',
    'mergedNarrative',
    'inProgressNarrative',
]);
function referenceMessageId(title) {
    let first = 2166136261,
        second = 2246822507;
    for (let index = 0; index < title.length; index++) {
        const code = title.charCodeAt(index);
        first = Math.imul(first ^ code, 16777619);
        second = Math.imul(second ^ code, 3266489909);
    }
    return (
        'landing.reportRefs.' +
        (first >>> 0).toString(16).padStart(8, '0') +
        (second >>> 0).toString(16).padStart(8, '0')
    );
}
function mapReportText(id, entry, map) {
    function visit(value, keys) {
        if (typeof value === 'string') {
            if (value.trim() && (proseFields.has(keys.at(-1)) || keys.at(-2) === 'highlights'))
                return map(`landing.reports.${id}.${keys.join('.')}`, value);
            return value;
        }
        if (Array.isArray(value)) return value.map((item, index) => visit(item, [...keys, String(index)]));
        if (!value || typeof value !== 'object') return value;
        // Retain the original GitHub title for the source tooltip; localize its visible label.
        if (typeof value.num === 'number' && typeof value.url === 'string')
            return { ...value, sourceTitle: value.title, title: map(referenceMessageId(value.title), value.title) };
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item, [...keys, key])]));
    }
    return {
        ...entry,
        label: visit(entry.label, ['label']),
        week: visit(entry.week, ['week']),
        stats: visit(entry.stats, ['stats']),
        report: visit(entry.report, ['report']),
    };
}
module.exports = { mapReportText, referenceMessageId };
