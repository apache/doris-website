import Layout from '../../theme/Layout';
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import './index.scss';
import Link from '@docusaurus/Link';
import PageColumn from '@site/src/components/PageColumn';
import MDXContent from '@theme/MDXContent';
import userCasesCn from '@site/userCases/zh_CN.json';
import userCasesEn from '@site/userCases/en_US.json';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper';

export default function Users(): JSX.Element {
    const { i18n } = useDocusaurusContext();
    const userCases = i18n.currentLocale === 'en' ? userCasesEn : userCasesCn;
    const getUserLogos = (page: number = 1, total: number = 30) => {
        const arr = new Array(total).fill('');
        return arr.map((item, index) => require(`@site/static/images/user-logo-${page}/u-${index + 1}.png`).default);
    };

    const pagination = {
        clickable: true,
        renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
        },
    };
    return (
        <Layout
            title={translate({ id: 'users.title', message: 'Users' })}
            description={translate({
                id: 'homepage.banner.subTitle',
                message: 'An easy-to-use, high-performance and unified analytical database',
            })}
        >
            <section className="users-wall">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="user.logos" description="Companies That Trust Apache Doris">
                            Companies That Trust Apache Doris
                        </Translate>
                    }
                >
                    <Swiper
                        pagination={pagination}
                        modules={[Pagination]}
                        spaceBetween={50}
                        slidesPerView={1}
                        className="mySwiper"
                        onSlideChange={() => console.log('slide change')}
                        onSwiper={(swiper: any) => console.log(swiper)}
                    >
                        <SwiperSlide>
                            <div className="users-wall-list row">
                                <img
                                    className="users-wall-img"
                                    src={require(`@site/static/images/user-logos-1.jpg`).default}
                                    alt=""
                                />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="users-wall-list row">
                                <img
                                    className="users-wall-img"
                                    src={require(`@site/static/images/user-logos-2.jpg`).default}
                                    alt=""
                                />
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="users-wall-list row">
                                <img
                                    className="users-wall-img"
                                    src={require(`@site/static/images/user-logos-3.jpg`).default}
                                    alt=""
                                />
                            </div>
                        </SwiperSlide>
                    </Swiper>
                </PageColumn>
            </section>
            <section className="story">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="user.user-case" description="Companies Powerd by Apache Doris">
                            Companies Powerd by Apache Doris
                        </Translate>
                    }
                    footer={
                        <div className="share-story">
                            <Link to="https://github.com/apache/doris/issues/10229" className="share-button">
                                <Translate id="user.add..your.company" description="Add Your Company">
                                    Share You Stroy
                                </Translate>
                            </Link>
                        </div>
                    }
                >
                    <div style={{ fontSize: 16, marginTop: '-2rem', marginBottom: '-1rem' }}>
                        <Translate
                            id="user.case-description"
                            description="There are more than 1,000 companies worldwide leveraging Apache Doris to build their unified
                            data analytical database. Some of them are listed below:"
                        >
                            There are more than 1,000 companies worldwide leveraging Apache Doris to build their unified
                            data analytical database. Some of them are listed below:
                        </Translate>
                    </div>
                    <div className="user-cases">
                        {userCases &&
                            userCases.map(item => (
                                <div className="user-case" key={item.name}>
                                    <h2 className="user-case-title">{item.name}</h2>
                                    <p className="user-case-intro">{item.introduction}</p>
                                </div>
                            ))}
                    </div>
                </PageColumn>
            </section>
        </Layout>
    );
}
