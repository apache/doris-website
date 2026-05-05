import React, { JSX } from 'react';
import { LayoutNext } from './LayoutNext';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { UseCasesSection } from './sections/UseCasesSection';
import { EcosystemSection } from './sections/EcosystemSection';
import { DeploymentSection } from './sections/DeploymentSection';
import { CommunitySection } from './sections/CommunitySection';
import './HomeNext.scss';

interface HomeNextProps {
    onSwitchBack: () => void;
}

export default function HomeNext({ onSwitchBack }: HomeNextProps): JSX.Element {
    return (
        <LayoutNext
            title="Apache Doris: Open Source, Real-Time Analytics and Search Database for the AI Era"
            description="Apache Doris is an open-source, real-time analytics database built on MPP architecture. Run OLAP queries, lakehouse analytics, and hybrid search at petabyte scale on a single engine."
            onSwitchBack={onSwitchBack}
        >
            <HeroSection />
            <FeaturesSection />
            <UseCasesSection />
            <EcosystemSection />
            <DeploymentSection />
            <CommunitySection />
        </LayoutNext>
    );
}
