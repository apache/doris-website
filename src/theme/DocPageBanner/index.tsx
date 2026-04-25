import React from 'react';
import { useLocation } from '@docusaurus/router';

const BANNER_KEY = 'docs-next-banner-dismissed';

export default function DocPageBanner() {
    const location = useLocation();
    const [dismissed, setDismissed] = React.useState(false);

    React.useEffect(() => {
        setDismissed(localStorage.getItem(BANNER_KEY) === '1');
    }, []);

    const { pathname } = location;
    const isLegacyDocs = /^\/(?:zh-CN\/|ja\/)?docs\//.test(pathname);
    const isNextDocs = /^\/(?:zh-CN\/|ja\/)?docs-next\//.test(pathname);

    if (dismissed) return null;

    // Legacy docs pages: show banner to try new version
    if (isLegacyDocs && !isNextDocs) {
        const nextUrl = pathname.replace('/docs/', '/docs-next/');
        return (
            <div
                style={{
                    background: '#11A679',
                    color: '#fff',
                    padding: '6px 16px',
                    textAlign: 'center',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}
            >
                <span>New docs structure available.</span>
                <a
                    href={nextUrl}
                    style={{ color: '#fff', textDecoration: 'underline', fontWeight: 600 }}
                >
                    Try docs-next →
                </a>
                <button
                    onClick={() => {
                        localStorage.setItem(BANNER_KEY, '1');
                        setDismissed(true);
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.6)',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '1px 6px',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    Dismiss
                </button>
            </div>
        );
    }

    // New docs pages: show subtle back link
    if (isNextDocs && !isLegacyDocs) {
        const legacyUrl = pathname.replace('/docs-next/', '/docs/');
        return (
            <div
                style={{
                    background: '#333',
                    color: '#aaa',
                    padding: '4px 16px',
                    textAlign: 'center',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}
            >
                <span>You&apos;re viewing the new docs (beta).</span>
                <a
                    href={legacyUrl}
                    style={{ color: '#aaa', textDecoration: 'underline' }}
                >
                    ← Back to legacy docs
                </a>
            </div>
        );
    }

    return null;
}