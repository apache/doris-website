import { translate } from '@docusaurus/Translate';
import React from 'react';
import PageHeader from '@site/src/components/PageHeader';
import Layout from '@site/src/theme/Layout';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import ExternalLink from '@site/src/components/external-link/external-link';
import { NewIcon } from '@site/src/components/Icons/new-icon';
import DownloadForm from '@site/src/components/download-form/download-form';
import { DORIS_VERSIONS, OLD_VERSIONS, RUN_ANYWHERE } from '@site/src/constant/download.data';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';
import DownloadFormSimple from '@site/src/components/download-form/download-form-simple';
import Link from '@docusaurus/Link';
import './index.scss';

export default function Download() {
    return (
        <Layout
            title={translate({ id: 'download.title', message: 'Download' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
            wrapperClassName="download"
        >
            <PageHeader
                title="Quick Download & Easy Deployment"
                subtitle="Access the latest version and enjoy effortless deployment for your big data analytics needs."
                className="bg-white"
            />
            <div
                className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row"
                style={{
                    marginTop: '-5.5rem',
                }}
            >
                <CollapseBox
                    title="Apache Doris 2.0"
                    newLink={
                        <div className="flex items-center space-x-2 pb-8 text-[#0065FD]">
                            <NewIcon />
                            <ExternalLink
                                linkIcon={false}
                                to="/docs/releasenotes/release-2.0.3"
                                label="The latest version 2.0.3 is available now !"
                                className="bg-white p-0 text-[#444FD9]"
                            ></ExternalLink>
                        </div>
                    }
                    description="Apache Doris 2.0 milestone has merged over 4100 pull requests, representing a 70% increase from version 1.2 last year."
                    characteristic={[
                        '10 times faster data query',
                        'Enhanced log analytics and federated query capabilities',
                        'More efficient data writing and updates',
                        'Improved multi-tenant and resource isolation mechanisms',
                    ]}
                    rightContent={
                        <DownloadForm versions={DORIS_VERSIONS.filter(item => item.majorVersion === '2.0')} />
                    }
                    moreLink={
                        <ExternalLink
                            to="/docs/releasenotes/release-2.0.0"
                            className="bg-white p-0 text-[#444FD9]"
                            label="Learn more from release note"
                            linkIcon={<ExternalLinkArrowIcon />}
                        ></ExternalLink>
                    }
                    notes={
                        <>
                            Note: For detailed upgrade precautions, please refer to the{' '}
                            <Link className="text-primary underline" to="/docs/dev/install/standard-deployment">
                                deployment
                            </Link>{' '}
                            manual and cluster{' '}
                            <Link
                                className="text-primary underline"
                                to="/docs/dev/admin-manual/cluster-management/upgrade"
                            >
                                upgrade
                            </Link>{' '}
                            manual.
                        </>
                    }
                />
                <CollapseBox
                    title="Apache Doris 1.2 ( Stable )"
                    newLink={
                        <div className="flex items-center space-x-2 pb-8 text-[#0065FD]">
                            <NewIcon />
                            <ExternalLink
                                linkIcon={false}
                                to="/docs/releasenotes/release-1.2.7"
                                label="The latest version 1.2.7 is available now !"
                                className="bg-white p-0 text-[#444FD9]"
                            ></ExternalLink>
                        </div>
                    }
                    description="Apache Doris 1.2 enhance its functionality, performance, and reliability."
                    characteristic={[
                        'Full vectorized execution engine, 3-11 times faster data query',
                        'Merge-on-write on Unique Key Model',
                        'Multi-Catalog to enhance data lake analytics',
                        'Light schema change at millisecond-level and DDL auto-synchronization',
                    ]}
                    rightContent={
                        <DownloadForm versions={DORIS_VERSIONS.filter(item => item.majorVersion === '1.2')} />
                    }
                    moreLink={
                        <ExternalLink
                            to="/docs/releasenotes/release-1.2.0"
                            className="bg-white p-0 text-[#444FD9]"
                            label="Learn more from release note"
                            linkIcon={<ExternalLinkArrowIcon />}
                        ></ExternalLink>
                    }
                    notes={
                        <>
                            Note: For detailed upgrade precautions, please refer to the{' '}
                            <Link className="text-primary underline" to="/docs/dev/install/standard-deployment">
                                deployment
                            </Link>{' '}
                            manual and cluster{' '}
                            <Link
                                className="text-primary underline"
                                to="/docs/dev/admin-manual/cluster-management/upgrade"
                            >
                                upgrade
                            </Link>{' '}
                            manual.
                        </>
                    }
                />
                <CollapseBox
                    expand={false}
                    title="Archived releases"
                    description={
                        <div>
                            <p>
                                We have collected all the code and binaries available from previous releases. For more
                                information on the latest release, please refer to the Docs.
                            </p>
                            <p className="mt-6">
                                Kindly note that older releases are provided for archival purposes only, and are no
                                longer supported.
                            </p>
                        </div>
                    }
                    rightContent={<DownloadFormSimple versions={OLD_VERSIONS} />}
                    moreLink={
                        <ExternalLink
                            to="/docs/releasenotes/release-2.0.3"
                            className="bg-white p-0 text-[#444FD9] -mt-6"
                            label="View more"
                            linkIcon={<ExternalLinkArrowIcon />}
                        ></ExternalLink>
                    }
                />
            </div>
            <a id="runAnywhere" className="scroll-mt-20"></a>
            <div className="run-anywhere pt-[5.5rem] pb-[7.5rem]">
                <div className="container mx-auto">
                    <h3 className="text-center text-[#1D1D1D] text-[2.5rem] font-medium">Run anywhere</h3>
                    <ul className="mt-10 grid gap-x-6 gap-y-3 lg:grid-cols-3 lg:gap-y-0">
                        {RUN_ANYWHERE.map(item => (
                            <Link
                                href={item.link}
                                key={item.title}
                                className="relative bg-white flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-b-4 border-b-[#444FD9] py-[2rem] px-[1.5rem] shadow-[inset_0_0_0_1px_#444FD9] hover:no-underline"
                            >
                                <div className="text-2xl text-[#1D1D1D]">{item.title}</div>
                                <div className="mt-4 text-base text-center text-[#4C576C]">{item.description}</div>
                                <div className="flex items-center mt-4 text-[#444FD9]">
                                    Learn more
                                    <ExternalLinkArrowIcon className="ml-1" />
                                </div>
                            </Link>
                        ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
