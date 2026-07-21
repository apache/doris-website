import React, { JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisMarkdownProps {
    children: string;
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
                components={{
                    h1: 'h3',
                    h2: 'h3',
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
