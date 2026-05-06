import tagsRegistry from '@site/key-features-docs/_tags.yml';

export interface TagMeta {
    label: string;
    color: string;
}

export interface TagGroup {
    id: string;            // e.g. 'functional-area'
    label: string;         // human label, e.g. 'Functional area'
    tagIds: string[];      // tags belonging to this group, in declaration order
}

interface RegistryShape {
    groups: Record<string, {
        label: string;
        tags: Record<string, TagMeta>;
    }>;
}

const registry = tagsRegistry as RegistryShape;

const FALLBACK_COLOR = '#94a3b8';

const flatTagIndex: Record<string, TagMeta & { groupId: string }> = {};
const groupList: TagGroup[] = [];

for (const [groupId, group] of Object.entries(registry.groups)) {
    const tagIds: string[] = [];
    for (const [tagId, meta] of Object.entries(group.tags)) {
        flatTagIndex[tagId] = { ...meta, groupId };
        tagIds.push(tagId);
    }
    groupList.push({ id: groupId, label: group.label, tagIds });
}

export function getTagMeta(tagId: string): TagMeta {
    const found = flatTagIndex[tagId];
    if (found) return { label: found.label, color: found.color };
    return { label: tagId, color: FALLBACK_COLOR };
}

export function getTagGroup(tagId: string): string | null {
    return flatTagIndex[tagId]?.groupId ?? null;
}

export function listTagGroups(): TagGroup[] {
    return groupList;
}

export function isRegisteredTag(tagId: string): boolean {
    return tagId in flatTagIndex;
}
