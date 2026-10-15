import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { LayoutNext } from './LayoutNext';
import { HeroSection } from './sections/HeroSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { UseCasesSection } from './sections/UseCasesSection';
import { EcosystemSection } from './sections/EcosystemSection';
import { DeploymentSection } from './sections/DeploymentSection';
import { CommunitySection } from './sections/CommunitySection';
import { StatsSection } from './sections/StatsSection';
import { NewsTicker } from './NewsTicker';
import './HomeNext.scss';

export default function HomeNext(): JSX.Element {
    return (
        <LayoutNext
            title={translate({ id: "homepage.home.001", message: "Apache Doris: Open Source, Real-Time Analytics and Search Database for the AI Era" })}
            description={translate({ id: "homepage.home.002", message: "Apache Doris is an open-source, real-time analytics database built on MPP architecture. Run OLAP queries, lakehouse analytics, and hybrid search at petabyte scale on a single engine." })}
        >
            <HeroSection />
            <NewsTicker />
            <UseCasesSection />
            <StatsSection />
            <FeaturesSection />
            <EcosystemSection />
            <DeploymentSection />
            <CommunitySection />
        </LayoutNext>
    );
}
