import React, { useEffect } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
// import BlogSidebar from '@theme/BlogSidebar';
import './style.scss';
import PageHeader from '@site/src/components/PageHeader';
import HeadBlogs from '@site/src/components/blogs/components/head-blogs';
import BlogList from '@site/src/components/blogs/components/blog-list';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
export default function BlogLayout(props) {
    const { sidebar, toc, children, pageType, ...layoutProps } = props;
    const hasSidebar = sidebar && sidebar.items.length > 0;
    const isBlogListPage = pageType === 'blogList';

    return (
        <Layout {...layoutProps}>
            {/* <div className="container margin-vert--lg blog-container">
                <HeadBlogs />

                <section className="container mx-auto mt-6 pb-8 lg:mt-24 lg:pb-12">
                    <main
                        className={clsx('col', {
                            'col--7': hasSidebar,
                            'col--12': !hasSidebar && isBlogListPage,
                            'col--9 col--offset-1': !hasSidebar && !isBlogListPage,
                        })}
                        itemScope
                        itemType="http://schema.org/Blog"
                    >
                        {children}
                    </main>
                </section>
            </div> */}
            <div className="container margin-vert--lg blog-container">
                <PageHeader title="Blog" />
                <div className="row">
                    {/* <BlogSidebar sidebar={sidebar} /> */}
                    <main itemScope itemType="http://schema.org/Blog">
                        {children}
                    </main>
                    {toc && <div className="col col--2">{toc}</div>}
                </div>
            </div>
        </Layout>
    );
}
