import Translate, { translate } from '@docusaurus/Translate';
import React, { useEffect, useState } from 'react';
import DownloadFormAllRelease from '@site/src/components/download-form/download-form-all-release';
import DownloadFormTools from '@site/src/components/download-form/download-form-tools';
import {
    CPUEnum,
    DORIS_VERSIONS,
    DownloadTypeEnum,
    ORIGIN,
    VersionEnum,
} from '@site/src/constant/download.data';
import Link from '@docusaurus/Link';
import './download-page.scss';
import LinkWithArrow from '@site/src/components/link-arrow';
import clsx from 'clsx';
import { ALL_VERSIONS, TOOL_VERSIONS } from '@site/src/constant/download.data';
import * as semver from 'semver';
import { CheckedIcon } from '@site/src/components/Icons/checked-icon';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';

const BINARY_VERSION = [
    { label: `${VersionEnum.Latest} ( Latest )`, value: VersionEnum.Latest },
    { label: `${VersionEnum.Prev} ( Stable )`, value: VersionEnum.Prev },
];

export default function DownloadFormNext(): JSX.Element {
    const [version, setVersion] = useState<string>(VersionEnum.Latest);
    const [cpus, setCpus] = useState<any[]>([]);
    const [cpu, setCPU] = useState<string>(CPUEnum.X64);
    const [downloadInfo, setDownloadInfo] = useState<any>({});
    const [releaseFlag, setReleaseFlag] = useState<boolean>(true);
    const [downloadType, setDownloadType] = useState(DownloadTypeEnum.Binary);
    const [releaseNote, setReleaseNote] = useState('/docs/dev/releasenotes/v4.0/release-4.0.0');

    const changeVersion = (val: string) => {
        setVersion(val);
    };

    const changeCPU = (val: string) => {
        setCPU(val);
        const nextDownloadInfo = cpus.find(item => item.value === val);
        if (!nextDownloadInfo || typeof nextDownloadInfo.gz !== 'string') {
            setDownloadInfo({});
            return;
        }
        const filename = nextDownloadInfo.gz.split(ORIGIN)[1];
        nextDownloadInfo.filename = filename;
        setDownloadInfo(nextDownloadInfo);
    };

    const getIssueCode = (code: string) => {
        switch (code) {
            case '1.2.1':
                return 15508;
            case '1.2.2':
                return 16446;
            case '1.2.3':
                return 17748;
            case '1.2.4':
                return 18762;
            case '1.2.5':
                return 20827;
            case '1.2.6':
                return 21805;
            case '1.2.7':
                return 23711;
            case '1.2.8':
                return 31673;
            default:
                return null;
        }
    };

    function toDocsRelease(version: string) {
        const SUPPORTED_VERSION = '>=1.1.0';
        const versionNumber = version.match(/[0-9].[0-9].[0-9]*/)?.[0] || '0.0.0';
        return semver.satisfies(versionNumber, SUPPORTED_VERSION);
    }

    function onValuesChange(values: any) {
        setReleaseFlag(values.version[0] === '1.1' ? false : true);
        if (!toDocsRelease(values.version[1])) {
            setReleaseNote('https://github.com/apache/doris/releases');
        } else if (values.version[0] === '1.2') {
            setReleaseNote(`https://github.com/apache/doris/issues/${getIssueCode(values.version[1])}`);
        } else if (['3.0', '2.0', '3.1', '2.1'].includes(values.version[0])) {
            setReleaseNote(
                `/docs/${values.version[0] === '3.0' || values.version[0] === '3.1' ? '3.x' : values.version[0]}/releasenotes/v${
                    values.version[0]
                }/release-${values.version[1]}`,
            );
        } else if (values.version[0] === '4.0') {
            setReleaseNote(`/docs/dev/releasenotes/v${values.version[0]}/release-${values.version[1]}`);
        } else {
            setReleaseNote(`/docs/releasenotes/v${values.version[0]}/release-${values.version[1]}`);
        }
    }

    useEffect(() => {
        const currentVersion = DORIS_VERSIONS.find(doris_version => doris_version.value === version);
        if (!currentVersion || !Array.isArray(currentVersion.children)) {
            setCpus([]);
            setCPU(CPUEnum.X64);
            setDownloadInfo({});
            return;
        }
        setCpus(currentVersion.children);
        setCPU(CPUEnum.X64);
        const nextDownloadInfo: any = currentVersion.children.find(item => item.value === CPUEnum.X64);
        if (!nextDownloadInfo || typeof nextDownloadInfo.gz !== 'string') {
            setDownloadInfo({});
            return;
        }
        const filename = nextDownloadInfo.gz.split(ORIGIN)[1];
        nextDownloadInfo.filename = filename;
        setDownloadInfo(nextDownloadInfo);
    }, [version]);

    return (
        <LayoutNext
            title={translate({
                id: 'download.title',
                message: 'Apache Doris - Download | Easily deploy Doris anywhere',
            })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message:
                    'Download and explore precompiled binaries of different verisons. Apache Doris connects any device, at any scale, anywhere.',
            })}
        >
            <div className="download-next">
                {/* ── Hero ─────────────────────────────────────────────────────── */}
                <section className="download-next__hero">
                    <div className="download-next__hero-bg-glow" aria-hidden="true" />
                    <div className="download-next__hero-bg-grid" aria-hidden="true" />
                    <div className="download-next__hero-inner">
                        <h1 className="download-next__title">
                            <span className="download-next__title-line">Quick Download</span>
                            <span className="download-next__title-line">
                                & <span className="download-next__title-accent">Easy Deployment</span>
                            </span>
                        </h1>
                        <p className="download-next__sub">
                            Download verified binaries or source tarballs of every Apache Doris release, and deploy
                            anywhere — bare metal, Kubernetes, or cloud.
                        </p>
                    </div>
                </section>

                {/* ── Quick download card ─────────────────────────────────────── */}
                <section className="download-next__quick">
                    <div className="download-next__quick-inner">
                        <div className="download-next__quick-card">
                            <div className="download-next__quick-row">
                                <label className="download-next__quick-label">
                                    <Translate id="download.version" description="Binary Version">
                                        Version
                                    </Translate>
                                </label>
                                <div className="download-next__seg">
                                    {BINARY_VERSION.map(item => (
                                        <button
                                            type="button"
                                            className={clsx('download-next__seg-item', {
                                                'is-checked': version === item.value,
                                            })}
                                            key={item.value}
                                            onClick={() => changeVersion(item.value)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="download-next__quick-row">
                                <label className="download-next__quick-label">
                                    <Translate id="download.cpu.model" description="Architecture">
                                        Architecture
                                    </Translate>
                                </label>
                                <div className="download-next__seg">
                                    {cpus.map(item => (
                                        <button
                                            type="button"
                                            className={clsx('download-next__seg-item', {
                                                'is-checked': cpu === item.value,
                                            })}
                                            key={item.value}
                                            onClick={() => changeCPU(item.value)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="download-next__quick-row">
                                <label className="download-next__quick-label">
                                    <Translate id="download.download.link" description="Download">
                                        Tarball
                                    </Translate>
                                </label>
                                <div className="download-next__seg">
                                    <button
                                        type="button"
                                        onClick={() => setDownloadType(DownloadTypeEnum.Binary)}
                                        className={clsx('download-next__seg-item', {
                                            'is-checked': downloadType === DownloadTypeEnum.Binary,
                                        })}
                                    >
                                        Binary
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDownloadType(DownloadTypeEnum.Source)}
                                        className={clsx('download-next__seg-item', {
                                            'is-checked': downloadType === DownloadTypeEnum.Source,
                                        })}
                                    >
                                        Source
                                    </button>
                                </div>
                            </div>

                            {downloadInfo && (downloadInfo.filename || downloadInfo.version) && (
                                <div className="download-next__quick-row download-next__quick-row--file">
                                    <label className="download-next__quick-label" />
                                    <div className="download-next__file">
                                        {downloadType === DownloadTypeEnum.Binary ? (
                                            <>
                                                <Link className="download-next__file-name" to={downloadInfo.gz}>
                                                    {downloadInfo.filename}
                                                </Link>
                                                <span className="download-next__file-meta">
                                                    (
                                                    <Link to={downloadInfo.asc}>ASC</Link>
                                                    {', '}
                                                    <Link to={downloadInfo.sha512}>SHA-512</Link>
                                                    )
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    className="download-next__file-name"
                                                    to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz`}
                                                >
                                                    {`apache-doris-${downloadInfo.version}-src.tar.gz`}
                                                </Link>
                                                <span className="download-next__file-meta">
                                                    (
                                                    <Link
                                                        to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz.asc`}
                                                    >
                                                        ASC
                                                    </Link>
                                                    {', '}
                                                    <Link
                                                        to={`${downloadInfo.source}apache-doris-${downloadInfo.version}-src.tar.gz.sha512`}
                                                    >
                                                        SHA-512
                                                    </Link>
                                                    )
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="download-next__quick-note">
                                Note: For Apache Doris version specifics, please refer to the{' '}
                                <Link to="https://doris.apache.org/community/release-and-verify/release-versioning">
                                    release versioning.
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── All releases ────────────────────────────────────────────── */}
                <section className="download-next__section">
                    <div className="download-next__section-inner">
                        <h2 className="download-next__section-title">Doris All Releases</h2>
                        <div className="download-next__split">
                            <div className="download-next__split-intro">
                                <div className="download-next__split-text">
                                    <p>
                                        Doris is released as source code tarballs with corresponding binary tarballs
                                        for convenience. The downloads should be verified for tampering using ASC or
                                        SHA-512.
                                    </p>
                                    <p>For more information on the latest release, please refer to the Docs.</p>
                                    <p>
                                        Kindly note that older releases (v1.2, v1.1, v0.x) are provided for archival
                                        purposes only, and are no longer supported.
                                    </p>
                                </div>
                                {releaseFlag && (
                                    <div>
                                        <LinkWithArrow to="/releases/all-release" text="Release note" />
                                    </div>
                                )}
                                <p className="download-next__split-note">
                                    Note: For detailed upgrade precautions, please refer to the{' '}
                                    <Link to="/docs/dev/install/intro">deployment</Link> manual and cluster{' '}
                                    <Link to="/docs/dev/admin-manual/cluster-management/upgrade">upgrade</Link>{' '}
                                    manual.
                                </p>
                            </div>
                            <div className="download-next__split-card">
                                <DownloadFormAllRelease
                                    versions={ALL_VERSIONS}
                                    onValuesChange={(values: any) => onValuesChange(values)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Ecosystem tools ─────────────────────────────────────────── */}
                <a id="doris-ecosystem" className="scroll-mt-20"></a>
                <section className="download-next__section">
                    <div className="download-next__section-inner">
                        <h2 className="download-next__section-title">Doris Ecosystem</h2>
                        <div className="download-next__split">
                            <div className="download-next__split-intro">
                                <div className="download-next__split-text">
                                    <p>Streamline integration and data loading with Doris tools.</p>
                                </div>
                                <ul className="download-next__tool-list">
                                    <li>
                                        <CheckedIcon />
                                        <span>Kafka Doris Connector</span>
                                    </li>
                                    <li>
                                        <CheckedIcon />
                                        <span>Flink Doris Connector</span>
                                    </li>
                                    <li>
                                        <CheckedIcon />
                                        <span>Spark Doris Connector</span>
                                    </li>
                                    <li>
                                        <CheckedIcon />
                                        <span>Doris Streamloader</span>
                                    </li>
                                </ul>
                                <div>
                                    <LinkWithArrow
                                        to="/docs/4.x/connection-integration/data-integration/intro"
                                        text="More Tools"
                                    />
                                </div>
                            </div>
                            <div className="download-next__split-card">
                                <DownloadFormTools data={TOOL_VERSIONS} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Run anywhere ────────────────────────────────────────────── */}
                <a id="runAnywhere" className="scroll-mt-20"></a>
                <section className="download-next__run">
                    <div className="download-next__run-inner">
                        <Link
                            to="/docs/dev/install/intro"
                            className="download-next__run-card download-next__run-card--single"
                        >
                            <div className="download-next__run-card-body">
                                <h2 className="download-next__run-card-title">Run anywhere</h2>
                                <p className="download-next__run-card-desc">
                                    Deploy Doris in your environment of choice — from bare metal to Kubernetes to the
                                    cloud.
                                </p>
                                <span className="download-next__run-card-cta">
                                    Explore deployment options
                                    <svg
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="12"
                                        viewBox="0 0 16 14"
                                        fill="none"
                                    >
                                        <path
                                            d="M9.37549 12.3542L14.8755 6.85419L9.37549 1.35419"
                                            stroke="currentColor"
                                            strokeWidth="1.65"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M1.12549 6.85419L14.8755 6.85419"
                                            stroke="currentColor"
                                            strokeWidth="1.65"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </LayoutNext>
    );
}
