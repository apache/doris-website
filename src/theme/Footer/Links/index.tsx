import React from 'react';
import { isMultiColumnFooterLinks } from '@docusaurus/theme-common';
import FooterLinksSimple from '@theme/Footer/Links/Simple';
import FooterLinksMultiColumn from './MultiColumn';
export default function FooterLinks({ links }) {
    return isMultiColumnFooterLinks(links) ? (
        <FooterLinksMultiColumn columns={links} />
    ) : (
        <FooterLinksSimple links={links} />
    );
}
