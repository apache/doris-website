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
