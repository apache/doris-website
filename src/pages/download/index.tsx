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

const BINARY_VERSION = [
    { label: `${VersionEnum.Latest} ( latest )`, value: VersionEnum.Latest },
    { label: VersionEnum.Prev, value: VersionEnum.Prev },
];
const CPU = [
    { label: 'X64 ( avx2 )', value: CPUEnum.IntelAvx2 },
    { label: 'X64 ( no avx2 )', value: CPUEnum.IntelNoAvx2 },
    { label: 'ARM64', value: CPUEnum.ARM },
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
    const [cpu, setCPU] = useState<string>(CPUEnum.IntelAvx2);
    const [jdk, setJDK] = useState<string>(JDKEnum.JDK8);
    const [current, setCurrent] = useState<DownloadLinkProps>();

    const FLINK_CONNECTOR = getAllFlinkConnectorDownloadLinks(currentLocale);
    const SPARK_CONNECTOR = getAllSparkConnectorDownloadLinks(currentLocale);
    const ALL_RELEASE = getAllRelease(currentLocale);

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
    };

    useEffect(() => {
        getDownloadLinks();
    }, [version, cpu, jdk]);

    useEffect(() => {
        setCPU(CPUEnum.IntelAvx2);
        setJDK(JDKEnum.JDK8);
    }, [version]);
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
                                <Translate id="download.binary.version" description="Binary Version">
                                    Binary Version
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
                                {CPU.map(item => (
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
                        <div className="download-type">
                            <label>
                                <Translate id="download.download.link" description="Download">
                                    Download
                                </Translate>
                            </label>
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
                        <div className="tips">
                            <div className="title">
                                <Translate id="Notice">Notice</Translate>
                                {currentLocale === 'zh-CN' ? '：' : ':'}
                            </div>
                            <ul>
                                {version === VersionEnum.Latest ? (
                                    <>
                                        {currentLocale === 'zh-CN' ? (
                                            <li>
                                                由于 Apache 服务器文件大小限制，1.2
                                                版本的二进制程序被分为三个包，其中新增的
                                                apache-doris-java-udf-jar-with-dependencies 用于支持 JDBC 外表和 JAVA
                                                UDF ，下载后需要将其中放到
                                                <code>be/lib</code>
                                                目录下。详细升级注意事项请参考
                                                <Link to="/docs/dev/releasenotes/release-1.2.0">
                                                    1.2.0 Release Note
                                                </Link>
                                                以及
                                                <Link to="/docs/dev/install/install-deploy">
                                                    <Translate id="Installation and deployment">
                                                        Installation and deployment
                                                    </Translate>
                                                </Link>
                                                以及
                                                <Link to="/docs/dev/admin-manual/cluster-management/upgrade">
                                                    <Translate id="Cluster Upgrade">Cluster Upgrade</Translate>
                                                </Link>
                                                手册。
                                            </li>
                                        ) : (
                                            <li>
                                                Due to file size limitations, the binary for version 1.2.0 is divided
                                                into three packages. The `apache-doris-java-udf-jar-with-dependencies`
                                                package is used to support the new JDBC expansion table and JAVA UDF.
                                                After downloading, you need to put the
                                                `java-udf-jar-with-dependencies.jar` in the <code>be/lib</code>
                                                directory to start BE, otherwise it will not start successfully.
                                            </li>
                                        )}
                                        <li>
                                            <Translate id="download.quick.download.notice">
                                                Version 1.2.0 does not support running with JDK11, and it will be fixed
                                                in a later version.
                                            </Translate>
                                        </li>
                                    </>
                                ) : (
                                    ''
                                )}
                                <li>
                                    <Translate id="download.quick.download.intr.prefix">
                                        If the CPU does not support the avx2 instruction set, select the no avx2
                                        version. You can check whether it is supported by
                                    </Translate>
                                    <code>cat /proc/cpuinfo</code>
                                    <Translate id="download.quick.download.intr.suffix">
                                        . The avx2 instruction will improve the computational efficiency of data
                                        structures such as bloom filter.
                                    </Translate>
                                </li>
                            </ul>
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
                                        <Translate id="download.all.release.download">Download</Translate>
                                    </th>
                                    <th>
                                        <Translate id="download.all.release.note">Release Note</Translate>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_RELEASE.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>
                                            <Link to={item.download}>
                                                <Translate id="download.source.binary">Source / Binary</Translate>
                                            </Link>
                                        </td>
                                        <td>
                                            <Link to={item.note}>Release Note</Link>
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
                        <Translate id="download.verify.w4"> KEYS</Translate>
                    </Link>
                    <Translate id="download.verify.w5">. After verification, please read</Translate>
                    <Link to="/docs/install/source-install/compilation">
                        <Translate id="download.verify.w6"> Compilation </Translate>
                    </Link>
                    <Translate id="download.verify.w7"> and </Translate>
                    <Link to="/docs/install/install-deploy">
                        <Translate id="download.verify.w8"> Installation and deployment </Translate>
                    </Link>
                    <Translate id="download.verify.w9"> to compile and install Doris.</Translate>
                </PageColumn>
            </section>
        </Layout>
    );
}
