import React, {useEffect, useRef} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLanguageItems} from '@site/src/utils/useLanguageItems';
import {languageMessages} from '@site/src/utils/languageMessages';
import './LanguageMenu.scss';

export function LanguageMenu({mobile = false}: {mobile?: boolean}) {
    const {i18n: {currentLocale, localeConfigs}} = useDocusaurusContext();
    const items = useLanguageItems();
    const details = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const close = (event: KeyboardEvent | PointerEvent) => {
            if (!details.current?.open) return;
            if (event instanceof KeyboardEvent && event.key === 'Escape') {
                details.current.open = false;
                details.current.querySelector('summary')?.focus();
            } else if (event instanceof PointerEvent && !details.current.contains(event.target as Node)) details.current.open = false;
        };
        window.addEventListener('keydown', close); window.addEventListener('pointerdown', close);
        return () => {window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', close);};
    }, []);
    const label = languageMessages(currentLocale).choose;
    return <details ref={details} className={`language-menu${mobile ? ' language-menu--mobile' : ''}`}>
        <summary lang={currentLocale} aria-label={`${label}: ${localeConfigs[currentLocale].label}`}>
            <span aria-hidden="true">◎</span><span>{mobile ? label : localeConfigs[currentLocale].label}</span>
        </summary>
        <div className="language-menu__links" role="group" aria-label={label}>
            {items.map(item => <a key={item.locale} href={item.href} lang={item.htmlLang} hrefLang={item.htmlLang}
                aria-current={item.current ? 'page' : undefined} onClick={item.onClick}>
                <span>{item.label}</span>{item.fallbackLabel && <small lang={currentLocale}>{item.fallbackLabel}</small>}
            </a>)}
        </div>
    </details>;
}
