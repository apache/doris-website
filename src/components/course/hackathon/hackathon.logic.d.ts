export type CodeLanguage = 'sql' | 'bash' | 'python' | 'json' | 'text';

export type CodeTokenKind = 'k' | 'f' | 's' | 'n' | 'o' | 'c';

export interface CodeToken {
    text: string;
    kind?: CodeTokenKind;
}

export function tokenizeCodeLine(line: string, language: CodeLanguage): CodeToken[];

export function parseLineRanges(spec: string | undefined): number[];
