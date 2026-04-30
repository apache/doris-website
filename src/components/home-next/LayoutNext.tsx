import React, { JSX } from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import LayoutProvider from '@theme/Layout/Provider';
import Footer from '@theme/Footer';
import AnnouncementBar from '@theme/AnnouncementBar';
import { NavbarNext } from './NavbarNext';

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
            <AnnouncementBar />
            <NavbarNext />
            <main>{children}</main>
            <Footer />
        </LayoutProvider>
    );
}
