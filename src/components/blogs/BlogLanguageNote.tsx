import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {blogContentLocale} from '@site/src/utils/blogLocale';
import {languageMessages} from '@site/src/utils/languageMessages';

export default function BlogLanguageNote({metadata}: {metadata: any}) {
    const {i18n: {currentLocale}} = useDocusaurusContext();
    return currentLocale !== 'en' && blogContentLocale(metadata, currentLocale) === 'en'
        ? <span className="blog-language-note" lang={currentLocale}>{languageMessages(currentLocale).note}</span> : null;
}
