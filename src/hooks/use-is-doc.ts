import { useState, useEffect } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { isDocsPath } from '@site/src/utils/locale';

export default function useIsDocPage(defaultValue: boolean) {
    const [isDocsPage, setIsDocsPage] = useState(defaultValue);
    const {
        i18n: { locales },
    } = useDocusaurusContext();
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const docsPage = isDocsPath(location.pathname, locales);
            setIsDocsPage(docsPage);
        }
    }, [locales, typeof window !== 'undefined' && location.pathname]);

    return [isDocsPage, setIsDocsPage];
}
