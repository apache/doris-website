import React, { JSX } from 'react';
import { translate } from '@docusaurus/Translate';
import Layout from '@site/src/theme/Layout';
import { HeroSection } from './sections/HeroSection';
import { StatsSection } from './sections/StatsSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { UseCasesSection } from './sections/UseCasesSection';
import { CommunitySection } from './sections/CommunitySection';
import { GetStartedSection } from './sections/GetStartedSection';
import './HomeNext.scss';

interface HomeNextProps {
    onSwitchBack: () => void;
}

export default function HomeNext({ onSwitchBack }: HomeNextProps): JSX.Element {
    return (
        <Layout
            title={translate({
                id: 'homepage.title',
                message: 'Apache Doris: Open Source, Real-Time Analytics and Search Database for the AI Era',
            })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message:
                    'Apache Doris is an open-source database based on MPP architecture, with easier use and higher performance. As a modern data warehouse, Apache Doris empowers your OLAP query and database analytics.',
            })}
            showAnnouncementBar={true}
            keywords={translate({
                id: 'homepage.keywords',
                message: 'Open Source database, OLAP, data warehouse, database analytics',
            })}
        >
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <UseCasesSection />
            <CommunitySection />
            <GetStartedSection />
        </Layout>
    );
}
