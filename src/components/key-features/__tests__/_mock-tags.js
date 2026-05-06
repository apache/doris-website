const groups = {
    'functional-area': new Set(['search', 'indexing', 'lakehouse']),
    'concept-type': new Set(['algorithm', 'data-structure', 'file-format']),
};

module.exports = {
    getTagGroup(tagId) {
        for (const [groupId, set] of Object.entries(groups)) {
            if (set.has(tagId)) return groupId;
        }
        return null;
    },
};
