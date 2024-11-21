import clsx from 'clsx';
import Layout from '../theme/Layout';
import Link from '@docusaurus/Link';
import More from '../components/More/index';
import PageBanner, { ButtonProps } from '../components/PageBanner';
import PageColumn from '../components/PageColumn';
import React, { useCallback, useEffect, useState } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import usePhone from '../hooks/use-phone';
import './index.scss';
import LinkWithArrow from '@site/src/components/link-arrow';
import { NEWSLETTER_DATA } from '../constant/newsletter.data';
import { AchievementBanner } from '../components/achievement-banner/achievement-banner';
import { CoreCapabilitiesData } from '../constant/core-capabilities.data';
import { CoreCapabilitiesCard } from '../components/core-capabilities-card/core-capabilities-card';
import { VariousAnalyticsData } from '../constant/various-analytics.data';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper';
import GetStarted from '@site/src/components/get-started/get-started';
import { Collapse, Tabs } from 'antd';
import { Content } from 'antd/es/layout/layout';
import ReadMore from '../components/ReadMore';
import { ArrowDownIcon } from '../components/Icons/arrow-down-icon';
import { UserCaseCarousel } from '../components/user-case-carousel';
import { NewsLetterSwiper } from '../components/newsletter-swiper';

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const { isPhone } = usePhone();

    const buttons: ButtonProps[] = [
        {
            label: 'Download',
            link: '/download',
            type: 'primary',
        },
        {
            label: <Translate id="homepage.banner.button1">Get started</Translate>,
            link: '/docs/gettingStarted/what-is-new',
            type: 'ghost',
        },
        {
            label: <Translate id="homepage.banner.button2">Join Slack</Translate>,
            link: 'https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw',
            type: 'ghost',
        },
    ];
    const banner = {
        title: (
            <div
                className="lg:leading-[78px]"
                style={{
                    fontWeight: 540,
                }}
            >
                <p className="highlight">
                    <Translate id="homepage.banner.title">Open Source, Real-Time</Translate>
                </p>
                <p>
                    <Translate id="homepage.banner.highlightTitle">Data Warehouse</Translate>
                </p>
            </div>
        ),
        subTitle: (
            <div>
                <p>
                    <Translate id="homepage.banner.subTitle-1">
                        Apache Doris is a modern data warehouse for real-time analytics.
                    </Translate>
                </p>
                <p>
                    <Translate id="homepage.banner.subTitle-2">
                        It delivers lightning-fast analytics on real-time data at scale.
                    </Translate>
                </p>
            </div>
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
            title: <Translate id="community.title.c1">Developer mailing list</Translate>,
            img: (
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect opacity="0.1" width="60" height="60" rx="10" fill="#00C2DD" />
                    <g opacity="0.6" filter="url(#filter0_f_1665_497)">
                        <ellipse cx="30" cy="47" rx="11" ry="3" fill="#00C2DD" />
                    </g>
                    <path
                        d="M14.8004 12H45.1996C47.2733 12 48.9736 13.6645 49 15.7042L30.0066 26.181L11.0176 15.7174C11.0351 13.6689 12.7223 12 14.8004 12ZM11.0176 19.7263L11 38.2517C11 40.3135 12.7091 42 14.8004 42H45.1996C47.2909 42 49 40.3135 49 38.2517V19.7174L30.4547 29.7042C30.1692 29.8587 29.8265 29.8587 29.5453 29.7042L11.0176 19.7263Z"
                        fill="#00BED9"
                    />
                    <path
                        d="M45.1996 12H14.8004C12.7223 12 11.0352 13.6689 11.0176 15.7174L30 26.5L49 15.7042C48.9736 13.6645 47.2733 12 45.1996 12Z"
                        fill="#00BED9"
                    />
                    <defs>
                        <filter
                            id="filter0_f_1665_497"
                            x="9"
                            y="34"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1665_497" />
                        </filter>
                    </defs>
                </svg>
            ),
            href: '/community/subscribe-mail-list',
        },
        {
            title: <Translate id="community.title.c2">GitHub discussions</Translate>,
            img: (
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="61" viewBox="0 0 60 61" fill="none">
                    <rect opacity="0.1" width="60" height="60" rx="10" fill="#3078E5" />
                    <g opacity="0.6" filter="url(#filter0_f_1926_14560)">
                        <ellipse cx="30" cy="48" rx="11" ry="3" fill="#3078E5" />
                    </g>
                    <path
                        d="M30 10C19.7788 10 11.5 18.2589 11.5 28.4557C11.4979 32.3301 12.7188 36.1068 14.9895 39.2499C17.2602 42.393 20.4654 44.7431 24.1503 45.9665C25.0753 46.1271 25.4213 45.5734 25.4213 45.0881C25.4213 44.6507 25.3972 43.1982 25.3972 41.6516C20.75 42.5061 19.5475 40.5221 19.1775 39.483C18.9685 38.9515 18.0675 37.3145 17.2813 36.8752C16.6338 36.5301 15.7088 35.6756 17.2572 35.6535C18.715 35.6295 19.7547 36.9915 20.1025 37.5452C21.7675 40.3357 24.4278 39.5513 25.4897 39.0678C25.6525 37.8682 26.1372 37.0617 26.67 36.6003C22.5538 36.1389 18.2525 34.5461 18.2525 27.4868C18.2525 25.4788 18.9685 23.8197 20.1488 22.5259C19.9638 22.0645 19.3163 20.1728 20.3338 17.6351C20.3338 17.6351 21.8822 17.1516 25.4213 19.5287C26.9273 19.1117 28.4833 18.9018 30.0462 18.9049C31.6187 18.9049 33.1913 19.1116 34.6713 19.5269C38.2085 17.1276 39.7587 17.637 39.7587 17.637C40.7762 20.1746 40.1287 22.0664 39.9437 22.5278C41.1222 23.8197 41.84 25.4567 41.84 27.4868C41.84 34.5701 37.5165 36.1389 33.4003 36.6003C34.07 37.1761 34.649 38.2834 34.649 40.0146C34.649 42.4821 34.625 44.4661 34.625 45.0899C34.625 45.5734 34.9728 46.1493 35.8978 45.9647C39.5701 44.7278 42.7611 42.3732 45.0218 39.2323C47.2825 36.0914 48.499 32.3224 48.5 28.4557C48.5 18.2589 40.2212 10 30 10Z"
                        fill="black"
                    />
                    <defs>
                        <filter
                            id="filter0_f_1926_14560"
                            x="9"
                            y="35"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1926_14560" />
                        </filter>
                    </defs>
                </svg>
            ),
            href: 'https://github.com/apache/doris/discussions',
        },
        {
            title: <Translate id="community.title.c3">Slack workspace</Translate>,
            img: (
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <rect opacity="0.1" width="60" height="60" rx="10" fill="#636CDF" />
                    <g opacity="0.6" filter="url(#filter0_f_1926_14564)">
                        <ellipse cx="29.667" cy="47" rx="11" ry="3" fill="#636CDF" />
                    </g>
                    <path
                        d="M21.6156 31.4787C21.6156 29.5059 23.2152 27.9062 25.1881 27.9062C27.1609 27.9062 28.7605 29.5059 28.7605 31.532V40.4365C28.7605 41.384 28.3842 42.2927 27.7142 42.9626C27.0442 43.6326 26.1356 44.009 25.1881 44.009C24.2406 44.009 23.3319 43.6326 22.662 42.9626C21.992 42.2927 21.6156 41.384 21.6156 40.4365V31.4787Z"
                        fill="#CE365C"
                    />
                    <path
                        d="M13.6508 34.0581C12.9809 33.3882 12.6045 32.4795 12.6045 31.532C12.6045 29.5059 14.2574 27.9062 16.2303 27.9596H19.7494V31.532C19.7494 32.4795 19.373 33.3882 18.7031 34.0581C18.0331 34.7281 17.1244 35.1045 16.177 35.1045C15.2295 35.1045 14.3208 34.7281 13.6508 34.0581Z"
                        fill="#CE365C"
                    />
                    <path
                        d="M34.1462 36.9174C36.119 36.9174 37.7187 38.517 37.7187 40.4898C37.7187 41.4373 37.3423 42.346 36.6723 43.016C36.0023 43.6859 35.0937 44.0623 34.1462 44.0623C33.1987 44.0623 32.29 43.6859 31.6201 43.016C30.9501 42.346 30.5737 41.4373 30.5737 40.4898V36.9174H34.1462Z"
                        fill="#E3B44C"
                    />
                    <path
                        d="M34.1462 27.9062H43.1573C45.1302 27.9062 46.7298 29.5059 46.6765 31.4787C46.6765 33.4516 45.0769 35.0512 43.104 35.0512H34.1462C33.1987 35.0512 32.29 34.6748 31.6201 34.0048C30.9501 33.3349 30.5737 32.4262 30.5737 31.4787C30.5737 30.5312 30.9501 29.6226 31.6201 28.9526C32.29 28.2826 33.1987 27.9062 34.1462 27.9062Z"
                        fill="#E3B44C"
                    />
                    <path
                        d="M39.5313 22.5211C39.5313 20.5482 41.1309 18.9486 43.1038 18.9486C44.0513 18.9486 44.9599 19.325 45.6299 19.995C46.2999 20.6649 46.6762 21.5736 46.6762 22.5211C46.6762 23.4686 46.2999 24.3772 45.6299 25.0472C44.9599 25.7172 44.0513 26.0936 43.1038 26.0936H39.5313V22.5211Z"
                        fill="#5BB381"
                    />
                    <path
                        d="M30.5735 22.5211V13.51C30.5735 12.5625 30.9499 11.6538 31.6199 10.9838C32.2898 10.3139 33.1985 9.9375 34.146 9.9375C35.0934 9.9375 36.0021 10.3139 36.6721 10.9838C37.342 11.6538 37.7184 12.5625 37.7184 13.51V22.5211C37.7184 23.4686 37.342 24.3772 36.6721 25.0472C36.0021 25.7172 35.0934 26.0936 34.146 26.0936C33.1985 26.0936 32.2898 25.7172 31.6199 25.0472C30.9499 24.3772 30.5735 23.4686 30.5735 22.5211Z"
                        fill="#5BB381"
                    />
                    <path
                        d="M22.662 10.9838C23.3319 10.3139 24.2406 9.9375 25.1881 9.9375C27.1609 9.9375 28.7605 11.5371 28.7605 13.51V17.0824H25.1881C24.2406 17.0824 23.3319 16.706 22.662 16.0361C21.992 15.3661 21.6156 14.4574 21.6156 13.51C21.6156 12.5625 21.992 11.6538 22.662 10.9838Z"
                        fill="#68BBDB"
                    />
                    <path
                        d="M25.1348 26.0936H16.177C15.2295 26.0936 14.3208 25.7172 13.6508 25.0472C12.9809 24.3772 12.6045 23.4686 12.6045 22.5211C12.6045 21.5736 12.9809 20.6649 13.6508 19.995C14.3208 19.325 15.2295 18.9486 16.177 18.9486H25.1348C26.0822 18.9486 26.9909 19.325 27.6609 19.995C28.3308 20.6649 28.7072 21.5736 28.7072 22.5211C28.7072 23.4686 28.3308 24.3772 27.6609 25.0472C26.9909 25.7172 26.0822 26.0936 25.1348 26.0936Z"
                        fill="#68BBDB"
                    />
                    <defs>
                        <filter
                            id="filter0_f_1926_14564"
                            x="8.66699"
                            y="34"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1926_14564" />
                        </filter>
                    </defs>
                </svg>
            ),
            href: 'https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw',
        },
        {
            title: <Translate id="community.title.c4">Twitter</Translate>,
            img: (
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <rect opacity="0.1" width="60" height="60" rx="10" fill="#3078E5" />
                    <g opacity="0.6" filter="url(#filter0_f_1665_513)">
                        <ellipse cx="30" cy="47" rx="11" ry="3" fill="#3078E5" />
                    </g>
                    <path
                        d="M18.1681 41.2188L28.0334 30.1003L26.9476 28.5656L15.7812 41.2188H18.1681Z"
                        fill="#1D1D1D"
                    />
                    <path
                        d="M43.4004 12.7812L32.6624 24.8833L31.5656 23.3328L40.8771 12.7812H43.4004Z"
                        fill="#1D1D1D"
                    />
                    <path
                        d="M24.1918 13H16L35.8082 41H44L24.1918 13ZM36.7983 39.1768L19.5698 14.8233H23.2017L40.4302 39.1768H36.7983Z"
                        fill="#1D1D1D"
                    />
                    <defs>
                        <filter
                            id="filter0_f_1665_513"
                            x="9"
                            y="34"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1665_513" />
                        </filter>
                    </defs>
                </svg>
            ),
            href: 'https://twitter.com/doris_apache',
        },
        {
            title: <Translate id="community.title.c5">LinkedIn</Translate>,
            img: (
                <svg xmlns="http://www.w3.org/2000/svg" width="61" height="60" viewBox="0 0 61 60" fill="none">
                    <g clip-path="url(#clip0_1665_520)">
                        <g opacity="0.6" filter="url(#filter0_f_1665_520)">
                            <ellipse cx="30.5" cy="47" rx="11" ry="3" fill="#1460D4" />
                        </g>
                        <path
                            d="M12.9424 43.9994H20.8779V21.3502H12.9424V43.9994ZM39.3494 20.6359C36.0648 20.6359 34.2536 21.7356 32.1689 24.3993V21.3496H24.2461V43.9994H32.1683V31.6917C32.1683 29.0944 33.41 26.5539 36.3791 26.5539C39.3482 26.5539 40.0783 29.0938 40.0783 31.6299V44H47.9783V31.1246C47.9783 22.1788 42.6349 20.6359 39.3494 20.6359ZM16.9248 10C14.4801 10 12.5 11.7894 12.5 13.9981C12.5 16.2051 14.4801 17.9917 16.9248 17.9917C19.3673 17.9917 21.3474 16.2046 21.3474 13.9981C21.3474 11.7894 19.3673 10 16.9248 10Z"
                            fill="#1460D4"
                        />
                        <rect opacity="0.1" width="60" height="60" rx="10" fill="#3078E5" />
                    </g>
                    <defs>
                        <filter
                            id="filter0_f_1665_520"
                            x="9.5"
                            y="34"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1665_520" />
                        </filter>
                        <clipPath id="clip0_1665_520">
                            <rect width="60" height="60" fill="white" transform="translate(0.5)" />
                        </clipPath>
                    </defs>
                </svg>
            ),
            href: 'https://www.linkedin.com/company/doris-apache/',
        },
        {
            title: <Translate id="community.title.c6">All video resources</Translate>,
            img: (
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <rect opacity="0.1" width="60" height="60" rx="10" fill="#3078E5" />
                    <g opacity="0.6" filter="url(#filter0_f_1665_524)">
                        <ellipse cx="30" cy="47" rx="11" ry="3" fill="#3078E5" />
                    </g>
                    <path
                        d="M35.5 27.866C36.1667 27.4811 36.1667 26.5189 35.5 26.134L28 21.8038C27.3333 21.4189 26.5 21.9001 26.5 22.6699L26.5 31.3301C26.5 32.0999 27.3333 32.5811 28 32.1962L35.5 27.866Z"
                        fill="black"
                    />
                    <path
                        d="M13 16C13 13.7909 14.7909 12 17 12H43C45.2091 12 47 13.7909 47 16V38C47 40.2091 45.2091 42 43 42H17C14.7909 42 13 40.2091 13 38V16ZM17 14C15.8954 14 15 14.8954 15 16V38C15 39.1046 15.8954 40 17 40H43C44.1046 40 45 39.1046 45 38V16C45 14.8954 44.1046 14 43 14H17Z"
                        fill="black"
                    />
                    <defs>
                        <filter
                            id="filter0_f_1665_524"
                            x="9"
                            y="34"
                            width="42"
                            height="26"
                            filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB"
                        >
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_1665_524" />
                        </filter>
                    </defs>
                </svg>
            ),
            href: 'https://www.youtube.com/@apachedoris/channels',
        },
    ];
    console.log(siteConfig, 'siteConfig')
    return (
        <Layout
            title={translate({ id: 'homepage.title', message: 'Apache Doris: Open source data warehouse for real time data analytics' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message:
                    'Apache Doris is an open-source database based on MPP architecture,with easier use and higher performance.  As a modern data warehouse, apache doris empowers your Olap query and database analytics.',
            })}
            showAnnouncementBar={true}
            keywords={translate({
                id: 'homepage.keywords',
                message: 'Open Source database, OLAP, data warehouse, database analytics'
            })}
        >
            <PageBanner {...banner}></PageBanner>
            <AchievementBanner />
            <section style={{ backgroundColor: '#F7F9FE' }} className="group">
                <NewsLetterSwiper />
            </section>
            <section className="apache-doris">
                <PageColumn
                    // wrapperStyle={{ paddingBottom: '7.5rem' }}
                    className="lg:pb-[7.5rem] py-16"
                    title={
                        <Translate id="homepage.what" description="What is Apache Doris">
                            What is Apache Doris
                        </Translate>
                    }
                    footer={
                        <div className="justify-center flex mt-14">
                            <LinkWithArrow
                                to="/docs/gettingStarted/what-is-apache-doris"
                                text={
                                    <Translate id="homepage.more" description="more link">
                                        Learn more
                                    </Translate>
                                }
                            />
                        </div>
                    }
                >
                    {isPhone ? (
                        <img src={require('@site/static/images/what-is-doris-new.png').default} alt="" />
                    ) : (
                        <img
                            style={{ maxWidth: '85%', margin: 'auto' }}
                            src={require('@site/static/images/what-is-doris-new.png').default}
                            alt=""
                        />
                    )}
                </PageColumn>
            </section>
            <PageColumn
                className="lg:py-[7.5rem]"
                wrapperStyle={{ backgroundColor: '#F7F9FE' }}
                title={
                    <Translate id="homepage.capabilities" description="Core capabilities">
                        Core capabilities
                    </Translate>
                }
                footer={<></>}
            >
                <div className="block lg:grid core-capabilities-group grid-cols-1 lg:grid-cols-3 ">
                    {CoreCapabilitiesData.map(props => (
                        <CoreCapabilitiesCard key={props.title} {...props} />
                    ))}
                </div>
            </PageColumn>
            <PageColumn
                title={
                    <div>
                        <p>
                            <Translate
                                id="homepage.unified"
                                description="Unified data warehouse 
                    for various analytics use cases"
                            >
                                Unified data warehouse
                            </Translate>
                        </p>
                        <p>
                            <Translate id="homepage.analytics" description="for various analytics use cases">
                                for various analytics use cases
                            </Translate>
                        </p>
                    </div>
                }
            >
                <UserCaseCarousel />
            </PageColumn>
            <PageColumn
                className="bg-[#F7F9FE]"
                title={
                    <Translate id="homepage.join" description="Join The Community">
                        Connect with community
                    </Translate>
                }
            >
                <div className="communitys">
                    <div className="row">
                        {communitys.map((item, index) => (
                            <div className={clsx('col', isPhone ? 'col--6' : 'col--4')} key={index}>
                                <Link to={item.href} className="community-item">
                                    {item.img}
                                    <div className="community-title">{item.title}</div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </PageColumn>
            <GetStarted />
        </Layout>
    );
}
