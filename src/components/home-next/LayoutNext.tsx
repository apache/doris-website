import React, { JSX } from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import LayoutProvider from '@theme/Layout/Provider';
import Footer from '@theme/Footer';
import { NavbarNext } from './NavbarNext';
import { PageLanguageSwitcher } from './PageLanguageSwitcher';
import {PageContent, PageFallbackNotice} from './PageContent';

interface LayoutNextProps {
    title?: string;
    description?: string;
    keywords?: string;
    children: React.ReactNode;
}

export function LayoutNext({ title, description, children }: LayoutNextProps): JSX.Element {
    return (
        <LayoutProvider>
            <PageMetadata title={title} description={description} />
            <NavbarNext />
            <main className="home-next-main">
                <PageFallbackNotice />
                <PageLanguageSwitcher />
                <PageContent>{children}</PageContent>
            </main>
            <Footer />
        </LayoutProvider>
    );
}
