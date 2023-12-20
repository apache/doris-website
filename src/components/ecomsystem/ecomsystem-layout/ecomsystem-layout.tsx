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
            title={translate({ id: 'ecosystem.title', message: 'Ecosystem' })}
            // TODO update description
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
            wrapperClassName="ecosystem"
        >
            <PageHeader
                title="Ecosystem"
                subtitle="Break complexity in data integration and cluster management."
                className="py-[7.5rem]"
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
