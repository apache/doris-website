import React, { isValidElement, JSX, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import copy from 'copy-to-clipboard';
import { CodeLanguage, parseLineRanges, tokenizeCodeLine } from './hackathon.logic';
import { IconCopy } from './HackathonIcons';

export interface CodeSnippet {
    /** Header label, e.g. "M1 · Keyword search with BM25". */
    label: string;
    /** Small file/language note next to the label, e.g. "sql". */
    file: string;
    language: CodeLanguage;
    code: string;
    /** Soft-wrap long lines (context prompts). */
    wrap?: boolean;
    /** Show only in the sticky panel, not inline under the step. */
    panelOnly?: boolean;
    /** When a panel view has several snippets, this one takes the step highlight. */
    target?: boolean;
}

export function isCodeSnippet(value: unknown): value is CodeSnippet {
    return (
        typeof value === 'object' &&
        value !== null &&
        !isValidElement(value) &&
        typeof (value as CodeSnippet).code === 'string' &&
        typeof (value as CodeSnippet).language === 'string'
    );
}

interface CopyButtonProps {
    text: string;
    className: string;
    label?: string;
    /** Accessible name when the visible label is hidden on small screens. */
    ariaLabel?: string;
}

export function CopyButton({ text, className, label = 'Copy', ariaLabel }: CopyButtonProps): JSX.Element {
    const [copied, setCopied] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const onCopy = () => {
        copy(text, { format: 'text/plain' });
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <button type="button" className={clsx(className, copied && 'is-done')} onClick={onCopy} aria-label={ariaLabel}>
            <IconCopy />
            <span className="hk-task__copy-label" aria-live="polite">
                {copied ? 'Copied' : label}
            </span>
        </button>
    );
}

interface HackathonCodeBlockProps {
    snippet: CodeSnippet;
    /** Line ranges to highlight, e.g. "4-6". The other lines are dimmed. */
    highlight?: string;
    pinnedLine?: number | null;
}

export function HackathonCodeBlock({ snippet, highlight, pinnedLine }: HackathonCodeBlockProps): JSX.Element {
    const highlighted = new Set(parseLineRanges(highlight));
    const lines = snippet.code.split('\n');

    return (
        <div className="hk-task__code">
            <div className="hk-task__codehead">
                <span className="hk-task__codehead-label">{snippet.label}</span>
                <span className="hk-task__codehead-file">{snippet.file}</span>
                <CopyButton className="hk-task__copy" text={snippet.code} />
            </div>
            <pre
                className={clsx(
                    'hk-task__pre',
                    `hk-task__pre--${snippet.language}`,
                    snippet.wrap && 'hk-task__pre--wrap',
                    highlighted.size > 0 && 'is-dim',
                )}
                // Long lines scroll inside the block; keyboard users need a focus stop to scroll it.
                tabIndex={0}
            >
                <code>
                    {lines.map((line, index) => {
                        const number = index + 1;
                        return (
                            <span
                                key={number}
                                className={clsx(
                                    'hk-task__ln',
                                    highlighted.has(number) && 'is-hl',
                                    pinnedLine === number && 'is-pin',
                                )}
                                data-n={number}
                            >
                                {tokenizeCodeLine(line, snippet.language).map((token, tokenIndex) =>
                                    token.kind ? (
                                        <span key={tokenIndex} className={`hk-tok hk-tok--${token.kind}`}>
                                            {token.text}
                                        </span>
                                    ) : (
                                        <React.Fragment key={tokenIndex}>{token.text}</React.Fragment>
                                    ),
                                )}
                            </span>
                        );
                    })}
                </code>
            </pre>
        </div>
    );
}
