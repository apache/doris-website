import React from 'react';
import DocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';
import Translate from '@docusaurus/Translate';

export default function DocsVersionDropdownNavbarItemWrapper(props) {
    const { mobile } = props;
    return mobile ? (
        <DocsVersionDropdownNavbarItem {...props} />
    ) : (
        <div className="versions">
            <Translate id="doc.version" description="Version">
                Version
            </Translate>
            :
            <DocsVersionDropdownNavbarItem {...props} />
        </div>
    );
}
