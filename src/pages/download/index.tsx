import Translate, { translate } from '@docusaurus/Translate';
import React, { useEffect, useState, version } from 'react';
import PageHeader from '@site/src/components/PageHeader';
import Layout from '@site/src/theme/Layout';
import DownloadFormAllRelease from '@site/src/components/download-form/download-form-all-release';
import DownloadFormSimple from '@site/src/components/download-form/download-form-simple';
import {
    CPUEnum,
    DORIS_VERSIONS,
    DownloadTypeEnum,
    ORIGIN,
    RUN_ANYWHERE,
    VersionEnum,
} from '@site/src/constant/download.data';
import Link from '@docusaurus/Link';
import './index.scss';
import LinkWithArrow from '../../components/link-arrow';
import PageColumn from '@site/src/components/PageColumn';
import clsx from 'clsx';
import { ALL_VERSIONS, OLD_VERSIONS } from '../../constant/download.data';
import * as semver from 'semver';

const BINARY_VERSION = [
    { label: `${VersionEnum.Latest} ( Latest )`, value: VersionEnum.Latest },
    { label: `${VersionEnum.Prev} ( Stable )`, value: VersionEnum.Prev },
];

function downloadFile(url: string) {
    const a = document.createElement('a');
    a.download = url;
    a.href = url;
    a.target = '_blank';
    const clickEvt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
}
const CPU = [
    { label: 'X64 ( avx2 )', value: CPUEnum.X64 },
    { label: 'X64 ( no avx2 )', value: CPUEnum.X64NoAvx2 },
    { label: 'ARM64', value: CPUEnum.ARM64 },
];

