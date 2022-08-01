import Layout from '../../theme/Layout';
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import './index.scss';
import Link from '@docusaurus/Link';
import More from '@site/src/components/More/index';
import PageColumn from '@site/src/components/PageColumn';

const arr = new Array(30).fill('');
const usersWalls = arr.map((item, index) => require(`@site/static/images/icon/u${index + 1}.png`).default);

const storyList = [
    {
        img: require('@site/static/images/icon/meituan.png').default,
        summary: (
            <Translate id="sotry.summary.meituan">
                Apache Doris can better meet the requirements of summary and detailed query, historical backtracking,
                flexible query and real-time processing.
            </Translate>
        ),
        link: '/blog/meituan',
        id: 'meituan',
    },
    {
        img: require('@site/static/images/icon/jd.png').default,
        summary: (
            <Translate id="sotry.summary.jindong">
                Apache Doris can not only deal with second-level queries of massive data, but also meet real-time and
                quasi-real-time analysis requirements.
            </Translate>
        ),
        link: '/blog/jd',
        id: 'jindong',
    },
    {
        img: require('@site/static/images/icon/xiaomi.png').default,
        summary: (
            <Translate id="sotry.summary.xiaomi">
                Apache Doris has been widely used in Xiaomi, and it has served dozens of businesses and formed a set of
                data ecology with it as the core.
            </Translate>
        ),
        link: '/blog/xiaomi',
        id: 'xiaomi',
    },
];
export default function Users(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
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
                        <Translate id="user.companies" description="Companies That Trust Apache Doris">
                            Companies That Trust Apache Doris
                        </Translate>
                    }
                >
                    <ul className="users-wall-list row">
                        {usersWalls.map((item, index) => (
                            <li className="users-wall-item col col--2" key={index}>
                                <img className="users-wall-img" src={item} alt="" />
                            </li>
                        ))}
                    </ul>
                </PageColumn>
            </section>
            <section className="story">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="user.case" description="Case Studies">
                            Case Studies
                        </Translate>
                    }
                    footer={
                        <div className="share-story">
                            <Link to="https://github.com/apache/doris/issues/10229" className="share-button">
                                <Translate id="user.add..your.company" description="Add Your Company">
                                    Add Your Company
                                </Translate>
                            </Link>
                        </div>
                    }
                >
                    <div className="row">
                        {storyList.map((item, index) => (
                            <div className="col col--4" key={index}>
                                <div className="story-item">
                                    <img src={item.img} alt="" />
                                    <p className="story-summary">{item.summary}</p>
                                    <More link={item.link} />
                                </div>
                            </div>
                        ))}
                    </div>
                </PageColumn>
            </section>
        </Layout>
    );
}
