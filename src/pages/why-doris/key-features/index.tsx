import React, { JSX } from 'react';
import Layout from '@theme/Layout';
import { KeyFeaturesHero } from '@site/src/components/key-features/KeyFeaturesHero';
import { FeatureCardGrid } from '@site/src/components/key-features/FeatureCardGrid';
import { GlossaryCTABanner } from '@site/src/components/key-features/GlossaryCTABanner';

export default function KeyFeaturesLanding(): JSX.Element {
    return (
        <Layout
            title="Key Features"
            description="Apache Doris's distinctive technical capabilities for engineers."
        >
            <KeyFeaturesHero />
            <FeatureCardGrid />
            <GlossaryCTABanner />
        </Layout>
    );
}
