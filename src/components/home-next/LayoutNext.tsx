import React, { JSX } from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import LayoutProvider from '@theme/Layout/Provider';
import Footer from '@theme/Footer';
import { NavbarNext } from './NavbarNext';
import { PreviewBanner } from './PreviewBanner';

interface LayoutNextProps {
    title?: string;
    description?: string;
    keywords?: string;
    onSwitchBack?: () => void;
    children: React.ReactNode;
}

export function LayoutNext({ title, description, onSwitchBack, children }: LayoutNextProps): JSX.Element {
    return (
        <LayoutProvider>
            <PageMetadata title={title} description={description} />
            <PreviewBanner onSwitchBack={onSwitchBack} />
            <NavbarNext />
            <main className="home-next-main">{children}</main>
            <Footer />
        </LayoutProvider>
    );
}
