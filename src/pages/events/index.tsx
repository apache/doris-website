import React from 'react';
import Layout from '../../theme/Layout';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import Events1Icon from '@site/static/images/events/event-1.svg';
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
    status: string;
    cardDate: string;
    img: React.ReactElement;
    link: string;
}

const EVENTS_PAGE_DATA = {
    banner: {
        title: 'Events',
        desc: "Stay tuned to community voices. Together, we celebrate collaboration, innovation, and the power of shared knowledge. Let's connect, learn, and grow!",
        action: {
            label: 'Are we missing any ? Click here to contribute',
            link: '/',
            type: 'primary',
        },
    },
    eventList: [
        {
            cardTitle: 'Interpreting 2025 Roadmap',
            detailTitle: 'Interpreting the Apache Doris 2025 Roadmap',
            tag: 'Apache Doris Webinar',
            date: 'March 20, 2025 21:00-22:00 GMT+8',
            cardDate: 'March 20, 2025',
            address: 'Virtual',
            description: 'Join us as we dive into the key development directions of Apache Doris in 2025 !',
            status: 'Upcoming',
            img: <Events1Icon />,
            link: 'https://www.linkedin.com/events/7303775032810356736/comments/',
        },
    ],
};

const STATUS_COLOR_MAP = {
    Upcoming: '#00B42A',
    Past: '#8592A6',
};

export default function Events() {
    const { banner, eventList } = EVENTS_PAGE_DATA;
    const [showMore, setShowMore] = useState(false);

    const EventCard = ({ data }: { data: Event }) => {
        return (
            <Link
                to={data.link}
                style={{ transition: 'all 0.2s ease-in-out' }}
                className="!no-underline w-[24rem] rounded-lg hover:translate-y-[-0.5rem]"
            >
                <div className="relative h-[10.25rem] rounded-t-lg bg-[#162033] text-[#FFF] pt-[1.625rem] px-4">
                    <div className="absolute right-2 bottom-4">{data.img}</div>
                    <span className="">{data.tag}</span>
                    <div className="mb-[0.675rem] text-[1.25rem]/[155%] font-meidum tracking-[0.8px]">
                        {data.cardTitle}
                    </div>
                    <span className="text-[0.75rem]">{data.cardDate}</span>
                </div>
                <div className="border-r rounded-b-lg border-l border-b border-[#DFE5F0] p-6">
                    <div
                        style={{ color: `${STATUS_COLOR_MAP[data.status]}` }}
                        className={`mb-4 text-[0.75rem]/[1.25rem] font-semibold`}
                    >
                        {data.status}
                    </div>
                    <div className="mb-4 text-[1.25rem]/[2rem] font-semibold text-[#000]">{data.detailTitle}</div>
                    <p className="line-clamp-2 mb-4 text-[#1D1D1D] text-[0.875rem]/[1.375rem]">{data.description}</p>
                    <p className="mb-[0.675rem] flex items-center text-[#4C576C] text-[0.875rem]/[1.375rem]">
                        <DateIcon className="inline mr-2" />
                        {data.date}
                    </p>
                    <p className="text-[#4C576C] flex items-center  text-[0.875rem]/[1.375rem]">
                        <AddressIcon className="inline mr-2" />
                        {data.address}
                    </p>
                </div>
            </Link>
        );
    };

    return (
        <Layout>
            <section>
                <div className="events-banner-container container">
                    <div className="banner-title mb-4">{banner.title}</div>
                    <div className="banner-desc mb-6">{banner.desc}</div>
                    {/* <Link
                        className={clsx('button button--secondary button--lg', banner.action.type)}
                        to={banner.action.link}
                    >
                        {banner.action.label}
                    </Link> */}
                </div>
            </section>
            <section className="my-[5.5rem]">
                <div className="max-w-[75rem] mx-auto ">
                    <div
                        className={`flex flex-wrap gap-x-[1.5rem] gap-y-[5rem] ${
                            !showMore ? 'mb-[2.5rem]' : 'mb-[5rem]'
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
