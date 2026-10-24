import React, {type JSX} from 'react';
import {useLanguageItems} from '@site/src/utils/useLanguageItems';
import {useContentRouteData} from '@site/src/utils/contentRoute';
import {languageMessages} from '@site/src/utils/languageMessages';
import './PageLanguageSwitcher.scss';

export function PageLanguageSwitcher(): JSX.Element | null {
    const page = useContentRouteData();
    const items = useLanguageItems();
    if (!page || page.kind !== 'page' || page.availableTranslations.length < 2) return null;
    return <div className="page-language-switcher" role="group" aria-label={languageMessages(items.find(item => item.current)?.locale ?? 'en').choose}>
        {items.map(item => <a key={item.locale} href={item.href} lang={item.htmlLang} hrefLang={item.htmlLang}
            aria-current={item.current ? 'page' : undefined} onClick={item.onClick}>{item.label}</a>)}
    </div>;
}
