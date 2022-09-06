import Layout from '../../theme/Layout';
import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import './siteMap.scss';
import Link from '@docusaurus/Link';
import More from '@site/src/components/More/index';
import PageColumn from '@site/src/components/PageColumn';

const sitemapList = [
    {
        title: '快速开始',
        icon: require('@site/static/images/sitemap/sitemap-start.png').default,
        list: [
            {
                title: '安装部署',
                link: '',
            },
            {
                title: '建表',
                link: '',
            },
            {
                title: '数据导入及查询',
                link: '',
            },
        ],
    },
    {
        title: '数据模型',
        icon: require('@site/static/images/sitemap/sitemap-model.png').default,
        list: [
            {
                title: 'Doris数据模型介绍',
                link: '',
            },
            {
                title: '数据分布',
                link: '',
            },
            {
                title: 'Doris索引',
                link: '',
            },
            {
                title: 'Doris数据模型介绍',
                link: '',
            },
            {
                title: '数据分布',
                link: '',
            },
            {
                title: 'Doris索引',
                link: '',
            },
        ],
    },
];
export default function SiteMap(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={translate({ id: 'sitemap.title', message: 'SiteMap' })}
            description={translate({
                id: 'sitemap.subTitle',
                message: '',
            })}
        >
            <section className="sitemap">
                <PageColumn
                    align="left"
                    title={
                        <Translate id="sitemap.page.title" description="">
                            Leaning Path
                        </Translate>
                    }
                >
                    <div className="sitemap-list row">
                        {sitemapList.map((item, index) => (
                            <div className="sitemap-item" key={index}>
                                <div className="sitemap-title">{item.title}</div>
                                <div className="sitemap-icon">
                                    <img src={item.icon} alt="" />
                                </div>
                                <div className="sitemap-paths">
                                    {item.list.map(path => (
                                        <Link to={path.link} key={path.link} className="path-link">
                                            <Translate id={`sitemap.link.${path.title}`} description="">
                                                {path.title}
                                            </Translate>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </PageColumn>
            </section>
        </Layout>
    );
}
