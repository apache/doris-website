const { getTagGroup } = require('@site/src/utils/key-features-tags');

function applyFilter(entries, activeTags, searchQuery) {
    const query = searchQuery.trim().toLowerCase();

    // Group active tags by their group id (tags not in registry are dropped here)
    const tagsByGroup = new Map();
    for (const tag of activeTags) {
        const groupId = getTagGroup(tag);
        if (!groupId) continue;
        if (!tagsByGroup.has(groupId)) tagsByGroup.set(groupId, new Set());
        tagsByGroup.get(groupId).add(tag);
    }

    return entries.filter(entry => {
        if (query && !entry.title.toLowerCase().startsWith(query)) return false;

        // OR within group, AND across groups
        for (const tagsInGroup of tagsByGroup.values()) {
            const matchesAny = entry.tags.some(t => tagsInGroup.has(t));
            if (!matchesAny) return false;
        }
        return true;
    });
}

module.exports = { applyFilter };
