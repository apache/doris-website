import { useHistory, useLocation } from '@docusaurus/router';
import { ConfigProvider, Pagination } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import jaJP from 'antd/locale/ja_JP';
import koKR from 'antd/locale/ko_KR';
import ruRU from 'antd/locale/ru_RU';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import React from 'react';

export default function BlogListFooter({
    total,
    currentPage,
    currentCategory,
}: {
    total: number;
    currentPage: number;
    currentCategory?: string;
}) {
    const location = useLocation();
    const history = useHistory();
    const {i18n: {currentLocale}} = useDocusaurusContext();

    return (
        <div className="blog-pagination mt-6 flex flex-wrap gap-4 justify-between container">
            <div className="text-sm">{translate({id: 'blog.total', message: 'Total {total} items'}, {total})}</div>
            <ConfigProvider locale={({en: enUS, 'zh-CN': zhCN, ja: jaJP, ko: koKR, ru: ruRU})[currentLocale] ?? enUS}>
            <Pagination
                responsive
                onChange={page => {
                    const params = new URLSearchParams(location.search);
                    params.set('currentPage', String(page || 1));
                    params.set('currentCategory', currentCategory || 'All');
                    history.push(`${location.pathname}?${params.toString()}#blog`, location.state);
                }}
                defaultPageSize={9}
                current={currentPage}
                total={total}
                showSizeChanger={false}
                showQuickJumper
            />
            </ConfigProvider>
        </div>
    );
}
