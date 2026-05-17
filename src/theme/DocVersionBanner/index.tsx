import React, { type ComponentType } from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import {
    useActivePlugin,
    useActiveDocContext,
    useDocVersionSuggestions,
    useVersions,
    type GlobalVersion,
} from '@docusaurus/plugin-content-docs/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDocsPreferredVersion, useDocsVersion } from '@docusaurus/plugin-content-docs/client';
import type { Props } from '@theme/DocVersionBanner';
import type { VersionBanner, PropVersionMetadata } from '@docusaurus/plugin-content-docs';

type BannerLabelComponentProps = {
    siteTitle: string;
    versionMetadata: PropVersionMetadata;
};

function UnreleasedVersionLabel({ siteTitle, versionMetadata }: BannerLabelComponentProps) {
    return (
        <Translate
            id="theme.docs.versions.unreleasedVersionLabel"
            description="The label used to tell the user that he's browsing an unreleased doc version"
            values={{
                unreleased: (
                    <b>
                        <Translate id="theme.docs.versions.unreleasedText">unreleased</Translate>
                    </b>
                ),
            }}
        >
            {'This documentation is for an {unreleased} version of Apache Doris.'}
        </Translate>
    );
}

function UnmaintainedVersionLabel({ siteTitle, versionMetadata }: BannerLabelComponentProps) {
    return (
        <Translate
            id="theme.docs.versions.unmaintainedVersionLabel"
            description="The label used to tell the user that he's browsing an unmaintained doc version"
            values={{
                siteTitle,
                versionLabel: <b>{versionMetadata.label}</b>,
            }}
        >
            {'This is documentation for {siteTitle} {versionLabel}, which is no longer actively maintained.'}
        </Translate>
    );
}

const BannerLabelComponents: {
    [banner in VersionBanner]: ComponentType<BannerLabelComponentProps>;
} = {
    unreleased: UnreleasedVersionLabel,
    unmaintained: UnmaintainedVersionLabel,
};

function BannerLabel(props: BannerLabelComponentProps) {
    const BannerLabelComponent = BannerLabelComponents[props.versionMetadata.banner!];
    return <BannerLabelComponent {...props} />;
}

function VersionsSuggestionLabel({
    v4xTo,
    v3xTo,
    v21To,
    onClick,
}: {
    v4xTo: string;
    v3xTo: string;
    v21To: string;
    onClick: () => void;
}) {
    return (
        <Translate
            id="theme.docs.versions.latestVersionSuggestionLabel"
            description="The label used to tell the user to check the latest version"
            values={{
                v4xLink: (
                    <b>
                        <Link to={v4xTo} onClick={onClick}>
                            4.x
                        </Link>
                    </b>
                ),
                v3xLink: (
                    <b>
                        <Link to={v3xTo} onClick={onClick}>
                            3.x
                        </Link>
                    </b>
                ),
                v21Link: (
                    <b>
                        <Link to={v21To} onClick={onClick}>
                            2.1
                        </Link>
                    </b>
                ),
            }}
        >
            {'For usage, please refer to the official documentation of Version {v4xLink}/{v3xLink}/{v21Link}'}
        </Translate>
    );
}

function DocVersionBannerEnabled({
    className,
    versionMetadata,
}: Props & {
    versionMetadata: PropVersionMetadata;
}): React.ReactElement {
    const {
        siteConfig: { title: siteTitle },
    } = useDocusaurusContext();
    const { pluginId } = useActivePlugin({ failfast: true })!;

    const getVersionMainDoc = (version: GlobalVersion) => version.docs.find(doc => doc.id === version.mainDocId)!;

    const { savePreferredVersionName } = useDocsPreferredVersion(pluginId);
    const { latestVersionSuggestion } = useDocVersionSuggestions(pluginId);
    const { alternateDocVersions } = useActiveDocContext(pluginId);
    const versions = useVersions(pluginId);

    const resolveDocPath = (versionName: string): string => {
        const alt = alternateDocVersions[versionName];
        if (alt) return alt.path;
        const version = versions.find(v => v.name === versionName);
        return version ? getVersionMainDoc(version).path : '/';
    };

    const v4xTo = resolveDocPath('4.x');
    const v3xTo = resolveDocPath('3.x');
    const v21To = resolveDocPath('2.1');

    return (
        <div
            className={clsx(className, ThemeClassNames.docs.docVersionBanner, 'alert alert--warning margin-bottom--md')}
            role="alert"
        >
            <div>
                <BannerLabel siteTitle={siteTitle} versionMetadata={versionMetadata} />
            </div>
            <div className="margin-top--md">
                <VersionsSuggestionLabel
                    v4xTo={v4xTo}
                    v3xTo={v3xTo}
                    v21To={v21To}
                    onClick={() => savePreferredVersionName(latestVersionSuggestion.name)}
                />
            </div>
        </div>
    );
}

export default function DocVersionBanner({ className }: Props): React.ReactElement | null {
    const versionMetadata = useDocsVersion();
    const activePlugin = useActivePlugin();
    const activeDocContext = useActiveDocContext(activePlugin?.pluginId);

    if (!versionMetadata.banner) {
        return null;
    }

    // Hide the banner on docs under `docs/key-features/` — their doc ids
    // start with `key-features/` (Docusaurus derives the id from the file
    // path relative to the docs root).
    if (activeDocContext.activeDoc?.id.startsWith('key-features/')) {
        return null;
    }

    return <DocVersionBannerEnabled className={className} versionMetadata={versionMetadata} />;
}
