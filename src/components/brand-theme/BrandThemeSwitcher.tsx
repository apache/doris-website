import React, { JSX, useEffect, useRef } from 'react';
import { BRAND_THEMES, useBrandTheme } from './BrandThemeProvider';
import './BrandThemeSwitcher.scss';

function PaletteIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M10 2.25a7.75 7.75 0 1 0 0 15.5h1.05a1.7 1.7 0 0 0 1.2-2.9l-.35-.35a1.7 1.7 0 0 1 1.2-2.9h1.1A3.55 3.55 0 0 0 17.75 8 7.75 7.75 0 0 0 10 2.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <circle cx="6.4" cy="8" r="1" fill="currentColor" />
            <circle cx="9" cy="5.5" r="1" fill="currentColor" />
            <circle cx="12.5" cy="6" r="1" fill="currentColor" />
        </svg>
    );
}

export function BrandThemeSwitcher({ mobile = false }: { mobile?: boolean }): JSX.Element {
    const { brandTheme, setBrandTheme } = useBrandTheme();
    const detailsRef = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && detailsRef.current?.open) {
                detailsRef.current.open = false;
                detailsRef.current.querySelector<HTMLElement>('summary')?.focus();
            }
        };
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
                detailsRef.current.open = false;
            }
        };
        window.addEventListener('keydown', closeOnEscape);
        window.addEventListener('pointerdown', closeOnOutsideClick);
        return () => {
            window.removeEventListener('keydown', closeOnEscape);
            window.removeEventListener('pointerdown', closeOnOutsideClick);
        };
    }, []);

    const currentTheme = BRAND_THEMES.find(theme => theme.id === brandTheme) ?? BRAND_THEMES[0];

    return (
        <details
            ref={detailsRef}
            className={`brand-theme-switcher${mobile ? ' brand-theme-switcher--mobile' : ''}`}
        >
            <summary aria-label={`Color theme: ${currentTheme.label}`} title="Change color theme">
                <PaletteIcon />
                {mobile && <span>Color theme</span>}
            </summary>
            <div className="brand-theme-switcher__menu" role="group" aria-label="Color theme">
                {BRAND_THEMES.map(theme => (
                    <button
                        key={theme.id}
                        type="button"
                        className="brand-theme-switcher__option"
                        aria-pressed={brandTheme === theme.id}
                        onClick={() => {
                            setBrandTheme(theme.id);
                            if (detailsRef.current) detailsRef.current.open = false;
                        }}
                    >
                        <span className="brand-theme-switcher__swatches" aria-hidden="true">
                            <span style={{ backgroundColor: theme.primary }} />
                            <span style={{ backgroundColor: theme.accent }} />
                        </span>
                        <span>{theme.label}</span>
                        <span className="brand-theme-switcher__check" aria-hidden="true">
                            {brandTheme === theme.id ? '✓' : ''}
                        </span>
                    </button>
                ))}
            </div>
        </details>
    );
}
