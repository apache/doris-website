import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import Layout from '../../theme/Layout';
import Link from '@docusaurus/Link';
import More from '@site/src/components/More';
import PageColumn from '@site/src/components/PageColumn';
import React, { useEffect, useState } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import './index.scss';
import {
    CPUEnum,
    DownloadLinkProps,
    JDKEnum,
    VersionEnum,
    getAllDownloadLinks,
    getAllFlinkConnectorDownloadLinks,
    getAllSparkConnectorDownloadLinks,
    getAllRelease,
} from '@site/src/constant/download.data';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';

const BINARY_VERSION = [
    { label: `${VersionEnum.Latest} ( Latest )`, value: VersionEnum.Latest },
    { label: `${VersionEnum.Prev} ( Stable )`, value: VersionEnum.Prev },
    { label: `${VersionEnum.Earlier} ( Stable )`, value: VersionEnum.Earlier },
];

const JDK = [
    { label: 'JDK 8', value: JDKEnum.JDK8 },
    { label: 'JDK 11', value: JDKEnum.JDK11 },
];

export default function Download(): JSX.Element {
    const {
        siteConfig,
        i18n: { currentLocale, locales, localeConfigs },
    } = useDocusaurusContext();

    const [version, setVersion] = useState<string>(VersionEnum.Latest);
    const [cpus, setCpus] = useState<any[]>([]);
    const [cpu, setCPU] = useState<string>(CPUEnum.IntelAvx2);
    const [jdk, setJDK] = useState<string>(JDKEnum.JDK8);
    const [current, setCurrent] = useState<DownloadLinkProps>();
    const [downloadWay, setDownloadWay] = useState<string>('all-in-one');

    const FLINK_CONNECTOR = getAllFlinkConnectorDownloadLinks(currentLocale);
    const SPARK_CONNECTOR = getAllSparkConnectorDownloadLinks(currentLocale);
    const ALL_RELEASE = getAllRelease(currentLocale);
    let ALL_RELEASE_VERSION = {};
    ALL_RELEASE.forEach(item => {
        const info: any = Array.isArray(item.download) ? item.download.find(item => item.cpu === 'X64 ( avx2 )') : {};
        ALL_RELEASE_VERSION[item.version] = {
            cpu: CPUEnum.IntelAvx2,
            binary: info.binary,
            source: info.source,
        };
    });
    const [releaseUrls, setReleaseUrls] = useState(ALL_RELEASE_VERSION);

    const changeVersion = (val: string) => {
        setVersion(val);
    };
    const changeCPU = (val: string) => {
        setCPU(val);
    };
    const changeJDK = (val: string) => {
        // if (version === VersionEnum.Latest && val !== JDKEnum.JDK8) return;
        if (val !== JDKEnum.JDK8) return;
        setJDK(val);
    };

    const getDownloadLinks = () => {
        const text = `${version}-${cpu}-${jdk}`;
        const linkObj = getAllDownloadLinks(currentLocale).find(item => item.id === text);
        setCurrent(linkObj);
        if (linkObj && !linkObj.sh) {
            setDownloadWay('download');
        }
    };

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

    const downloadDocument = () => {
        const url =
            currentLocale === 'en'
                ? 'https://cdnd.selectdb.com/assets/files/Apache Doris Docs (English).pdf'
                : 'https://cdnd.selectdb.com/assets/files/Apache Doris Docs (中文).pdf';
        downloadFile(url);
    };

    const CPU = [
        { label: 'X64 ( avx2 )', value: CPUEnum.IntelAvx2 },
        { label: 'X64 ( no avx2 )', value: CPUEnum.IntelNoAvx2 },
        { label: 'ARM64', value: CPUEnum.ARM },
    ];

    const getCpus = version => {
        const currentCpus = [];
        getAllDownloadLinks(currentLocale).forEach(item => {
            if (item.id.includes(version)) {
                const matchCpu = CPU.find(cpu => item.id.includes(cpu.value));
                currentCpus.push(matchCpu);
            }
        });
        return currentCpus;
    };

    useEffect(() => {
        getDownloadLinks();
    }, [version, cpu, jdk]);

    useEffect(() => {
        const currentCpus = getCpus(version);
        setCpus(currentCpus);
        setCPU(CPUEnum.IntelAvx2);
        setJDK(JDKEnum.JDK8);
    }, [version]);

    function handleCPUChange(cpu: any, currentVersionInfo: any) {
        const info = currentVersionInfo.download.find(item => item.cpu === cpu);
        setReleaseUrls({
            ...releaseUrls,
            [currentVersionInfo.version]: {
                binary: info.binary,
                source: info.source,
            },
        });
    }

    return (
        <Layout
            title={translate({ id: 'download.title', message: 'Download' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
            wrapperClassName="download"
        >
            <section className="quick-download">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.quick.download" description="Quick Download">
                            Quick Download
                        </Translate>
                    }
                >
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
                                <Translate id="download.cpu.model" description="CPU Model">
                                    CPU Model
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
                        {/* <div className="download-type">
                            <label>
                                <Translate id="download.jdk.version" description="JDK Version">
                                    JDK Version
                                </Translate>
                            </label>
                            <div className="tabs-radio">
                                {JDK.map(item => (
                                    <div
                                        className={clsx('radio', {
                                            checked: jdk === item.value,
                                            // disabled: version === VersionEnum.Latest && item.value !== JDKEnum.JDK8,
                                            disabled: item.value !== JDKEnum.JDK8,
                                        })}
                                        key={item.value}
                                        onClick={() => changeJDK(item.value)}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div> */}
                        {current && current?.sh && (
                            <div className="download-type">
                                <label>
                                    <Translate id="download.download.link" description="Download">
                                        Download
                                    </Translate>
                                </label>
                                <div className="tabs-radio">
                                    <div
                                        onClick={() => setDownloadWay('all-in-one')}
                                        className={clsx('radio', {
                                            checked: downloadWay === 'all-in-one',
                                        })}
                                    >
                                        <span>{currentLocale === 'zh-CN' ? '二进制' : 'Binary'}</span>
                                    </div>

                                    <div
                                        onClick={() => setDownloadWay('download')}
                                        className={clsx('radio', {
                                            checked: downloadWay === 'download',
                                        })}
                                    >
                                        <span>{currentLocale === 'zh-CN' ? '源码' : 'Source'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="download-type way">
                            <label>
                                {!current?.sh && (
                                    <Translate id="download.download.link" description="Download">
                                        Download
                                    </Translate>
                                )}
                            </label>
                            <div
                                className={clsx('download-way all-in-one', {
                                    show: downloadWay === 'all-in-one',
                                })}
                            >
                                {current && current.sh && (
                                    <div className="tabs-radio">
                                        <div className="radio">
                                            <div className="inner" key={current.sh?.label}>
                                                <Link to={current.sh?.links.source}>{current.sh?.label}</Link>
                                                <span> ( </span>
                                                <Link to={current.sh?.links.signature}>asc</Link>,{' '}
                                                <Link to={current.sh?.links.sha512}>sha512</Link>
                                                <span> )</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {version === VersionEnum.Latest && (
                                    <div className="tips">
                                        <div className="title">
                                            <Translate id="Notice">Notice</Translate>
                                            {currentLocale === 'zh-CN' ? '：' : ':'}
                                        </div>
                                        {currentLocale === 'zh-CN' ? (
                                            <div className="notice-text">
                                                详细升级注意事项请参考
                                                <Link to="https://github.com/apache/doris/issues/22647">
                                                    2.0.0 Release Note
                                                </Link>
                                                以及
                                                <Link to="/docs/dev/install/standard-deployment">
                                                    <Translate id="Installation and deployment">
                                                        Installation and deployment
                                                    </Translate>
                                                </Link>
                                                以及
                                                <Link to="/docs/dev/admin-manual/cluster-management/upgrade">
                                                    <Translate id="Cluster Upgrade">Cluster Upgrade</Translate>
                                                </Link>
                                                手册。
                                            </div>
                                        ) : (
                                            <div className="notice-text">
                                                For detailed upgrade precautions, please refer to the{' '}
                                                <Link to="https://github.com/apache/doris/issues/22647">2.0.0</Link>
                                                and the
                                                <Link to="/docs/dev/install/standard-deployment">deployment</Link> and
                                                cluster
                                                <Link to="/docs/dev/admin-manual/cluster-management/upgrade">
                                                    upgrade
                                                </Link>
                                                manual.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div
                                className={clsx('download-way', {
                                    show: downloadWay === 'download',
                                })}
                            >
                                <div className="tabs-radio">
                                    <div className="radio">
                                        {current?.items.map(item => (
                                            <div className="inner" key={item.label}>
                                                <Link to={item?.links.source}>{item?.label}</Link>
                                                <span> ( </span>
                                                <Link to={item?.links.signature}>asc</Link>,{' '}
                                                <Link to={item?.links.sha512}>sha512</Link>
                                                <span> )</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageColumn>
            </section>
            <section className="table-content">
                <PageColumn
                    align="left"
                    title={<Translate id="download.release">All Releases</Translate>}
                    footer={
                        <More
                            text={<Translate id="download.release.more">More</Translate>}
                            link="https://archive.apache.org/dist/doris/"
                        />
                    }
                >
                    <div className="content">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <Translate id="download.all.release.version">Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.all.release.date">Release Date</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.cpu.model">CPU Model</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.all.release.download">Download</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.all.release.note">Release Notes</Translate>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_RELEASE.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>
                                            {/* <DropdownNavbarItem items={item.download} />, */}

                                            {Array.isArray(item.download) ? (
                                                <select
                                                    style={{ height: 30 }}
                                                    onChange={e => handleCPUChange(e.target.value, item)}
                                                >
                                                    {item.download.map(item => (
                                                        <option key={item.cpu} value={item.cpu}>
                                                            {item.cpu}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <></>
                                            )}
                                        </td>
                                        <td>
                                            {Array.isArray(item.download) ? (
                                                <div>
                                                    <Link to={releaseUrls[item.version].source}>
                                                        <Translate id="download.source">Source</Translate>
                                                    </Link>
                                                    <span style={{ padding: '0 0.28rem' }}>/</span>
                                                    <Link to={releaseUrls[item.version].binary}>
                                                        <Translate id="download.all.binary">Binary</Translate>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link to={item.download}>
                                                    <Translate id="download.source.binary">Source / Binary</Translate>
                                                </Link>
                                            )}
                                        </td>
                                        <td>
                                            <Link to={item.note}>Release Notes</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PageColumn>
            </section>
            <section className="table-content">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.flink.connector" description="Flink Doris Connector">
                            Flink Doris Connector
                        </Translate>
                    }
                >
                    <div className="content">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <Translate id="download.flink.connector.version">Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.flink.release.date">Release Date</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.flink.version">Flink Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.flink.scala.version">Scala Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.flink.doris.version">Doris Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.source">Source</Translate>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {FLINK_CONNECTOR.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>{item.flink}</td>
                                        <td>{item.scala}</td>
                                        <td>{item.doris}</td>
                                        <td>
                                            <Link to={item.download}>
                                                <Translate id="download">Download</Translate>
                                            </Link>
                                            <Link to={item.github}>GitHub</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PageColumn>
            </section>
            <section className="maven">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.maven" description="Maven">
                            Maven
                        </Translate>
                    }
                >
                    <CodeBlock language="xml" title="" showLineNumbers>
                        {`<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>flink-doris-connector-1.14_2.12</artifactId>
  <!--artifactId>flink-doris-connector-1.13_2.12</artifactId-->
  <!--artifactId>flink-doris-connector-1.12_2.12</artifactId-->
  <!--artifactId>flink-doris-connector-1.11_2.12</artifactId-->
  <!--version>1.0.3</version-->
  <version>1.1.0</version>
</dependency>`}
                    </CodeBlock>
                </PageColumn>
            </section>
            <section className="table-content">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.spark.connector" description="Spark Doris Connector">
                            Spark Doris Connector
                        </Translate>
                    }
                >
                    <div className="content">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <Translate id="download.spark.connector.version">Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.spark.release.date">Release Date</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.spark.version">Spark Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.spark.scala.version">Scala Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.spark.doris.version">Doris Version</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.source">Source</Translate>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {SPARK_CONNECTOR.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>{item.spark}</td>
                                        <td>{item.scala}</td>
                                        <td>{item.doris}</td>
                                        <td>
                                            <Link to={item.download}>
                                                <Translate id="download">Download</Translate>
                                            </Link>
                                            <Link to={item.github}>GitHub</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </PageColumn>
            </section>
            <section className="maven">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.maven" description="Maven">
                            Maven
                        </Translate>
                    }
                >
                    <CodeBlock language="xml" title="" showLineNumbers>
                        {`<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>spark-doris-connector-3.2_2.12</artifactId>
  <!--artifactId>spark-doris-connector-3.1_2.12</artifactId-->
  <!--artifactId>spark-doris-connector-2.3_2.11</artifactId-->
  <!--version>1.0.1</version-->
  <version>1.1.0</version>
</dependency>`}
                    </CodeBlock>
                </PageColumn>
            </section>
            {/* <section className="table-content">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.document" description="文档">
                            Document
                        </Translate>
                    }
                >
                    <div className="content">
                        <p style={{ display: 'flex', alignItems: 'center' }}>
                            Click to download the latest
                            <span className="downlaod-document" onClick={downloadDocument}>
                                offline documents{' '}
                                <img
                                    style={{ width: '1.2rem', height: '1.2rem', paddingLeft: '0.2rem' }}
                                    src={require('@site/static/images/icon/download.png').default}
                                    alt=""
                                />
                            </span>
                        </p>
                    </div>
                </PageColumn>
            </section> */}
            <section className="verify">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="download.verify" description="Verify">
                            Verify
                        </Translate>
                    }
                >
                    <Translate id="download.verify.w1">To verify the downloaded files, please read</Translate>
                    <Link to="/community/release-and-verify/release-verify">
                        <Translate id="download.verify.w2"> Verify Apache Release </Translate>
                    </Link>
                    <Translate id="download.verify.w3"> and using these </Translate>
                    <Link to="https://downloads.apache.org/doris/KEYS">
                        <Translate id="download.verify.w4"> Keys</Translate>
                    </Link>
                    <Translate id="download.verify.w5">. After verification, please read</Translate>
                    <Link to="/docs/install/source-install/compilation">
                        <Translate id="download.verify.w6"> Compilation </Translate>
                    </Link>
                    <Translate id="download.verify.w7"> and </Translate>
                    <Link to="/docs/install/install-deploy">
                        <Translate id="download.verify.w8"> Installation and Deployment </Translate>
                    </Link>
                    <Translate id="download.verify.w9"> to compile and install Doris.</Translate>
                </PageColumn>
            </section>
        </Layout>
    );
}
