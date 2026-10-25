import React, { useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLanguageItems } from '@site/src/utils/useLanguageItems';
import { languageMessages } from '@site/src/utils/languageMessages';
import { BrandThemeSwitcher } from '@site/src/components/brand-theme/BrandThemeSwitcher';
import { translate } from '@docusaurus/Translate';
import './LanguageMenu.scss';

export function LanguageMenu({
    mobile = false,
    appearance = false,
    onOpen,
}: {
    mobile?: boolean;
    appearance?: boolean;
    onOpen?: () => void;
}) {
    const {
        i18n: { currentLocale, localeConfigs },
    } = useDocusaurusContext();
    const items = useLanguageItems();
    const details = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const close = (event: KeyboardEvent | PointerEvent) => {
            if (!details.current?.open) return;
            if (event instanceof KeyboardEvent && event.key === 'Escape') {
                details.current.open = false;
                details.current.querySelector('summary')?.focus();
            } else if (event instanceof PointerEvent && !details.current.contains(event.target as Node))
                details.current.open = false;
        };
        window.addEventListener('keydown', close);
        window.addEventListener('pointerdown', close);
        return () => {
            window.removeEventListener('keydown', close);
            window.removeEventListener('pointerdown', close);
        };
    }, []);
    const label = languageMessages(currentLocale).choose;
    const summaryLabel = appearance
        ? `${label} / ${translate({ id: 'homepage.theme.label', message: 'Color theme' })}`
        : label;
    const close = () => {
        if (details.current) {
            details.current.open = false;
            details.current.querySelector('summary')?.focus();
        }
    };
    return (
        <details
            ref={details}
            className={`language-menu${mobile ? ' language-menu--mobile' : ''}${appearance ? ' language-menu--preferences' : ''}`}
            onToggle={event => {
                if (event.currentTarget.open) onOpen?.();
            }}
        >
            <summary
                lang={currentLocale}
                aria-label={`${summaryLabel}: ${localeConfigs[currentLocale].label}`}
                title={`${summaryLabel}: ${localeConfigs[currentLocale].label}`}
            >
                <svg
                    className="language-menu__icon"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path d="m5 8 6 6m-7 0 6-6 2-3M2 5h12M7 2h1m14 20-5-10-5 10m2-4h6" />
                </svg>
            </summary>
            <div className="language-menu__panel">
                {appearance && <div className="language-menu__heading">{label}</div>}
                <div className="language-menu__links" role="group" aria-label={label}>
                    {items.map(item => (
                        <a
                            key={item.locale}
                            href={item.href}
                            lang={item.htmlLang}
                            hrefLang={item.htmlLang}
                            aria-current={item.current ? 'page' : undefined}
                            onClick={item.onClick}
                        >
                            <span>{item.label}</span>
                            {item.fallbackLabel && <small lang={currentLocale}>{item.fallbackLabel}</small>}
                        </a>
                    ))}
                </div>
                {appearance && (
                    <div className="language-menu__appearance">
                        <div className="language-menu__heading">
                            {translate({ id: 'homepage.theme.label', message: 'Color theme' })}
                        </div>
                        <BrandThemeSwitcher inline onSelect={close} />
                    </div>
                )}
            </div>
        </details>
    );
}
