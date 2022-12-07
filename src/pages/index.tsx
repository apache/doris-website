import Layout from '../theme/Layout';
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import './index.scss';
import PageBanner, { ButtonProps } from '../components/PageBanner';
import Link from '@docusaurus/Link';
import PageColumn from '../components/PageColumn';
import usePhone from '../hooks/use-phone';
import More from '../components/More/index';
import clsx from 'clsx';

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const { isPhone } = usePhone();
    const buttons: ButtonProps[] = [
        {
            label: 'GitHub',
            link: 'https://github.com/apache/doris',
            type: 'primary',
        },
        {
            label: <Translate id="homepage.banner.button1">Get Started</Translate>,
            link: '/learning',
            type: 'ghost',
        },
        {
            label: 'Slack',
            link: 'https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-1h153f1ar-sTJB_QahY1SHvZdtPFoIOQ',
            type: 'default',
        },
    ];
    const banner = {
        title: <Translate id="homepage.banner.title">Apache Doris</Translate>,
        subTitle: (
            <Translate id="homepage.banner.subTitle">
                An easy-to-use, high-performance and unified analytical database
            </Translate>
        ),
        bannerImg: require('@site/static/images/home-banner.png').default,
        buttons,
    };

    const coreFeatures = [
        {
            title: <Translate id="coreFeatures.title.f1">Easy to Use</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f1">
                    Two processes, no other dependencies; online cluster scaling, automatic replica recovery; compatible
                    with MySQL protocol, and using standard SQL
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-2.png').default,
        },
        {
            title: <Translate id="coreFeatures.title.f2">High Performance</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f2">
                    Extremely fast performance for low-latency and high-throughput queries with columnar storage engine,
                    modern MPP architecture, vectorized query engine, pre-aggregated materialized view and data index
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-1.png').default,
        },
        {
            title: <Translate id="coreFeatures.title.f3">Single Unified</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f3">
                    A single system can support real-time data serving, interactive data analysis and offline data
                    processing scenarios
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-4.png').default,
        },
        {
            title: <Translate id="coreFeatures.title.f4">Federated Querying</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f4">
                    Supports federated querying of data lakes such as Hive, Iceberg, Hudi, and databases such as MySQL
                    and Elasticsearch
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-3.png').default,
        },
        {
            title: <Translate id="coreFeatures.title.f5">Various Data Import Methods</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f5">
                    Supports batch import from HDFS/S3 and stream import from MySQL Binlog/Kafka; supports micro-batch
                    writing through HTTP interface and real-time writing using Insert in JDBC
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-6.png').default,
        },
        {
            title: <Translate id="coreFeatures.title.f6">Rich Ecology</Translate>,
            subTitle: (
                <Translate id="coreFeatures.subTitle.f6">
                    Spark uses Spark Doris Connector to read and write Doris; Flink Doris Connector enables Flink CDC to
                    implement exactly-once data writing to Doris; DBT Doris Adapter is provided to transform data in
                    Doris with DBT
                </Translate>
            ),
            img: require('@site/static/images/icon/core-feature-5.png').default,
        },
    ];

    const communitys = [
        {
            title: <Translate id="community.title.c1">Mailing List</Translate>,
            img: require('@site/static/images/icon/community-1.png').default,
            href: '/community/subscribe-mail-list',
        },
        {
            title: <Translate id="community.title.c2">Discussion</Translate>,
            img: require('@site/static/images/icon/community-2.png').default,
            href: 'https://github.com/apache/doris/discussions',
        },
        {
            title: <Translate id="community.title.c3">How to Contribute</Translate>,
            img: require('@site/static/images/icon/community-3.png').default,
            href: '/community/how-to-contribute/',
        },
        {
            title: <Translate id="community.title.c4">Source Code</Translate>,
            img: require('@site/static/images/icon/community-4.png').default,
            href: 'https://github.com/apache/doris',
        },
        {
            title: <Translate id="community.title.c5">Improvement Proposals</Translate>,
            img: require('@site/static/images/icon/community-5.png').default,
            href: 'https://cwiki.apache.org/confluence/display/DORIS/Doris+Improvement+Proposals',
        },
        {
            title: <Translate id="community.title.c6">Doris Team</Translate>,
            img: require('@site/static/images/icon/community-6.png').default,
            href: '/community/team.html',
        },
    ];
    return (
        <Layout
            title={translate({ id: 'homepage.title', message: 'Home' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
        >
            <PageBanner {...banner}></PageBanner>
            <section className="news-section">
                <div className="container">
                    <div className="news-wrap">
                        <div className="news-item">
                            <span className="news-icon"></span>
                            <Link to="/docs/dev/releasenotes/release-1.2.0" className="news-content">
                                <Translate id="homepage.news" description="The label for the link to homepage news">
                                    2022.12.07, Apache Doris 1.2.0 is officially released
                                </Translate>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <section className="apache-doris">
                <PageColumn
                    title={
                        <Translate id="homepage.what" description="What is Apache Doris">
                            What is Apache Doris?
                        </Translate>
                    }
                    footer={
                        <More
                            link="/docs/summary/basic-summary"
                            text={
                                <Translate id="homepage.more" description="more link">
                                    More
                                </Translate>
                            }
                        />
                    }
                >
                    {isPhone ? (
                        <img src={require('@site/static/images/what-is-doris-phone.png').default} alt="" />
                    ) : (
                        <img
                            style={{ maxWidth: '85%' }}
                            src={require('@site/static/images/what-is-doris.png').default}
                            alt=""
                        />
                    )}
                </PageColumn>
            </section>
            <PageColumn
                title={
                    <Translate id="homepage.features" description="Core Features">
                        Core Features
                    </Translate>
                }
                footer={<></>}
            >
                <div className="core-features">
                    <div className="row">
                        {coreFeatures.map((item, index) => (
                            <div className="col col--6" key={index}>
                                <div className="core-feature-item">
                                    <img src={item.img} className="core-feature-img" alt="" />
                                    <div className="core-feature-content">
                                        <div className="core-feature-title">{item.title}</div>
                                        <div className="core-feature-subtitle">{item.subTitle}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageColumn>
            <PageColumn
                title={
                    <Translate id="homepage.join" description="Join The Community">
                        Join the Community
                    </Translate>
                }
            >
                <div className="communitys">
                    <div className="row">
                        {communitys.map((item, index) => (
                            <div className={clsx('col', isPhone ? 'col--6' : 'col--4')} key={index}>
                                <Link to={item.href} className="community-item">
                                    <img src={item.img} alt="" className="community-img" />
                                    <div className="community-title">{item.title}</div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </PageColumn>
            <div className="ready-start">
                <div className="container">
                    <div className="ready-start-wrap">
                        <div className="start-title">
                            <Translate id="homepage.start.title">Ready to get started ?</Translate>
                        </div>
                        <div className="start-buttons">
                            <Link className="start-btn download-btn" to="/download">
                                <Translate id="homepage.start.downloadButton">Download</Translate>
                            </Link>
                            <Link className="start-btn docs-btn" to="/learning">
                                <Translate id="homepage.start.docsButton">Go to docs</Translate>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
