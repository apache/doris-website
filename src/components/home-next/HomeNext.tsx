import React, { JSX } from 'react';
import { LayoutNext } from './LayoutNext';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
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
            description="Apache Doris is an open-source database based on MPP architecture, with easier use and higher performance. As a modern data warehouse, Apache Doris empowers your OLAP query and database analytics."
        >
            <HeroSection />
            <FeaturesSection />
            <EcosystemSection />
            <DeploymentSection />
            <CommunitySection />
        </LayoutNext>
    );
}
