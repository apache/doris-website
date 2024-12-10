import usePhone from '@site/src/hooks/use-phone';
import { Pagination } from 'swiper';
import React, { useCallback, useState } from 'react';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { USER_STORIES, USER_STORIES_CATEGORIES } from '@site/src/constant/user.data';
import ReadMore from '@site/src/components/ReadMore';
import { useAnimationFrame } from '../../hooks/use-animation-frame';

export function UserSwiper() {
    const { isPhone } = usePhone();
    const [progressCount, setProgressCount] = useState<number>(0);
    const [stop, setStop] = useState<boolean>(false);

    const [swiperRef, setSwiperRef] = useState<SwiperClass>();

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

    useAnimationFrame(deltaTime => {
        // Pass on a function to the setter of the state
        // to make sure we always have the latest state
        setProgressCount(prevProgressCount => {
            if (prevProgressCount >= 100) {
                handleNext();
                return 0;
            }
            if (deltaTime > 100) return prevProgressCount;

            return prevProgressCount + deltaTime * 0.02;
        });
    }, stop);

    return (
        <div style={{ position: 'relative' }} onMouseMove={() => setStop(true)} onMouseLeave={() => setStop(false)}>
            {!isPhone && (
                <div
                    onClick={handlePrevious}
                    className="swiper-button-prev invisible  group-hover:visible"
                    style={{ position: 'absolute', top: 'calc(50% - 2rem)', left: '-3rem', zIndex: 99 }}
                ></div>
            )}

            <Swiper
                pagination={pagination}
                spaceBetween={50}
                slidesPerView={1}
                navigation={false}
                modules={[Pagination]}
                loop={true}
                onSlideChange={() => setProgressCount(0)}
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
                    className="swiper-button-next invisible  group-hover:visible"
                    style={{ position: 'absolute', top: 'calc(50% - 2rem)', right: '-3rem', zIndex: 99 }}
                ></div>
            )}
        </div>
    );
}
