export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_RAW_BYTES = 100 * 1024 * 1024;

const TRUNCATION_MARKER = '# [truncated: per-instance execution profiles removed]';
const MERGED_PROFILE_HEADER = /^MergedProfile:\s*$/m;
const DETAIL_PROFILE_HEADER = /^(?:DetailProfile(?:\([^\r\n]*\))?|Execution Profile\b[^\r\n]*):?\s*$/gm;

export function byteLen(value: string): number {
    return new Blob([value]).size;
}

export function ensureTxt(name: string): string {
    return name.toLowerCase().endsWith('.txt') ? name : `${name}.txt`;
}

export function truncateProfile(text: string): string {
    const mergedProfile = MERGED_PROFILE_HEADER.exec(text);
    if (!mergedProfile) return text;

    DETAIL_PROFILE_HEADER.lastIndex = mergedProfile.index + mergedProfile[0].length;
    const detailProfile = DETAIL_PROFILE_HEADER.exec(text);
    DETAIL_PROFILE_HEADER.lastIndex = 0;
    if (!detailProfile) return text;

    const retainedText = text.slice(0, detailProfile.index).trimEnd();
    return `${TRUNCATION_MARKER}\n${retainedText}\n`;
}

export async function prepareProfileFile(file: File): Promise<File> {
    if (file.size <= MAX_UPLOAD_BYTES) {
        return file;
    }
    if (file.size > MAX_RAW_BYTES) {
        throw new Error('The selected file is larger than 100 MiB. Please provide a merged Profile.');
    }

    const output = truncateProfile(await file.text());
    if (byteLen(output) > MAX_UPLOAD_BYTES) {
        throw new Error(
            'The Profile is still larger than 10 MiB after removing per-instance execution profiles. Please provide a merged Profile.',
        );
    }
    return new File([output], ensureTxt(file.name), { type: 'text/plain' });
}
