import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { ProfileAnalyzer } from '@site/src/components/profile-analysis/ProfileAnalyzer';

export default function ProfileAnalysisPage(): JSX.Element {
    return (
        <Layout
            title="Profile Analysis - Apache Doris"
            description="Analyze an Apache Doris Query Profile with an AI-assisted diagnostic workflow."
        >
            <main className="container margin-vert--lg">
                <ProfileAnalyzer />
            </main>
        </Layout>
    );
}