export default function Download() {
    const [version, setVersion] = useState<string>(VersionEnum.Latest);
    const [currentVersionInfo, setCurrentVersionInfo] = useState(() => {
        return DORIS_VERSIONS.find(doris_version => doris_version.value === version);
    });
    const [cpus, setCpus] = useState<any[]>([]);
    const [cpu, setCPU] = useState<string>(CPUEnum.X64);
    const [downloadInfo, setDownloadInfo] = useState<any>({});
    const [downloadType, setDownloadType] = useState(DownloadTypeEnum.Binary);
    const [releaseNote, setReleaseNote] = useState('/docs/releasenotes/release-2.0.5');

    const changeVersion = (val: string) => {
        setVersion(val);
    };
    const changeCPU = (val: string) => {
        setCPU(val);
        const downloadInfo = cpus.find(item => item.value === val);
        const filename = downloadInfo.gz.split(ORIGIN)[1];
        downloadInfo.filename = filename;
        console.log(downloadInfo);
        setDownloadInfo(downloadInfo);
    };

    function toDocsRelease(version: string) {
        const SUPPORTED_VERSION = '>=1.1.0';
        const versionNumber = version.match(/[0-9].[0-9].[0-9]*/)?.[0] || '0.0.0';
        if (semver.satisfies(versionNumber, SUPPORTED_VERSION)) {
            return true;
        } else {
            return false;
        }
    }

    function onValuesChange(values: any) {
        if (!toDocsRelease(values.version[1])) {
            setReleaseNote('https://github.com/apache/doris/releases');
        } else {
            setReleaseNote(`/docs/releasenotes/release-${values.version[1]}`);
        }
    }

    useEffect(() => {
        const currentVersion = DORIS_VERSIONS.find(doris_version => doris_version.value === version);
        setCpus(currentVersion.children);
        setCPU(CPUEnum.X64);
        const downloadInfo: any = currentVersion.children.find(item => item.value === CPUEnum.X64);
        const filename = downloadInfo.gz.split(ORIGIN)[1];
        downloadInfo.filename = filename;
        setDownloadInfo(downloadInfo);
    }, [version]);

    // function handleCPUChange(cpu: any, currentVersionInfo: any) {
    //     const info = currentVersionInfo.download.find(item => item.cpu === cpu);
    //     setReleaseUrls({
    //         ...releaseUrls,
    //         [currentVersionInfo.version]: {
    //             binary: info.binary,
    //             source: info.source,
    //         },
    //     });
    // }
    return (
        <Layout
            title={translate({ id: 'download.title', message: 'Download' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
            wrapperClassName="download"
        >
            <PageHeader className="lg:pt-[5rem] g-white" title="Quick Download & Easy Deployment" />
            <section className="quick-download">
                <PageColumn align="center">
                    <span className="font-medium" style={{ fontSize: 40 }}>
                        Quick Download
                    </span>
                    <div className="download-box">
                        <div className="download-type">
                            <label>
                                <Translate id="download.version" description="Binary Version">
                                    Version
                                </Translate>
                            </label>
                            <div className="tabs-radio">
                                {BINARY_VERSION.map(item => (
                                    <div
                                        className={clsx('radio', {
                                            checked: version === item.value,
                                        })}
                                        key={item.value}
                                        onClick={() => changeVersion(item.value)}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="download-type">
                            <label>
                                <Translate id="download.cpu.model" description="Architecture">
                                    Architecture
                                </Translate>
                            </label>
                            <div className="tabs-radio">
                                {cpus.map(item => (
                                    <div
                                        className={clsx('radio', {
                                            checked: cpu === item.value,
                                        })}
                                        key={item.value}
                                        onClick={() => changeCPU(item.value)}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="download-type">
                            <label>
                                <Translate id="download.download.link" description="Download">
                                    Tarball
                                </Translate>
                            </label>
                            <div className="tabs-radio">
                                <div
                                    onClick={() => {
                                        setDownloadType(DownloadTypeEnum.Binary);
                                    }}
                                    className={clsx('radio', {
                                        checked: downloadType === DownloadTypeEnum.Binary,
                                    })}
                                >
                                    <span>Binary</span>
                                </div>

                                <div
                                    onClick={() => {
                                        setDownloadType(DownloadTypeEnum.Source);
                                    }}
                                    className={clsx('radio', {
                                        checked: downloadType === DownloadTypeEnum.Source,
                                    })}
                                >
                                    <span>Source</span>
                                </div>
                            </div>
                        </div>

                        <div className="download-type way">
                            <label></label>
                            <div className={clsx('download-way all-in-one show')}>
                                {downloadInfo && (
                                    <div className="tabs-radio">
                                        <div className="radio">
                                            {downloadType === DownloadTypeEnum.Binary ? (
                                                <div className="inner" key={downloadInfo.filename}>
                                                    <Link to={downloadInfo.gz}>{downloadInfo.filename}</Link>
                                                    <span> ( </span>
                                                    <Link to={downloadInfo.asc}>ASC</Link>,{' '}
                                                    <Link to={downloadInfo.sha512}>SHA-512</Link>
                                                    <span> )</span>
                                                </div>
                                            ) : (
                                                <div className="inner" key={downloadInfo.filename}>
                                                    <Link
                                                        to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz`}
                                                    >{`apache-doris-${downloadInfo.version}-src.tar.gz`}</Link>
                                                    <span> ( </span>
                                                    <Link
                                                        to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz.asc`}
                                                    >
                                                        ASC
                                                    </Link>
                                                    ,{' '}
                                                    <Link
                                                        to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz.sha512`}
                                                    >
                                                        SHA-512
                                                    </Link>
                                                    <span> )</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </PageColumn>
            </section>
            <PageColumn>
                <span
                    className="font-medium"
                    style={{ display: 'block', marginTop: 40, fontSize: 40, marginBottom: 32 }}
                >
                    All Releases
                </span>
                <div className="all-download">
                    <div className="all-download-intro">
                        <div className="all-download-intro-text">
                            <div>
                                Doris is released as source code tarballs with corresponding binary tarballs for
                                convenience. The downloads should be verified for tampering using ASC or SHA-512.
                            </div>
                            <div className="mt-[32px]">
                                For more information on the latest release, please refer to the Docs.
                            </div>
                            <div className="mt-[32px]">
                                Kindly note that older releases (v1.1, v0.x) are provided for archival purposes only,
                                and are no longer supported.
                            </div>
                        </div>
                        <div>
                            <LinkWithArrow to={releaseNote} text="Release note" />
                        </div>
                        <div className="all-download-note">
                            Note: For detailed upgrade precautions, please refer to the{' '}
                            <Link
                                to="/docs/install/standard-deployment"
                                style={{
                                    color: '#444FD9',
                                    cursor: 'pointer',
                                }}
                            >
                                deployment
                            </Link>{' '}
                            manual and cluster{' '}
                            <Link
                                style={{
                                    color: '#444FD9',
                                    cursor: 'pointer',
                                }}
                                to="/docs/admin-manual/cluster-management/upgrade"
                            >
                                upgrade
                            </Link>{' '}
                            manual.
                        </div>
                    </div>
                    <div className="all-download-card">
                        <DownloadFormAllRelease
                            versions={ALL_VERSIONS}
                            onValuesChange={(values: any) => onValuesChange(values)}
                        />
                    </div>
                </div>
            </PageColumn>
            <a id="runAnywhere" className="scroll-mt-20"></a>
            <div className="run-anywhere bg-[#F7F9FE] pt-[5.5rem] pb-[7.5rem] mt-[80px]">
                <div className="container mx-auto">
                    <h3 className="text-center text-[#1D1D1D] text-[2.5rem] font-medium">Run anywhere</h3>
                    <ul className="mt-10 grid gap-x-6 gap-y-3 lg:grid-cols-3 lg:gap-y-0">
                        {RUN_ANYWHERE.map(item =>
                            item.title !== 'Doris on AWS' ? (
                                <Link
                                    href={item.link}
                                    key={item.title}
                                    className="run-anywhere-card relative bg-white flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-b-4 border-b-[#444FD9] py-[2rem] px-4 lg:px-[1.5rem] shadow-[inset_0_0_0_1px_#444FD9] hover:no-underline"
                                >
                                    <div className="text-2xl text-[#1D1D1D]">{item.title}</div>
                                    <div className="mt-4 text-base text-center text-[#4C576C]">{item.description}</div>
                                    <div className="flex items-center mt-4 text-[#444FD9]">
                                        <LinkWithArrow to={item.link} text="Learn more" />
                                    </div>
                                </Link>
                            ) : (
                                <section>
                                    <div className="relative bg-white flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-b-4 border-b-[#444FD9] py-[2rem] px-4 lg:px-[1.5rem] shadow-[inset_0_0_0_1px_#444FD9] hover:no-underline">
                                        <div className="text-2xl text-[#1D1D1D]">{item.title}</div>
                                        <div className="mt-4 text-base text-center text-[#4C576C]">
                                            {item.description}
                                        </div>
                                        <div className="flex items-center mt-4">
                                            <span>Coming soon</span>
                                        </div>
                                    </div>
                                </section>
                            ),
                        )}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
