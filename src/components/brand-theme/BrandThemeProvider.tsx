import React, { createContext, JSX, useContext, useEffect, useMemo, useState } from 'react';

export const BRAND_THEME_STORAGE_KEY = 'doris-brand-theme';

export const BRAND_THEMES = [
    { id: 'doris', label: 'Doris Green', primary: '#11A679', accent: '#FFD23F' },
    { id: 'golden', label: 'Golden', primary: '#7B2CBF', accent: '#F9D308' },
    { id: 'blue', label: 'Steel Cyan', primary: '#2C2C34', accent: '#00D4FF' },
    { id: 'read', label: 'Lava & Black', primary: '#121212', accent: '#FF4500' },
    { id: 'yellow-blue', label: 'Victory Blue', primary: '#0066FF', accent: '#FFD300' },
    { id: 'purple', label: 'Lilac Mist', primary: '#B19CD9', accent: '#D3D3D3' },
    { id: 'yellow-black', label: 'Obsidian Gold', primary: '#000000', accent: '#FFD700' },
    { id: 'sky', label: 'Sky Mist', primary: '#89C2FF', accent: '#E6F7FF' },
] as const;

export type BrandTheme = (typeof BRAND_THEMES)[number]['id'];

interface BrandThemeContextValue {
    brandTheme: BrandTheme;
    setBrandTheme: (theme: BrandTheme) => void;
}

const BrandThemeContext = createContext<BrandThemeContextValue | undefined>(undefined);

function isBrandTheme(value: string | undefined): value is BrandTheme {
    return BRAND_THEMES.some(theme => theme.id === value);
}

function applyBrandTheme(theme: BrandTheme): void {
    document.documentElement.dataset.brandTheme = theme;
    window.dispatchEvent(new CustomEvent('brand-theme-change', { detail: { theme } }));
    const rootStyle = window.getComputedStyle(document.documentElement);
    const tokens = [
        '--brand-primary',
        '--brand-primary-dark',
        '--brand-primary-darker',
        '--brand-primary-tint',
        '--brand-primary-glow',
        '--brand-primary-glow-rgb',
        '--brand-primary-soft',
        '--brand-primary-muted',
        '--brand-accent',
        '--brand-accent-rgb',
        '--brand-accent-bright',
        '--brand-cream',
        '--brand-cream-light',
        '--brand-surface-callout',
        '--brand-ink',
        '--brand-ink-rgb',
    ].reduce<Record<string, string>>((values, token) => {
        values[token] = rootStyle.getPropertyValue(token).trim();
        return values;
    }, {});
    document
        .querySelectorAll<HTMLIFrameElement>(
            'iframe.features-next__realtime-frame, iframe[src^="/animations/what-is-apache-doris-intro.html"]',
        )
        .forEach(frame => {
            frame.contentWindow?.postMessage({ type: 'brand-theme-change', theme, tokens }, window.location.origin);
        });
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
    const [brandTheme, setBrandThemeState] = useState<BrandTheme>('doris');

    useEffect(() => {
        const initialTheme = document.documentElement.dataset.brandTheme;
        if (isBrandTheme(initialTheme)) {
            setBrandThemeState(initialTheme);
        } else {
            applyBrandTheme('doris');
        }
    }, []);

    const value = useMemo<BrandThemeContextValue>(() => ({
        brandTheme,
        setBrandTheme: theme => {
            applyBrandTheme(theme);
            setBrandThemeState(theme);
            try {
                window.localStorage.setItem(BRAND_THEME_STORAGE_KEY, theme);
            } catch {
                // Storage can be unavailable in hardened/private browsing.
            }
        },
    }), [brandTheme]);

    return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme(): BrandThemeContextValue {
    const context = useContext(BrandThemeContext);
    if (!context) {
        throw new Error('useBrandTheme must be used inside BrandThemeProvider');
    }
    return context;
}
