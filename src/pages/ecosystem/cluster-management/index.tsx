import React from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import ExternalLink from '@site/src/components/external-link/external-link';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import '../index.scss';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

export default function ClusterManagement() {
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <CollapseBox
                    title="Cluster Manager for Apache Doris"
                    description="One-stop database cluster management tool, developed by VeloDB."
                    characteristic={[
                        'Create, start, stop, upgrade, and scale clusters',
                        'Cluster inspection',
                        'Monitoring and alerting',
                        'Auditing',
                    ]}
                    rightContent={
                        <img src={require(`@site/static/images/ecomsystem/cluster-manage.png`).default} alt="" />
                    }
                    moreLink={
                        <>
                            <ExternalLink
                                href="https://www.velodb.io/download/enterprise#core"
                                label="Download"
                            ></ExternalLink>
                            <ExternalLink
                                href="https://docs.velodb.io/enterprise/velodb-enterprise-overview"
                                className="sub-btn"
                                label="Docs"
                            ></ExternalLink>
                        </>
                    }
                />
                <CollapseBox
                    title="Doris Operator"
                    description="Run Apache Doris on K8s, developed by VeloDB."
                    characteristic={[
                        'Diverse PV management',
                        'Pod deployment configuration ',
                        'Separation of config files and services',
                        'Smooth service upgrade',
                        'Auto-scaling',
                        'Support for Helm',
                    ]}
                    rightContent={
                        <img src={require(`@site/static/images/ecomsystem/doris-operator.png`).default} alt="" />
                    }
                    moreLink={
                        <>
                            <ExternalLink href="https://www.velodb.io/download/tools" label="Download"></ExternalLink>
                            <ExternalLink
                                href="https://doris.apache.org/docs/install/k8s-deploy/operator-deploy"
                                className="sub-btn"
                                label="Docs"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                        </>
                    }
                />
            </div>
        </EcomsystemLayout>
    );
}
