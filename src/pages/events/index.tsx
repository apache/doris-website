import React, { useEffect } from 'react';
import Layout from '../../theme/Layout';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import DateIcon from '@site/static/images/events/date-icon.svg';
import AddressIcon from '@site/static/images/events/address-icon.svg';
import ArrowDown from '@site/static/images/events/arrow-down.svg';
import { useState } from 'react';
import './styles.scss';

interface Event {
    cardTitle: string;
    detailTitle: string;
    tag: string;
    date: string;
    address: string;
    description: string;
    status?: EventsStatusEnum;
    cardDate: string;
    img: React.ReactElement;
    link: string;
    isCover?: boolean;
    start_date: string;
    end_date: string;
}

enum EventsStatusEnum {
    Pre = 'Upcoming',
    Processing = 'Processing',
    Complete = 'Completed',
}

const EVENTS_PAGE_DATA = {
    banner: {
        title: 'Events',
        desc: "Stay tuned to community voices. Together, we celebrate collaboration, innovation, and the power of shared knowledge. Let's connect, learn, and grow!",
        action: {
            label: 'Are we missing any ? Click here to contribute',
            link: 'https://github.com/apache/doris/discussions/50296',
            type: 'primary',
        },
    },
    eventListEn: [
        {
            cardTitle: 'Bridging Lake and Database: Real-time Queries on Iceberg',
            detailTitle: 'Bridging Lake and Database: Real-time Queries on Iceberg',
            tag: 'Apache Doris Webinar',
            date: 'September 23, 2025 7PM EST',
            cardDate: 'September 23, 2025',
            address: 'Virtual',
            description: 'In this talk, We will deep-dive into how Apache Doris supports real-time queries on Iceberg tables, achieving flexible yet high-performance real-time queries—a problem that is attracting growing industry attention.',
            start_date: '2025-09-23T07:00:00.000Z',
            end_date: '2025-09-23T24:00:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/250923-doris-webinar-banner.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/doris-webinar-20250923',
        },
        {
            cardTitle: 'NebulaGraph × Apache Doris Meetup: the New Fintech Paradigm',
            detailTitle: 'NebulaGraph × Apache Doris Meetup: the New Fintech Paradigm',
            tag: 'Apache Doris Meetup',
            date: 'August 22, 2025 1:30-5:00 PM (GMT+8)',
            cardDate: 'August 22, 2025',
            address: 'Room 4&5 14/F Fairmont House, 8 Cotton Tree Drive, Central, Hong Kong',
            description: 'This joint event, co-hosted by NebulaGraph and Apache Doris, brings together industry leaders and technical experts to explore how modern graph and analytics technologies are reshaping financial risk control, observability, and compliance.',
            start_date: '2025-08-22T13:30:00.000Z',
            end_date: '2025-08-22T17:00:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/250822-doris-mettup-banner.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/apache-doris-meetup-20250822',
        },
        {
            cardTitle: 'Real-Time IoT Analytics with Apache Doris',
            detailTitle: 'Real-Time IoT Analytics with Apache Doris',
            tag: 'Apache Doris Meetup',
            date: 'August 20, 2025 5:00-7:00 PM PDT',
            cardDate: 'August 20, 2025',
            address: 'Plug and Play Tech Center 440 N Wolfe Rd, Sunnyvale, CA 94085',
            description: 'Join EMQ and VeloDB for a developer-focused meetup exploring how to build scalable, real-time data pipelines using MQTT and Apache Doris.',
            start_date: '2025-08-20T17:00:00.000Z',
            end_date: '2025-08-20T19:00:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/emqx-velodb-meetup-banner.png').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/doris-meetup-250820',
        },
        {
            cardTitle: 'Migrating from Snowflake to Apache Doris',
            detailTitle: 'Migrating from Snowflake to Apache Doris',
            tag: 'Apache Doris Webinar',
            date: 'July 22, 2025 11:00 AM–12:00 PM IST',
            cardDate: 'July 22, 2025',
            address: 'Virtual',
            description: 'If you are using Snowflake and considering a move to open source to cut costs or gain more flexibility, do not miss the next VeloDB webinar! ',
            start_date: '2025-07-22T13:30:00.000Z',
            end_date: '2025-07-22T14:30:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/migrating-snowflake-to-doris.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/apache-doris-webinar-20250722',
        },
        {
            cardTitle: 'Apache Doris: Fastest Analytics & Search Database for AI Era',
            detailTitle: 'Apache Doris: Fastest Analytics & Search Database for AI Era',
            tag: 'Apache Doris Webinar',
            date: 'June 26, 2025 7-8pm EDT',
            cardDate: 'June 26, 2025',
            address: 'Virtual',
            description: 'Join Rayner Chen, Apache Doris PMC Chair and Tech VP at VeloDB, as he breaks down why Doris is purpose-built for the AI era. Hear directly from the expert shaping the future of real-time analytics.',
            start_date: '2025-06-26T21:00:00.000Z',
            end_date: '2025-06-26T22:00:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-webinar-20250625.png').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/apache-doris-webinar-20250625',
        },
        {
            cardTitle: 'Explore Apache Doris Compute-Storage Decoupled Mode',
            detailTitle: 'Explore Apache Doris Compute-Storage Decoupled Mode',
            tag: 'Apache Doris Webinar',
            date: 'March 27, 2025 21:00-22:00 GMT+8',
            cardDate: 'March 27, 2025',
            address: 'Virtual',
            description: 'Apache Doris PMC Chair will dive deep into the compute-storage decoupled mode of Doris',
            start_date: '2025-03-27T21:00:00.000Z',
            end_date: '2025-03-27T22:00:00.000Z',
            img: (
                <img
                    alt="cover img"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/event-2.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.velodb.io/events/apache-doris-compute-storage-decoupled-mode-and-velo-db-cloud-demo',
        },
        {
            cardTitle: 'Interpreting 2025 Roadmap',
            detailTitle: 'Interpreting the Apache Doris 2025 Roadmap',
            tag: 'Apache Doris Webinar',
            date: 'March 20, 2025 21:00-22:00 GMT+8',
            cardDate: 'March 20, 2025',
            start_date: '2025-03-20T21:00:00.000Z',
            end_date: '2025-03-20T22:00:00.000Z',
            address: 'Virtual',
            description: 'Join us as we dive into the key development directions of Apache Doris in 2025 !',
            img: (
                <img
                    alt="address icon"
                    width={64}
                    height={64}
                    src={`${require('@site/static/images/events/event-1.png').default}`}
                />
            ),
            link: 'https://www.linkedin.com/events/7303775032810356736/comments/',
        },
    ],
    eventListZh: [
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'Apache Doris 3.1 新版本解读（三）：湖仓一体升级',
            date: '2025 年 09 月 25 日',
            address: '线上直播',
            description:
                '作为一款高性能、实时的 MPP 分析型数据库，Doris 持续在湖仓融合、半结构化分析、存算分离、实时分析等方向快速演进。3.1 版本在 3.0 的基础上进一步夯实核心能力，带来半结构化分析、湖仓一体、存储层等方面多项关键特性升级，助力企业构建更高效、更灵活的数据分析系统。',
            start_date: '2025-09-25T19:30:00.000Z',
            end_date: '2025-09-25T20:30:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250925"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webinar_3.1_release_250925.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250925',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'Apache Doris 3.1 新版本解读（二）：半结构化分析',
            date: '2025 年 09 月 16 日',
            address: '线上直播',
            description:
                '作为一款高性能、实时的 MPP 分析型数据库，Doris 持续在湖仓融合、半结构化分析、存算分离、实时分析等方向快速演进。3.1 版本在 3.0 的基础上进一步夯实核心能力，带来半结构化分析、湖仓一体、存储层等方面多项关键特性升级，助力企业构建更高效、更灵活的数据分析系统。',
            start_date: '2025-09-16T19:30:00.000Z',
            end_date: '2025-09-16T20:30:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250916"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webinar_3.1_release_250916.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250916',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'Apache Doris 3.1 新版本解读（一）：整体功能介绍',
            date: '2025 年 09 月 11 日',
            address: '线上直播',
            description:
                '作为一款高性能、实时的 MPP 分析型数据库，Doris 持续在湖仓融合、半结构化分析、存算分离、实时分析等方向快速演进。3.1 版本在 3.0 的基础上进一步夯实核心能力，带来半结构化分析、湖仓一体、存储层等方面多项关键特性升级，助力企业构建更高效、更灵活的数据分析系统。',
            start_date: '2025-09-11T19:30:00.000Z',
            end_date: '2025-09-11T20:30:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250911"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webinar_3.1_release_250911.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250911',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'Apache Doris x Milvus 解锁 DB for AI 的无限可能',
            date: '2025 年 08 月 28 日',
            address: '线上直播',
            description:
                '为了帮助用户更好地了解 DB for AI 的前沿技术和应用，我们精心筹备了这场干货满满的直播，分析型数据库如何给 AI 装上“实时数据引擎”？向量数据库又怎样让 AI 拥有“语义超能力”？来这儿，看两者与 AI 擦出的全新火花，解锁智能时代的技术密码。',
            start_date: '2025-08-28T19:30:00.000Z',
            end_date: '2025-08-28T21:00:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250717"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-meetup-20250828.JPEG').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250828',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '走进浪潮｜Apache Doris 企业行',
            date: '2025 年 08 月 15 日',
            address: '山东省济南市历下区浪潮科技园 S01-2101',
            description:
                '此次活动将首次解读面向 AI 的实时分析型数据库 — Apache Doris 4.0 全新特性，聚焦其在 AI、湖仓一体、存算分离、可观测性、高并发点查等关键场景的技术实践。活动将深入探讨 Apache Doris 如何应对各类复杂业务需求，并邀请来自浪潮与中泰证券的技术专家分享实战经验，共同探索基于 Apache Doris 及其商业化产品 SelectDB 构建实时数据平台的最佳路径。',
            start_date: '2025-08-15T13:00:00.000Z',
            end_date: '2025-08-14T17:00:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250717"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-meetup-20250815.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/apache-doris-meetup-20250815',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'Apache Doris x Pulsar：实时分析与智能管控',
            date: '2025 年 08 月 14 日',
            address: '线上直播',
            description:
                '在数据驱动的时代，实时性已成为企业构建核心竞争力的关键。如何高效处理海量实时数据？如何轻松管理日益复杂的流数据集群？Apache Doris 与 Apache Pulsar 作为实时数据生态中的两大明星开源项目，正在携手为开发者和企业提供更强大、更智能的解决方案。',
            start_date: '2025-08-14T19:30:00.000Z',
            end_date: '2025-08-14T21:00:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250717"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-webinar-20250814.png').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250814',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '走进小米@武汉',
            date: '2025 年 08 月 02 日',
            address: '武汉市洪山区 · 小米武汉总部大楼 1 楼展厅',
            description:
                '由小米公司、飞轮科技和 Apache Doris 社区联合主办的 走进小米 —— Apache Doris 企业行@武汉 Meetup 火热筹备中，本次 Meetup 将带来 Doris x AI、Doris on Paimon，以及数据中台与车联网更多场景实践，展现 Doris 作为现代化统一数据仓库，如何有效应对多样的分析场景，简化数据的使用和管理。',
            start_date: '2025-08-02T14:00:00.000Z',
            end_date: '2025-08-02T17:30:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250717"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/202508102-meetup-banner.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/apache-doris-meetup-20250802',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '实时分析系列直播（第二期）：数据更新',
            date: '2025 年 07 月 31 日',
            address: '线上直播',
            description:
                'Apache Doris 作为一款高性能的实时分析引擎，凭其强大的实时更新能力，支持多种数据源的快速接入与处理，使企业能够即时获取最新信息，从而做出更快速、更准确的决策。',
            start_date: '2025-07-31T19:30:00.000Z',
            end_date: '2025-07-31T20:30:00.000Z',
            img: (
                <img
                    alt="doris-meetup-20250717"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-webinar-0731.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250731',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: 'CommunityOverCode Asia 2025',
            date: '2025 年 07 月 25 日 - 27 日',
            address: '北京市海淀区中关村国家自主创新示范区会议中心',
            description:
                '飞轮科技作为本届峰会的开源市集赞助商，携手菜鸟、中国电信翼支付、小米、中国联通等多位资深技术专家，于 AI、OLAP & Data Analysis、Cloud Native 等多个论坛为大家分享基于 Apache Doris 的最新研究成果、实践经验和技术发展，欢迎报名并前往 Apache Doris x SelectDB 展区参与互动！',
            start_date: '2025-07-25T00:00:00.000Z',
            end_date: '2025-07-27T20:30:00.000Z',
            img: (
                <img
                    alt="CommunityOverCode Asia 2025"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/community-over-code-asia2025.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://mp.weixin.qq.com/s/v3TTeNRf-QONXQXQsZ4kJA',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '实时分析系列直播（第一期）| 数据导入',
            date: '2025 年 07 月 17 日 19:30-20:30',
            address: '线上直播',
            description:
                'Apache Doris 作为一款高性能的实时分析引擎，凭其强大的实时更新能力，支持多种数据源的快速接入与处理，使企业能够即时获取最新信息，从而做出更快速、更准确的决策。7 月 17 日 19:30-20:30，本期直播将深入解析 Doris 在数据导入场景下的技术原理以及进阶实践',
            start_date: '2025-07-17T19:30:00.000Z',
            end_date: '2025-07-17T20:30:00.000Z',
            img: (
                <img
                    alt="data-loading"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/20250717banner.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250717',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测性系列直播（第六期）| GenAI & LLM',
            date: '2025 年 07 月 03 日 19:30-20:30',
            address: '线上直播',
            description:
                '第六期将介绍 Apache Doris 可观测性平台与 GenAI 结合应用实践，聚焦在 AI 时代下如何从现代实时数仓演进为支撑分析与 AI 的实时分析型数据库。',
            start_date: '2025-07-03T19:00:00.000Z',
            end_date: '2025-07-03T20:30:00.000Z',
            img: (
                <img
                    alt="可观测性系列直播（第六期）"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-20250703.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250703',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测系列直播（第五期） | Ecosystem 生态联合',
            date: '2025 年 06 月 18 日 19:30-20:30',
            address: '线上直播',
            description:
                '第五期将展示 Apache Doris 如何与众多生态集成，包括 ELK、OpenTelementry、Grafana、Vector、ilogtail 等',
            start_date: '2025-06-18T19:00:00.000Z',
            end_date: '2025-06-18T20:30:00.000Z',
            img: (
                <img
                    alt="可观测系列直播（第五期）"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-20250618.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250618',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '湖仓数智融合、AI 洞见未来',
            date: '2025 年 06 月 14 日 19:30-20:30',
            address: '线上直播',
            description:
                '此次活动为 Apache Doris 社区首场 AI 主题线下 Meetup，邀请了来自飞轮科技、阿里云、汇付天下、某头部物流公司的多位技术专家，深度解析 Apache Doris 与阿里云 SelectDB 在 AI 分析融合、湖仓一体等场景下的技术突破与落地案例。',
            start_date: '2025-06-14T19:00:00.000Z',
            end_date: '2025-06-14T20:30:00.000Z',
            img: (
                <img
                    alt="湖仓数智融合、AI 洞见未来"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/doris-meetup-250614.JPEG').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-meetup-20250614',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测系列直播（第四期） | Metrics 监控场景',
            date: '2025 年 06 月 05 日 19:30-20:30',
            address: '线上直播',
            description:
                '直播第四场将带来 Apache Doris 可观测性解决方案之链路指标场景下的 Benchmark 性能实测。',
            start_date: '2025-06-05T19:00:00.000Z',
            end_date: '2025-06-05T20:30:00.000Z',
            img: (
                <img
                    alt="可观测系列直播第四期"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-20250605.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250605',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测系列直播（第三期） | Trace 监控场景',
            date: '2025 年 05 月 28 日 19:30-20:30',
            address: '线上直播',
            description:
                '直播第三场将带来 Apache Doris 在监控场景下的 Benchmark 性能实测与云上实时采集能力对比，带领用户直观感受监控场景的落地方案。',
            start_date: '2025-05-28T19:00:00.000Z',
            end_date: '2025-05-28T20:30:00.000Z',
            img: (
                <img
                    alt="可观测系列直播第三期"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-250528.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250528',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测系列直播（第二期） | Log 日志场景',
            date: '2025 年 05 月 14 日 19:30-20:30',
            address: '线上直播',
            description:
                '直播第二场将带来 Apache Doris 在可观测性解决方案日志场景下的资源评估、集群部署、配置优化、建表、查询等具体介绍，为用户提供全面的日志场景解读与落地方案。',
            start_date: '2025-05-14T19:00:00.000Z',
            end_date: '2025-05-14T20:30:00.000Z',
            img: (
                <img
                    alt="可观测系列直播第二期"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-250514.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250514',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '可观测系列直播（第一期） | 解决方案概览',
            date: '2025 年 05 月 07 日 19:30-20:30',
            address: '线上直播',
            description:
                '首期直播由 Apache Doris PMC 成员肖康将带来可观测性的重点需求场景介绍、以及如何基于 SelectDB 和 Apache Doris 打造可观测性解决方案',
            start_date: '2025-05-07T19:00:00.000Z',
            end_date: '2025-05-07T20:30:00.000Z',
            img: (
                <img
                    alt="可观测系列直播第一期"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/observability-webinar-250507.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250507',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '走进天翼云 | Apache Doris 企业行',
            date: '2025-05-17（周六）14:00 - 17:00',
            address: '广州市海珠区广报中心南塔 18 楼天翼云 1808 培训室',
            description:
                '5 月 17 日，相约广州，与天翼云、李锦记、货拉拉一同揭秘可观测、湖仓一体、用户画像等实时数仓前沿实践',
            start_date: '2025-05-17T14:00:00.000Z',
            end_date: '2025-05-17T17:00:00.000Z',
            img: (
                <img
                    alt="走进天翼云 | Apache Doris 企业行"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/meetup-tianyiyun.png').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-meetup-20250517',
        },
        {
            cardTitle: '',
            cardDate: '',
            tag: '',
            detailTitle: '阿里云 SelectDB x Apache Doris ｜企业行 Meetup',
            date: '2025-04-19（周六）13:30 - 17:00',
            address: '阿里巴巴北京朝阳科技园 B 区 - 地下车库-B1F  B-B4-B03 雪月山庄',
            description:
                '4 月 19 日由阿里云联合飞轮科技共同发起的阿里云 SelectDB x Apache Doris 日志存储与分析解决方案联合 Meetup 将在北京正式开启，邀您共探日志分析新范式！本次活动邀请了来自阿里云、飞轮科技、AI 独角兽企业的多位技术专家，演讲涵盖阿里云数据库 SelectDB 版及 Apache Doris 在日志场景的技术特性、解决方案及落地实践。',
            start_date: '2025-04-19T13:30:00.000Z',
            end_date: '2025-04-19T17:00:00.000Z',
            img: (
                <img
                    alt="阿里云 SelectDB x Apache Doris ｜企业行 Meetup"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/meetup-ali.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/aliyun-selecdb-cloud-and-doris-meetup-20250419',
        },
        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: 'Doris Webinar 第五期：Apache Doris x Iceberg 湖仓构建',
            description:
                '第五期 Webinar 依旧聚焦湖仓分析，届时飞轮科技技术副总裁陈明雨、飞轮科技资深研发吴文池将带来 Apache Doris x Iceberg 架构详解与性能展示。在 Live Demo 环节，通过 SelectDB Studio for Apache Doris，演示如何连接 Doris、集成 AWS S3 Tables，并进行数据写入和查询等操作，直观感受 Doris 与 Iceberg 的丝滑操作体验。',
            date: '2025 年 04 月 10 日 19:30-20:30',
            start_date: '2025-04-10T19:30:00.000Z',
            end_date: '2025-04-10T20:30:00.000Z',
            address: '线上',
            img: (
                <img
                    alt="Doris Webinar 第五期：Apache Doris x Iceberg 湖仓构建"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webniar-5.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250410',
        },
        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: 'Doris Webinar 第四期：Apache Doris × AI',
            description:
                '本场 Webinar 将分享多款热门 AI 模型与 Doris 结合场景，包括 DataAgent 实现智能数据代理、RAG 增强知识检索、ChatBI 打造自然语言交互分析和 MCP 的实现场景，同时解读 Apache Doris MCP Server 0.1.0 首发版本的详细构建过程。',
            date: '2025 年 04 月 01 日 19:30-21:00',
            start_date: '2025-04-01T19:30:00.000Z',
            end_date: '2025-04-01T21:00:00.000Z',
            address: '线上',
            img: (
                <img
                    alt="Doris Webinar 第四期：Apache Doris × AI"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webniar-4.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250401',
        },
        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: 'Doris Webinar 第二期：构建湖仓一体',
            description:
                '3 月 20 日 19:30-20:30，飞轮科技资深解决方案架构师朱伟将继续深入湖仓一体场景，从 Lakehouse 核心价值、企业级湖仓架构构建、性能优化、功能详解四方面，带来「如何使用 Apache Doris 构建 Lakehouse？」线上直播。',
            date: '2025 年 03 月 20 日 19:30-20:30',
            start_date: '2025-03-20T19:30:00.000Z',
            end_date: '2025-03-20T20:30:00.000Z',
            address: '线上',
            img: (
                <img
                    alt="Doris Webinar 第二期：构建湖仓一体"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webniar-2.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250320',
        },

        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: '走进网易 | Apache Doris 企业行',
            description:
                '作为国内最早将 Apache Doris 深度应用于核心业务场景的互联网企业之一，网易内部多个技术团队已基于 Apache Doris 构建实时数据分析引擎，覆盖实时分析、日志替换、存算分离等关键场景，显著提升数据处理效率并降低综合成本。此次 Meetup 由飞轮科技与网易云音乐技术团队共同发起，联合网易智能邮件、网易数智等核心团队，首次体系化输出网易内部多场景的 Doris 实战经验，为开发者提供从技术选型到规模化落地的全链路指南。',
            date: '2025 年 3 月 15 日（周六）13:30 - 17:00',
            start_date: '2025-03-15T13:30:00.000Z',
            end_date: '2025-03-15T17:00:00.000Z',
            address: '杭州市滨江区网商路 399 号网易大厦二期综合楼 4 楼培训厅',
            img: (
                <img
                    alt="走进网易 | Apache Doris 企业行"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/meetup-20250315.png').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-meetup-20250315',
        },
        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: 'Doris Webinar 第一期：2025 Roadmap 解读',
            description:
                '3 月 13 日 19:30，Apache Doris 核心研发团队将带来 2025 年度 Roadmap Overview，阐述实时分析、日志分析、湖仓一体、存算分离等重点场景的核心工作，聚焦技术深耕，并从查询加速、稳定性提升、数据安全保障等方面追寻更落地的场景突破，此外邀请了腾讯云、杭州银行等开发者分享最新社区共建项目，打造更开放、易用的现代化实时数据仓库，开启全球化演进新征程。欢迎预约收看直播。',
            date: '2025 年 3 月 13 日 19:30-20:30',
            start_date: '2025-04-10T19:30:00.000Z',
            end_date: '2025-04-10T20:30:00.000Z',
            address: '线上',
            img: (
                <img
                    alt="Doris Webinar 第一期：2025 Roadmap 解读"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/webniar-1.jpeg').default}`}
                />
            ),
            isCover: true,
            link: 'https://www.selectdb.com/resources/events/doris-webinar-20250313',
        },
        {
            cardTitle: '',
            tag: '',
            cardDate: '',
            detailTitle: 'Doris Summit Asia 2024 | 与创新者同行',
            description:
                '2024 年 12 月 14 日，由飞轮科技主办，阿里云、腾讯云联合主办的 Doris Summit Asia 2024 将在深圳前海华侨城艾美酒店正式举行。大会设置主论坛以及智慧金融、泛互联网、政企与智造、SelectDB 产品专场 4 大平行论坛。届时，来自阿里、腾讯、邮储银行、中信证券、中国电信、网易、京东、百度、知乎、福特中国、三星、四川航空、特步、货拉拉等 40+ 知名企业的技术专家为现场及线上参会者带来精彩分享。',
            date: '2024 年 12 月 14 日',
            start_date: '2024-12-14T00:00:00.000Z',
            end_date: '2024-12-14T00:00:00.000Z',
            address: '深圳·前海华侨城艾美酒店',
            img: (
                <img
                    alt="Doris Summit Asia 2024 | 与创新者同行"
                    width={384}
                    height={164}
                    className="rounded-t-lg"
                    src={`${require('@site/static/images/events/summit.jpg').default}`}
                />
            ),
            isCover: true,
            link: 'https://doris-summit.org.cn/',
        },
    ],
};

function formatEventList(eventList: Event[]) {
    return eventList.map(event => ({
        ...event,
        status:
            new Date() >= new Date(event.end_date)
                ? EventsStatusEnum.Complete
                : new Date() >= new Date(event.start_date)
                    ? EventsStatusEnum.Processing
                    : EventsStatusEnum.Pre,
    }));
}

const STATUS_COLOR_MAP = {
    [EventsStatusEnum.Pre]: '#00B42A',
    [EventsStatusEnum.Complete]: '#8592A6',
};

export default function Events() {
    const { banner, eventListEn, eventListZh } = EVENTS_PAGE_DATA;
    const [showMore, setShowMore] = useState(false);
    const [eventList, setEventList] = useState<Event[]>(formatEventList(eventListEn));
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'zh'>('en');

    const EventCard = ({ data }: { data: Event }) => {
        return (
            <Link
                to={data.link}
                style={{ transition: 'all 0.2s ease-in-out' }}
                className="!no-underline w-[24rem] rounded-lg hover:translate-y-[-0.5rem]"
            >
                {data.isCover ? (
                    // <img alt='cover img' width={384} height={164} src={data.img} />
                    data.img
                ) : (
                    <div className="relative h-[10.25rem] rounded-t-lg bg-[#162033] text-[#FFF] pt-[1.625rem] px-4">
                        <div className="absolute right-2 bottom-4">{data.img}</div>
                        <span className="">{data.tag}</span>
                        <div className="mb-[0.675rem] text-[1.25rem]/[155%] font-meidum tracking-[0.8px]">
                            {data.cardTitle}
                        </div>
                        <span className="text-[0.75rem]">{data.cardDate}</span>
                    </div>
                )}

                <div
                    className={`border-r rounded-b-lg  border-l ${selectedLanguage === 'zh' ? 'lg:h-[18.625rem]' : ''
                        } border-b border-[#DFE5F0] p-6`}
                >
                    <div
                        style={{ color: `${STATUS_COLOR_MAP[data.status]}` }}
                        className={`mb-4 text-[0.75rem]/[1.25rem] font-semibold`}
                    >
                        {data.status}
                    </div>
                    <div className="mb-4 text-[1.25rem]/[2rem] h-[3.75rem] font-semibold text-[#000]">
                        {data.detailTitle}
                    </div>
                    <p className="line-clamp-2 mb-4 text-[#1D1D1D] text-[0.875rem]/[1.375rem]">{data.description}</p>
                    <p className="mb-[0.675rem] flex items-center text-[#4C576C] text-[0.875rem]/[1.375rem]">
                        <img
                            alt="date icon"
                            width={16}
                            className="inline mr-2"
                            height={16}
                            src={`${require('@site/static/images/events/date-icon.png').default}`}
                        />
                        {data.date}
                    </p>
                    <p className="text-[#4C576C] flex  text-[0.875rem]/[1.375rem]">
                        <AddressIcon className="inline mr-2 basis-4 shrink-0 relative top-[3px]" />
                        {data.address}
                    </p>
                </div>
            </Link>
        );
    };

    useEffect(() => {
        if (selectedLanguage === 'en') {
            setEventList(formatEventList(eventListEn));
        } else {
            setEventList(formatEventList(eventListZh));
        }
    }, [selectedLanguage]);

    return (
        <Layout>
            <section>
                <div className="events-banner-container container">
                    <div className="banner-title mb-4">{banner.title}</div>
                    <div className="banner-desc mb-6">{banner.desc}</div>
                    <Link
                        className={clsx('button button--secondary button--lg', banner.action.type)}
                        to={banner.action.link}
                    >
                        {banner.action.label}
                    </Link>
                </div>
            </section>
            <section className="mb-[5.5rem] mt-[1.25rem]">
                <div className="max-w-[75rem] text-[1rem]/[180%] mx-auto flex justify-start gap-x-[2.5rem] font-medium">
                    <div className="h-[3.25rem] pb-4">Event Language Type:</div>
                    <div
                        onClick={() => setSelectedLanguage('en')}
                        className={`h-[3.25rem] cursor-pointer pb-4 hover:text-[#1D1D1D] ${selectedLanguage === 'en'
                            ? 'text-[#1D1D1D] border-b-[2px]  border-[#444FD9]'
                            : 'text-[#4C576C]'
                            }`}
                    >
                        English
                    </div>

                    <div
                        onClick={() => setSelectedLanguage('zh')}
                        className={`h-[3.25rem] cursor-pointer hover:text-[#1D1D1D] pb-4 ${selectedLanguage === 'zh'
                            ? 'text-[#1D1D1D] border-b-[2px] border-[#444FD9]'
                            : 'text-[#4C576C]'
                            }`}
                    >
                        Chinese
                    </div>
                </div>
                <div className="max-w-[75rem] pt-[5rem] border-t-[0.5px] border-[#E3E8F2] mx-auto ">
                    <div
                        className={`flex flex-wrap gap-x-[1.5rem] gap-y-[5rem] ${!showMore ? 'mb-[2.5rem]' : 'mb-[5rem]'
                            } `}
                    >
                        {eventList.slice(0, 9).map((event: Event, index) => (
                            <EventCard data={event} key={index} />
                        ))}
                    </div>
                    {showMore ? (
                        <div className="flex flex-wrap gap-x-[1.5rem] gap-y-[5rem] mb-[2.5rem] ">
                            {eventList.slice(9).map((event: Event, index) => (
                                <EventCard data={event} key={index} />
                            ))}
                        </div>
                    ) : null}
                    {eventList.length > 9 ? (
                        <div
                            onClick={() => setShowMore(true)}
                            className="cursor-pointer text-center mx-auto text-[#444FD9] text-[0.875rem]/[1.375rem]"
                        >
                            See More <ArrowDown className="inline" />
                        </div>
                    ) : null}
                </div>
            </section>
        </Layout>
    );
}
