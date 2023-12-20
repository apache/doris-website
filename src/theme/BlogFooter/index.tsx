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
                    history.push(
                        `${location.pathname}?currentPage=${page ? page : ''}&currentCategory=${
                            currentCategory ? currentCategory : ''
                        }#blog`,
                        location.state,
                    );
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
