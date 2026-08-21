import Translate, { translate } from '@docusaurus/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import DownloadFormAllRelease from '@site/src/components/download-form/download-form-all-release';
import DownloadFormArchive from '@site/src/components/download-form/download-form-archive';
import DownloadFormTools from '@site/src/components/download-form/download-form-tools';
import {
    ACTIVE_HEADS,
    ACTIVE_TOOL_VERSIONS,
    ACTIVE_VERSIONS,
    ARCHIVED_TOOL_VERSIONS,
    ARCHIVED_VERSIONS,
    CPUEnum,
    DownloadTypeEnum,
    findCoreRelease,
    ORIGIN,
    TOOL_RELEASE_NOTES,
    ToolsEnum,
} from '@site/src/constant/download.data';
import './download-page.scss';
import LinkWithArrow from '@site/src/components/link-arrow';
import { CheckedIcon } from '@site/src/components/Icons/checked-icon';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';

const KEYS_URL = 'https://downloads.apache.org/doris/KEYS';
const VERIFY_URL = '/community/release-and-verify/release-verify';
const VERSIONING_URL = '/community/release-and-verify/release-versioning';
const SECURITY_URL = '/community/security';
const ASF_ARCHIVE_URL = 'https://archive.apache.org/dist/doris/';

const CPU_OPTIONS = [CPUEnum.X64, CPUEnum.X64NoAvx2, CPUEnum.ARM64];

/** Canonical release-note route: releasenotes/v4.1/release-4.1.3.md → /releases/v4.1/release-4.1.3 */
function releaseNotePath(branch: string, version: string) {
    return `/releases/v${branch}/release-${version}`;
}

