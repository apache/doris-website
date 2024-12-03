import { useState, useEffect } from 'react';

export default function useIsDocPage(defaultValue: boolean) {
    const [isDocsPage, setIsDocsPage] = useState(defaultValue);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathname = location.pathname.split('/')[1];
            const docsPage = pathname === 'docs' || location.pathname.includes('zh-CN/docs');
            setIsDocsPage(docsPage);
        }
    }, [typeof window !== 'undefined' && location.pathname]);

    return [isDocsPage, setIsDocsPage];
}
