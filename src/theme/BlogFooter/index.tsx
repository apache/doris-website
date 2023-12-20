import { ConfigProvider, Pagination } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';

export default function BlogListFooter({
    total,
    currentPage,
    setCurrentPage,
}: {
    total: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
}) {
    return (
        <div className="mt-6 flex justify-between container">
            <div className="text-sm text-[#8592A6]">共 {total} 项数据</div>
            <Pagination
                responsive
                onChange={page => {
                    setCurrentPage(page);
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
