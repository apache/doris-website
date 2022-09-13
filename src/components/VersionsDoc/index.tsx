import React from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import './styles.scss';
import { usePluginData } from '@docusaurus/useGlobalData';


export default function VersionsDoc(props): JSX.Element {
    const { children, value = '' } = props;
    const versionsPluginData: any = usePluginData('versions-plugin');
    const getBuildVersions = (versionsPluginData): string[] => {
        if (versionsPluginData) {
            const versionsData = versionsPluginData.versions;
            if (Array.isArray(versionsData) && versionsData.length > 0) {
                return versionsData[0].split(',');
            }
        }
        return []
    }
    const isShowVersionContent = (buildVersions: string[]) => {
        if (!value) return false
        if (buildVersions.length === 0) return true
        return buildVersions.some(v => value.includes(v))
    }

    const buildVersions = getBuildVersions(versionsPluginData)

    return (
        <div className={clsx('versions-tag')}>
            {isShowVersionContent(buildVersions) && (
                <>
                    <span className="version-sub">
                        <Translate id="doc.version">Version</Translate>: {value}
                    </span>
                    {children}
                </>
            )}
        </div>
    );
}