export default function DownloadFormNext(): JSX.Element {
    const defaultHead = ACTIVE_HEADS[0];
    const [version, setVersion] = useState<string>(defaultHead?.version ?? '');
    const [cpu, setCpu] = useState<string>(CPUEnum.X64);
    const [downloadType, setDownloadType] = useState<DownloadTypeEnum>(DownloadTypeEnum.Binary);
    const [releaseNote, setReleaseNote] = useState<string>(
        defaultHead ? releaseNotePath(defaultHead.branch, defaultHead.version) : '/releases/all-release',
    );
    const [ecosystemTool, setEcosystemTool] = useState<ToolsEnum>(ToolsEnum.Kafka);

    /** Every CPU build of the release the quick card is currently showing. */
    const builds = useMemo(() => findCoreRelease(version)?.items ?? [], [version]);
    const build = useMemo(() => builds.find(item => item.value === cpu) ?? builds[0], [builds, cpu]);

    useEffect(() => {
        if (!builds.some(item => item.value === cpu)) setCpu(CPUEnum.X64);
    }, [builds]);

    const isSource = downloadType === DownloadTypeEnum.Source;

    const asset = useMemo(() => {
        if (!build) return null;
        if (isSource) {
            const base = `${build.source}apache-doris-${build.version}-src.tar.gz`;
            return {
                filename: `apache-doris-${build.version}-src.tar.gz`,
                gz: base,
                asc: `${base}.asc`,
                sha512: `${base}.sha512`,
            };
        }
        return {
            filename: typeof build.gz === 'string' ? build.gz.split(ORIGIN)[1] : '',
            gz: build.gz,
            asc: build.asc,
            sha512: build.sha512,
        };
    }, [build, isSource]);

    function onCoreVersionChange(values: any) {
        const [branch, release] = values.version || [];
        if (branch && release) setReleaseNote(releaseNotePath(branch, release));
    }

    const maintainedBranches = ACTIVE_VERSIONS.map(branch => branch.value).join(', ');

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
                            <span className="download-next__title-line">Download</span>
                            <span className="download-next__title-line">
                                Apache <span className="download-next__title-accent">Doris</span>
                            </span>
                        </h1>
                        <p className="download-next__sub">
                            Verified binaries and source tarballs for the release branches Apache Doris currently
                            maintains. Every download is signed and checksummed.
                        </p>
                        <div className="download-next__maintained">
                            <span className="download-next__maintained-dot" aria-hidden="true" />
                            Maintained branches — {maintainedBranches}
                        </div>
                    </div>
                </section>

                {/* ── Quick download ──────────────────────────────────────────── */}
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
                                    {ACTIVE_HEADS.map(head => (
                                        <button
                                            type="button"
                                            key={head.version}
                                            aria-pressed={version === head.version}
                                            className={clsx('download-next__seg-item', {
                                                'is-checked': version === head.version,
                                            })}
                                            onClick={() => setVersion(head.version)}
                                        >
                                            {head.version}
                                            <span className="download-next__seg-tag">{head.label}</span>
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
                                <div
                                    className={clsx('download-next__seg', {
                                        'is-muted': isSource,
                                    })}
                                >
                                    {CPU_OPTIONS.map(option => (
                                        <button
                                            type="button"
                                            key={option}
                                            disabled={isSource}
                                            aria-pressed={cpu === option}
                                            className={clsx('download-next__seg-item', {
                                                'is-checked': cpu === option,
                                            })}
                                            onClick={() => setCpu(option)}
                                        >
                                            {option}
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
                                    {[DownloadTypeEnum.Binary, DownloadTypeEnum.Source].map(option => (
                                        <button
                                            type="button"
                                            key={option}
                                            aria-pressed={downloadType === option}
                                            className={clsx('download-next__seg-item', {
                                                'is-checked': downloadType === option,
                                            })}
                                            onClick={() => setDownloadType(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {asset && (
                                <div className="download-next__file-row">
                                    <span className="download-next__quick-label" aria-hidden="true" />
                                    <div className="download-next__file">
                                        <code className="download-next__file-name">{asset.filename}</code>
                                        <div className="download-next__file-links">
                                            <Link to={asset.asc}>ASC</Link>
                                            <Link to={asset.sha512}>SHA-512</Link>
                                            <Link to={KEYS_URL}>KEYS</Link>
                                            <Link to={VERIFY_URL}>How to verify</Link>
                                        </div>
                                    </div>
                                    <Link className="download-next__download-btn" to={asset.gz}>
                                        Download
                                    </Link>
                                </div>
                            )}

                            <p className="download-next__quick-note">
                                Apache Doris maintains the two most recent minor branches, labelled Latest and Stable —
                                see <Link to={VERSIONING_URL}>release versioning</Link>. Releases from older branches
                                are <Link to="#archive">archived</Link>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Maintained core releases ────────────────────────────────── */}
                <section className="download-next__section">
                    <div className="download-next__section-inner">
                        <span className="download-next__eyebrow">Maintained</span>
                        <h2 className="download-next__section-title">Doris Releases</h2>
                        <div className="download-next__split">
                            <div className="download-next__split-intro">
                                <div className="download-next__split-text">
                                    <p>
                                        Doris is released as source tarballs, with binary tarballs built for
                                        convenience. Verify every download against its ASC signature or SHA-512 checksum
                                        before you deploy it.
                                    </p>
                                    <p>
                                        Every patch on a maintained branch is listed here. Patch releases are compatible
                                        in both directions, so moving to the newest patch on your branch needs no data
                                        migration.
                                    </p>
                                </div>
                                <div>
                                    <LinkWithArrow to={releaseNote} text="Release note" />
                                </div>
                                <p className="download-next__split-note">
                                    For upgrade precautions see the <Link to="/docs/dev/install/intro">deployment</Link>{' '}
                                    and{' '}
                                    <Link to="/docs/dev/admin-manual/cluster-management/upgrade">cluster upgrade</Link>{' '}
                                    manuals.
                                </p>
                            </div>
                            <div className="download-next__split-card">
                                <DownloadFormAllRelease
                                    versions={ACTIVE_VERSIONS}
                                    onValuesChange={onCoreVersionChange}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Maintained ecosystem ────────────────────────────────────── */}
                <a id="doris-ecosystem" className="scroll-mt-20"></a>
                <section className="download-next__section">
                    <div className="download-next__section-inner">
                        <span className="download-next__eyebrow">Maintained</span>
                        <h2 className="download-next__section-title">Doris Ecosystem</h2>
                        <div className="download-next__split">
                            <div className="download-next__split-intro">
                                <div className="download-next__split-text">
                                    <p>
                                        Connectors and tools for loading into and reading out of Doris. Only maintained
                                        versions are listed; older connector lines are in the{' '}
                                        <Link to="#archive">archive</Link>.
                                    </p>
                                </div>
                                <ul className="download-next__tool-list">
                                    {ACTIVE_TOOL_VERSIONS.map(tool => (
                                        <li key={tool.value}>
                                            <CheckedIcon />
                                            <span>{tool.label}</span>
                                            <span className="download-next__tool-version">
                                                {tool.children[0]?.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="download-next__ecosystem-links">
                                    <LinkWithArrow to={TOOL_RELEASE_NOTES[ecosystemTool]} text="Release Notes" />
                                    <LinkWithArrow
                                        to="/docs/4.x/connection-integration/data-integration/intro"
                                        text="More Tools"
                                    />
                                </div>
                            </div>
                            <div className="download-next__split-card">
                                <DownloadFormTools data={ACTIVE_TOOL_VERSIONS} onToolChange={setEcosystemTool} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Archive ─────────────────────────────────────────────────── */}
                <a id="archive" className="scroll-mt-20"></a>
                <section className="download-next__archive">
                    <div className="download-next__section-inner">
                        <h2 className="download-next__section-title download-next__section-title--archive">
                            Archived Releases
                        </h2>
                        <div className="download-next__split">
                            <div className="download-next__split-intro">
                                <p className="download-next__archive-lead">
                                    <strong>
                                        These versions receive no further releases of any kind, security patches
                                        included.
                                    </strong>{' '}
                                    A vulnerability found in one of them stays unfixed there, permanently.
                                </p>
                                <div className="download-next__archive-links">
                                    <Link to="/docs/dev/admin-manual/cluster-management/upgrade">Upgrade guide</Link>
                                    <Link to={SECURITY_URL}>Report a vulnerability to the ASF security team</Link>
                                    <Link to={ASF_ARCHIVE_URL}>archive.apache.org/dist/doris</Link>
                                </div>
                            </div>
                            <div className="download-next__split-card">
                                <DownloadFormArchive
                                    coreVersions={ARCHIVED_VERSIONS}
                                    toolVersions={ARCHIVED_TOOL_VERSIONS}
                                />
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
