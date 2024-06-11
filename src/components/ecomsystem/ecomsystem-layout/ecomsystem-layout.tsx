import { translate } from '@docusaurus/Translate';
import React, { PropsWithChildren } from 'react';
import PageHeader from '@site/src/components/PageHeader';
import Layout from '@site/src/theme/Layout';
import EcomsystemCategory from '@site/src/components/ecomsystem/ecomsystem-category/ecomsystem-category';
import { ExternalLinkArrowIcon } from '../../Icons/external-link-arrow-icon';
import GetStarted from '@site/src/components/get-started/get-started';
import ExternalLink from '@site/src/components/external-link/external-link';

export default function EcomsystemLayout(props: PropsWithChildren) {
    const { children } = props;
    return (
        <Layout
            title={translate({ id: 'ecosystem.title', message: 'Apache Doris - Ecosystem | Tools for quickly big data analytics' })}
            // TODO update description
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'Apache Doris provides the rich ecosystem for real-time data integartion and cluster manangement, smooth your big data analytics and data ingestion quickly and effortlessly. ',
            })}
            wrapperClassName="ecosystem"
        >
            <PageHeader
                title="Ecosystem"
                subtitle="Simplify data integration, cluster management and data loading."
                className="pt-20 px-4"
                extra={
                    <div className="flex justify-center mt-5">
                        <ExternalLink
                            style={{ height: '3.25rem' }}
                            to="/docs/ecosystem/datax"
                            label="Explore more tools"
                            linkIcon={<ExternalLinkArrowIcon />}
                        ></ExternalLink>
                    </div>
                }
            />
            <EcomsystemCategory />
            {children}
            <GetStarted />
        </Layout>
    );
}
