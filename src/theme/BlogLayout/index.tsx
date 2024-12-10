import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';

import type { Props } from '@theme/BlogLayout';

interface BlogLayoutProps extends Props {
    pageType: string;
}

export default function BlogLayout(props: BlogLayoutProps): JSX.Element {
    const { sidebar, toc, children, pageType, ...layoutProps } = props;
    const hasSidebar = sidebar && sidebar.items.length > 0;
    const isBlogListPage = pageType === 'blogList';
    
    return (
        <Layout {...layoutProps}>
            <div className="mb-[4.875rem] container">
                <div className="lg:row lg:flex">
                    <BlogSidebar sidebar={sidebar} />
                    <main
                        className={clsx({
                            col: !isBlogListPage,
                            'col--7': hasSidebar && !isBlogListPage,
                            'col--12': !hasSidebar && isBlogListPage,
                            'col--9 col--offset-1': !hasSidebar && !isBlogListPage,
                        })}
                        itemScope
                        itemType="http://schema.org/Blog"
                    >
                        {children}
                    </main>
                    {toc && <div className="col col--2">{toc}</div>}
                </div>
            </div>
        </Layout>
    );
}
