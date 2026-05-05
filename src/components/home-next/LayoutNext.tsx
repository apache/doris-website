import React, { JSX, useEffect, useRef } from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import LayoutProvider from '@theme/Layout/Provider';
import Footer from '@theme/Footer';
import AnnouncementBar from '@theme/AnnouncementBar';
import { NavbarNext } from './NavbarNext';

interface LayoutNextProps {
    title?: string;
    description?: string;
    keywords?: string;
    onSwitchBack?: () => void;
    children: React.ReactNode;
}

export function LayoutNext({ title, description, onSwitchBack, children }: LayoutNextProps): JSX.Element {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = bannerRef.current;
        if (!el) return;
        const update = () => {
            document.documentElement.style.setProperty(
                '--home-next-banner-height',
                `${el.offsetHeight}px`,
            );
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--home-next-banner-height');
        };
    }, []);

    return (
        <LayoutProvider>
            <PageMetadata title={title} description={description} />
            <AnnouncementBar />
            <div ref={bannerRef} className="home-next-preview-banner" role="status">
                <span className="home-next-preview-banner__text">
                    You're viewing the preview version of this page. For the full experience, please return to the
                    {' '}
                    <button
                        type="button"
                        className="home-next-preview-banner__link"
                        onClick={() => {
                            if (onSwitchBack) {
                                onSwitchBack();
                                return;
                            }
                            if (typeof window !== 'undefined') {
                                try {
                                    window.localStorage.removeItem('doris-home-version');
                                } catch {
                                    // localStorage may be unavailable (private mode / disabled cookies)
                                }
                                window.location.assign('/');
                            }
                        }}
                    >
                        classic homepage
                    </button>
                    .
                </span>
            </div>
            <NavbarNext />
            <main className="home-next-main">{children}</main>
            <Footer />
        </LayoutProvider>
    );
}
