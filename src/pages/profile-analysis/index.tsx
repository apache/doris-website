import {translate} from '@docusaurus/Translate';
import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { ProfileAnalyzer } from '@site/src/components/profile-analysis/ProfileAnalyzer';

export default function ProfileAnalysisPage(): JSX.Element {
    return (
        <Layout
            title={translate({id: "landing.profileanalysis.001", message: "Profile Analysis - Apache Doris"})}
            description={translate({id: "landing.profileanalysis.002", message: "Analyze an Apache Doris Query Profile with an AI-assisted diagnostic workflow."})}
        >
            <main className="container margin-vert--lg">
                <ProfileAnalyzer />
            </main>
        </Layout>
    );
}
