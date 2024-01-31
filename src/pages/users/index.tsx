import Layout from '../../theme/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import './index.scss';
import userCasesEn from '@site/userCases/en_US.json';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';

import { Pagination } from 'swiper';
import usePhone from '@site/src/hooks/use-phone';
import PageHeader from '@site/src/components/PageHeader';
import { USER_STORIES, USER_STORIES_CATEGORIES } from '@site/src/constant/user.data';
import useIsBrowser from '@docusaurus/useIsBrowser';
import UserItem from './user-item';
import USERS from '../../constant/users.data.json';
import ReadMore from '@site/src/components/ReadMore';
import LinkWithArrow from '@site/src/components/link-arrow';
import { UserSwiper } from './user-swiper';

const ALL_TEXT = 'All';

export default function Users(): JSX.Element {
    const { i18n } = useDocusaurusContext();
    const userCases = userCasesEn;
    const { isPhone } = usePhone();
    const isBrowser = useIsBrowser();
    const [active, setActive] = useState(() => {
        const tag = isBrowser ? sessionStorage.getItem('tag') : ALL_TEXT;
        return tag || ALL_TEXT;
    });
    const [users, setUsers] = useState([...USERS].sort((a, b) => a.order - b.order));
    const getUserLogos = (page: number = 1, total: number = 30) => {
        const arr = new Array(total).fill('');
        return arr.map((item, index) => require(`@site/static/images/user-logo-${page}/u-${index + 1}.png`).default);
    };

    const PAGE_SIZE = 32;
    const [currentSize, setCurrentSize] = useState<number>(PAGE_SIZE);

    useEffect(() => {
        setActive(ALL_TEXT);
    }, []);

    const theSlides = useMemo(() => ['slide one', 'slide two'], []);

    function changeCategory(category: string) {
        setActive(category);
        let currentCategory = USER_STORIES_CATEGORIES.find(item => item === category);
        const currentUsers = USERS.filter(user => user.category === category);
        if (category === ALL_TEXT) {
            setUsers([...USERS].sort((a, b) => a.order - b.order));
        } else {
            setUsers(currentUsers);
        }
        if (!currentCategory) {
            setActive(ALL_TEXT);
            currentCategory = USER_STORIES_CATEGORIES.find(item => item === ALL_TEXT);
        }
    }

    return (
        <Layout
            title={translate({ id: 'users.title', message: 'User Stories' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
        >
            <PageHeader
                className="lg:pt-[7.5rem] px-4"
                title="Start Real-Time Journey with Innovators"
                subtitle="Over 4000 global leaders and enterprises are powered by Apache Doris."
                extra={
                    <div className="flex justify-center mt-5">
                        <button
                            className="button-primary"
                            onClick={() => window.open('https://github.com/apache/doris/discussions/27683', '_blank')}
                        >
                            Share your story
                        </button>
                    </div>
                }
            />

            <section className="group">
                <div className="users-wall container lg:pt-[88px] ">{<UserSwiper />}</div>
            </section>
            <section className="lg:pt-[5.5rem] container pb-[88px]">
                <div className="blog-list-wrap row mt-28 lg:mt-0">
                    <ul className="container scrollbar-none mt-0 m-auto flex flex-wrap gap-3 overflow-auto lg:w-[58rem] text-[#4C576C] lg:mt-8 lg:justify-center lg:gap-6 ">
                        {USER_STORIES_CATEGORIES.map((item: any) => (
                            <li className="py-px" key={item} onClick={() => changeCategory(item)}>
                                <span
                                    className={`block cursor-pointer whitespace-nowrap rounded-[2.5rem] px-4 py-2 text-sm shadow-[0px_1px_4px_0px_rgba(49,77,136,0.10)] hover:bg-primary hover:text-white lg:px-6 lg:py-3 lg:text-base ${
                                        active === item && 'bg-primary text-white'
                                    }`}
                                >
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <ul className="mt-6 grid gap-1 grid-cols-2 lg:gap-8 lg:mt-12 lg:grid-cols-4 ">
                    {users.slice(0, currentSize).map(user => (
                        <UserItem key={user.name} {...user} />
                    ))}
                </ul>
                {currentSize < users.length && (
                    <div
                        onClick={() => setCurrentSize(currentSize => Math.min(currentSize + PAGE_SIZE, users.length))}
                        className="justify-center flex mt-9"
                    >
                        <div className="flex items-center cursor-pointer px-8 py-4 border border-[#444FD9] rounded text-[#444FD9] text-base">
                            <span className="mr-1">View more</span>
                            <span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="17"
                                    height="17"
                                    viewBox="0 0 17 17"
                                    fill="none"
                                >
                                    <path
                                        d="M4.5 9.82226L8.5 13.8222L12.5 9.82227"
                                        stroke="#444FD9"
                                        strokeWidth="1.37143"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M8.49951 3.82227L8.49951 13.8223"
                                        stroke="#444FD9"
                                        strokeWidth="1.37143"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </div>
                    </div>
                )}
            </section>
        </Layout>
    );
}
