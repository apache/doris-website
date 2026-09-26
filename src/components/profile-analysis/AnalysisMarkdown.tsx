import React, { JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisMarkdownProps {
    children: string;
}

const ALLOWED_ELEMENTS = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'em',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'br',
    'del',
    'a',
];

function isSafeLink(href: string | undefined): boolean {
    if (!href) return false;
    if (href.startsWith('#') || href.startsWith('/')) return !href.startsWith('//');
    try {
        const url = new URL(href);
        return (
            url.protocol === 'https:' &&
            (url.hostname === 'doris.apache.org' ||
                (url.hostname === 'github.com' && url.pathname.startsWith('/apache/doris')))
        );
    } catch {
        return false;
    }
}

/**
 * Render the model response as untrusted, runtime Markdown.
 *
 * Raw HTML is intentionally discarded and the default react-markdown URL
 * transform is retained so executable protocols such as javascript: are not
 * exposed as links.
 */
export function AnalysisMarkdown({ children }: AnalysisMarkdownProps): JSX.Element {
    return (
        <div className="profile-analysis__markdown markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                allowedElements={ALLOWED_ELEMENTS}
                components={{
                    h1: 'h3',
                    h2: 'h3',
                    img: () => null,
                    a: ({ href, children }) =>
                        isSafeLink(href) ? (
                            <a href={href} rel="noopener noreferrer">
                                {children}
                            </a>
                        ) : (
                            <span>{children}</span>
                        ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
