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
    DownloadLinkProps,
    ALL_RELEASE_LINK,
    CHINA_ALL_RELEASE_MIRROR_LINK,
    FLINK_CONNECTOR_LINK,
    CHINA_FLINK_CONNECTOR_MIRROR_LINK,
    SPARK_CONNECTOR_LINK,
    CHINA_SPARK_CONNECTOR_MIRROR_LINK,
} from '@site/src/constant/download.data';
import data from '../../../download.json';

export default function Download(): JSX.Element {
    const {
        i18n: { currentLocale },
    } = useDocusaurusContext();

    const [version, setVersion] = useState<string>(data.versions[0]);
    const [cpu, setCPU] = useState<string>('');
    const [current, setCurrent] = useState<DownloadLinkProps>();

    const sources = currentLocale.toLocaleUpperCase() === 'EN' ? ALL_RELEASE_LINK : CHINA_ALL_RELEASE_MIRROR_LINK;
    const flinkOrigin =
        currentLocale.toLocaleUpperCase() === 'EN' ? FLINK_CONNECTOR_LINK : CHINA_FLINK_CONNECTOR_MIRROR_LINK;
    const sparkOrigin =
        currentLocale.toLocaleUpperCase() === 'EN' ? SPARK_CONNECTOR_LINK : CHINA_SPARK_CONNECTOR_MIRROR_LINK;

    const changeVersion = (val: string) => {
        setVersion(val);
    };
    const changeCPU = (val: string) => {
        setCPU(val);
    };

    const getDownloadLinks = () => {
        const text = `${version}-${cpu}`;
        const linkObj = data.downloadLinks.find(item => item.id === text);
        setCurrent(linkObj);
    };

    useEffect(() => {
        if (version && cpu) {
            getDownloadLinks();
        }
    }, [version, cpu]);

    useEffect(() => {
        setCPU(data.cpus[0].value);
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
                                {data.versions?.map(item => (
                                    <div
                                        className={clsx('radio', {
                                            checked: version === item,
                                        })}
                                        key={item}
                                        onClick={() => changeVersion(item)}
                                    >
                                        {item}
                                        {data.lastVersion === item ? ' ( latest )' : ''}
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
                                {data.cpus?.map(item => (
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
                        {data.downloadNotices?.length > 0 ? (
                            <div className="tips">
                                <div className="title">
                                    <Translate id="Notice">Notice</Translate>
                                    {currentLocale === 'zh-CN' ? '：' : ':'}
                                </div>
                                <ul>
                                    {data.downloadNotices?.map(
                                        (item, index) =>
                                            item.version.includes(version) && (
                                                <li
                                                    key={index}
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            currentLocale === 'zh-CN' ? item.notice.zh : item.notice.en,
                                                    }}
                                                ></li>
                                            ),
                                    )}
                                </ul>
                            </div>
                        ) : null}
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
                                {data.allReleases?.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            {item.version}
                                            {data.lastVersion === item.version ? ' ( latest )' : ''}
                                        </td>
                                        <td>{item.date}</td>
                                        <td>
                                            <Link to={sources + item.download}>
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
                                {data.flinkConnectors?.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>{item.flink}</td>
                                        <td>{item.scala}</td>
                                        <td>{item.doris}</td>
                                        <td>
                                            <Link to={flinkOrigin + item.download}>
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
                                {data.sparkConnectors?.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.version}</td>
                                        <td>{item.date}</td>
                                        <td>{item.spark}</td>
                                        <td>{item.scala}</td>
                                        <td>{item.doris}</td>
                                        <td>
                                            <Link to={sparkOrigin + item.download}>
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
