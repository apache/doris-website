import { useHistory, useLocation } from '@docusaurus/router';
import { ConfigProvider, Pagination } from 'antd';
import zhCN from 'antd/locale/zh_CN';
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

    return (
        <div className="mt-6 flex justify-between container">
            <div className="text-sm text-[#8592A6]">Total {total} items</div>
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
        </div>
    );
}
