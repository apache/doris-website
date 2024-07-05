import React from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import ExternalLink from '@site/src/components/external-link/external-link';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import '../index.scss';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

export default function DistributionsAndPackaging() {
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <CollapseBox
                    title="Doris Streamloader"
                    description="A robust, high-performance and user-friendly alternative to the traditional curl-based stream load."
                    characteristic={[
                        'Split data files automatically and perform parallel loading',
                        'Support multiple files and directories load with one shot',
                        'Support path traversal when the target is a directory',
                        'Resume loading from previous failures and cancellations',
                        'Retry automatically when failure',
                    ]}
                    rightContent={
                        <img src={require(`@site/static/images/ecomsystem/doris-stream-loader.png`).default} alt="" />
                    }
                    moreLink={
                        <>
                            <ExternalLink
                                href="https://doris.apache.org/docs/download#doris-ecosystem"
                                label="Download"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>

                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/doris-streamloader"
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
