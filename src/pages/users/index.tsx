import Layout from '../../theme/Layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import './index.scss';
import userCasesEn from '@site/userCases/en_US.json';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination } from 'swiper';
import usePhone from '@site/src/hooks/use-phone';
import PageHeader from '@site/src/components/PageHeader';
import { USER_STORIES, USER_STORIES_CATEGORIES } from '@site/src/constant/user.data';
import useIsBrowser from '@docusaurus/useIsBrowser';
import UserItem from './user-item';
import USERS from '../../constant/users.data.json';
import ReadMore from '@site/src/components/ReadMore';

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

    const [swiperRef, setSwiperRef] = useState<SwiperClass>();

    const theSlides = useMemo(() => ['slide one', 'slide two'], []);

    const handlePrevious = useCallback(() => {
        swiperRef?.slidePrev();
    }, [swiperRef]);

    const handleNext = useCallback(() => {
        swiperRef?.slideNext();
    }, [swiperRef]);

    const pagination = {
        clickable: true,
        renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
        },
    };

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

    function renderSwiper() {
        const modules = [Pagination];
        // if (!isPhone) {
        //     modules.push(Navigation);
        // }
        return (
            <div style={{ position: 'relative' }}>
                {!isPhone && (
                    <div
                        onClick={handlePrevious}
                        className="swiper-button-prev"
                        style={{ position: 'absolute', top: 'calc(50% - 2rem)', left: '-3rem', zIndex: 99 }}
                    ></div>
                )}

                <Swiper
                    pagination={pagination}
                    spaceBetween={50}
                    slidesPerView={1}
                    navigation={false}
                    modules={modules}
                    loop={true}
                    className="mySwiper"
                    // style={{ minHeight: 480 }}
                    onSlideChange={() => console.log('slide change')}
                    onSwiper={setSwiperRef}
                >
                    {USER_STORIES.map(userStory => {
                        return (
                            <SwiperSlide key={userStory.title}>
                                <div className="users-wall-list row flex flex-start pb-8 lg:pb-16">
                                    <div>
                                        <img
                                            className="users-wall-img lg:w-[580px] lg:h-[248px]"
                                            src={`${require(`@site/static/images/${userStory.image}`).default}`}
                                            alt="users-wall-img"
                                        />
                                    </div>
                                    <div className="w-[35.75rem] ml-4 lg:ml-12 flex flex-col py-4">
                                        <h3 className="leading-[38px] text-2xl">{userStory.title}</h3>
                                        <p className="my-6 text-base">
                                            <strong className="font-normal">{userStory.author.name}</strong>
                                            <span className="ml-6 text-[#4C576C]">{userStory.author.title}</span>
                                        </p>
                                        <ReadMore to={userStory.to} className="text-primary" />
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
                {!isPhone && (
                    <div
                        onClick={handleNext}
                        className="swiper-button-next"
                        style={{ position: 'absolute', top: 'calc(50% - 2rem)', right: '-3rem', zIndex: 99 }}
                    ></div>
                )}
            </div>
        );
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
            <section className="users-wall container lg:pt-[88px]">{renderSwiper()}</section>
            <section className="lg:pt-[5.5rem] container">
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
                <ul className="mt-6 grid gap-1 grid-cols-2 lg:gap-6 lg:mt-12 lg:grid-cols-4 pb-[88px]">
                    {users.map(user => (
                        <UserItem key={user.name} {...user} />
                    ))}
                </ul>
            </section>
        </Layout>
    );
}
