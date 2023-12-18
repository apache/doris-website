import React from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import ExternalLink from '@site/src/components/external-link/external-link';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import '../index.scss';

export default function DistributionsAndPackaging() {
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <CollapseBox
                    title="VeloDB"
                    characteristic={[
                        'VeloDB is a modern data warehouse built on Apache Doris. It is designed to provide lightning-fast performance for large-scale real-time data processing. ',
                        'With cloud-native services and self-managed software on-premises, VeloDB offers a powerful solution developed by VeloDB Inc., a leading technology company headquartered in Singapore.',
                        'Businesses can leverage VeloDB to unlock invaluable insights from data with unparalleled efficiency.',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/velodb.png`).default} alt="" />}
                    moreLink={
                        <ExternalLink
                            href="https://www.velodb.io"
                            className="sub-btn"
                            label="Learn more"
                        ></ExternalLink>
                    }
                    showListIcon={false}
                />
                <CollapseBox
                    showListIcon={false}
                    title="SelectDB"
                    characteristic={[
                        'SelectDB is a modern data warehouse built on Apache Doris. It is designed to deliver exceptional speed and performance for processing real-time data at scale, offering cloud-native services and self-managed software on-premises. ',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/selectdb.png`).default} alt="" />}
                    moreLink={
                        <ExternalLink
                            href="https://www.selectdb.com"
                            className="sub-btn"
                            label="Learn more"
                        ></ExternalLink>
                    }
                />
            </div>
        </EcomsystemLayout>
    );
}
