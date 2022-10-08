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
        title: <Translate>Get Started</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-start.png').default,
        list: [
            {
                title: <Translate>Introduction to Apache Doris</Translate>,
                link: '/docs/dev/summary/basic-summary',
            },
            {
                title: <Translate>Get Started</Translate>,
                link: '/docs/dev/get-starting/',
            },
            {
                title: <Translate>Installation and deployment</Translate>,
                link: '/docs/dev/install/install-deploy',
            },
            {
                title: <Translate>Compilation</Translate>,
                link: '/docs/dev/install/source-install/compilation',
            },
        ],
    },
    {
        title: <Translate>Table Design</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-model.png').default,
        list: [
            {
                title: <Translate>Data Model</Translate>,
                link: '/docs/dev/data-table/data-model',
            },
            {
                title: <Translate>Data Partition</Translate>,
                link: '/docs/dev/data-table/data-partition',
            },
            {
                title: <Translate>Guidelines for Creating Table</Translate>,
                link: '/docs/dev/data-table/basic-usage',
            },
            {
                title: <Translate>Rollup and Query</Translate>,
                link: '/docs/dev/data-table/hit-the-rollup',
            },
            {
                title: <Translate>Practices of Creating Table</Translate>,
                link: '/docs/dev/data-table/best-practice',
            },
            {
                title: <Translate>Index</Translate>,
                link: '/docs/dev/data-table/index/prefix-index',
            },
        ],
    },
    {
        title: <Translate>Data Import</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-refresh.png').default,
        list: [
            {
                title: <Translate>Import Overview</Translate>,
                link: '/docs/dev/data-operate/import/load-manual',
            },
            {
                title: <Translate>Import Local Data</Translate>,
                link: '/docs/dev/data-operate/import/import-scenes/local-file-load',
            },
            {
                title: <Translate>Import External Storage Data</Translate>,
                link: '/docs/dev/data-operate/import/import-scenes/external-storage-load',
            },
            {
                title: <Translate>Subscribe Kafka Data</Translate>,
                link: '/docs/dev/data-operate/import/import-scenes/kafka-load',
            },
            {
                title: <Translate>Synchronize Data Through External Table</Translate>,
                link: '/docs/dev/data-operate/import/import-scenes/external-table-load',
            },
        ],
    },
    {
        title: <Translate>Data Export</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-setting.png').default,
        list: [
            {
                title: <Translate>Export Data</Translate>,
                link: '/docs/dev/data-operate/export/export-manual',
            },
            {
                title: <Translate>Export Query Result</Translate>,
                link: '/docs/dev/data-operate/export/outfile',
            },
            {
                title: <Translate>Export Table Structure or Data</Translate>,
                link: '/docs/dev/data-operate/export/export_with_mysql_dump',
            },
            {
                title: <Translate>Data Backup</Translate>,
                link: '/docs/dev/admin-manual/data-admin/backup',
            },
        ],
    },
    {
        title: <Translate>Update and Delete</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-export.png').default,
        list: [
            {
                title: <Translate>Update</Translate>,
                link: '/docs/dev/data-operate/update-delete/update',
            },
            {
                title: <Translate>Delete</Translate>,
                link: '/docs/dev/data-operate/update-delete/delete-manual',
            },
            {
                title: <Translate>Batch Delete</Translate>,
                link: '/docs/dev/data-operate/update-delete/batch-delete-manual',
            },
            {
                title: <Translate>Sequence Column</Translate>,
                link: '/docs/dev/data-table/best-practice',
            },
        ],
    },
    {
        title: <Translate>Advanced Usage</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-book.png').default,
        list: [
            {
                title: <Translate>Schema Change</Translate>,
                link: '/docs/dev/advanced/alter-table/schema-change',
            },
            {
                title: <Translate>Dynamic Partition</Translate>,
                link: '/docs/dev/advanced/partition/dynamic-partition',
            },
            {
                title: <Translate>Data Cache</Translate>,
                link: '/docs/dev/advanced/cache/partition-cache',
            },
            {
                title: <Translate>Join Optimization</Translate>,
                link: '/docs/dev/advanced/join-optimization/doris-join-optimization',
            },
            {
                title: <Translate>Materialized view</Translate>,
                link: '/docs/dev/advanced/materialized-view',
            },
            {
                title: <Translate>BITMAP Precise De-duplication</Translate>,
                link: '/docs/dev/advanced/orthogonal-bitmap-manual',
            },
            {
                title: <Translate>HLL ApproximateDe-duplication</Translate>,
                link: '/docs/dev/advanced/using-hll',
            },
            {
                title: <Translate>Variables</Translate>,
                link: '/docs/dev/advanced/variables',
            },
            {
                title: <Translate>Time Zone</Translate>,
                link: '/docs/dev/advanced/time-zone',
            },
            {
                title: <Translate>File Manager</Translate>,
                link: '/docs/dev/advanced/small-file-mgr',
            },
        ],
    },
    {
        title: <Translate>Ecosystem</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-search.png').default,
        list: [
            {
                title: <Translate>Doris on ES</Translate>,
                link: '/docs/dev/ecosystem/external-table/doris-on-es',
            },
            {
                title: <Translate>Doris on Hudi</Translate>,
                link: '/docs/dev/ecosystem/external-table/hudi-external-table',
            },
            {
                title: <Translate>Doris on Iceberg</Translate>,
                link: '/docs/dev/ecosystem/external-table/iceberg-of-doris',
            },
            {
                title: <Translate>Doris on Hive</Translate>,
                link: '/docs/dev/ecosystem/external-table/hive-of-doris',
            },
            {
                title: <Translate>Doris on ODBC</Translate>,
                link: '/docs/dev/ecosystem/external-table/odbc-of-doris',
            },
            {
                title: <Translate>Spark Doris Connector</Translate>,
                link: '/docs/dev/ecosystem/spark-doris-connector',
            },
            {
                title: <Translate>Flink Doris Connector</Translate>,
                link: '/docs/dev/ecosystem/flink-doris-connector',
            },
            {
                title: <Translate>Seatunnel Connector</Translate>,
                link: '/docs/dev/ecosystem/seatunnel/flink-sink',
            },
            {
                title: <Translate>DataX doriswriter</Translate>,
                link: '/docs/dev/ecosystem/datax',
            },
            {
                title: <Translate>UDF</Translate>,
                link: '/docs/dev/ecosystem/udf/java-user-defined-function',
            },
            {
                title: <Translate>Audit log plugin</Translate>,
                link: '/docs/dev/ecosystem/audit-plugin',
            },
        ],
    },
    {
        title: <Translate>SQL Manual</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-sql.png').default,
        list: [
            {
                title: <Translate>SQL Function</Translate>,
                link: '/docs/dev/sql-manual/sql-functions/date-time-functions/dayname',
            },
            {
                title: <Translate>DDL</Translate>,
                link: '/docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-DATABASE',
            },
            {
                title: <Translate>DML</Translate>,
                link: '/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/INSERT',
            },
            {
                title: <Translate>Data Types</Translate>,
                link: '/docs/dev/sql-manual/sql-reference/Data-Types/VARCHAR',
            },
            {
                title: <Translate>Utility</Translate>,
                link: '/docs/dev/sql-manual/sql-reference/Utility-Statements/HELP',
            },
        ],
    },
    {
        title: <Translate>Cluster Management</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-admin.png').default,
        list: [
            {
                title: <Translate>Cluster Upgrade</Translate>,
                link: '/docs/dev/admin-manual/cluster-management/upgrade',
            },
            {
                title: <Translate>Elastic scaling</Translate>,
                link: '/docs/dev/admin-manual/cluster-management/elastic-expansion',
            },
            {
                title: <Translate>Statistics of query execution</Translate>,
                link: '/docs/dev/admin-manual/query-profile',
            },
            {
                title: <Translate>Maintenance and Monitor</Translate>,
                link: '/docs/dev/admin-manual/maint-monitor/monitor-alert',
            },
            {
                title: <Translate>Metadata Operation</Translate>,
                link: '/docs/dev/admin-manual/maint-monitor/metadata-operation',
            },
            {
                title: <Translate>Error Code</Translate>,
                link: '/docs/dev/admin-manual/maint-monitor/doris-error-code',
            },
            {
                title: <Translate>Config</Translate>,
                link: '/docs/dev/admin-manual/config/fe-config',
            },
            {
                title: <Translate>Authority Management</Translate>,
                link: '/docs/dev/admin-manual/privilege-ldap/user-privilege',
            },
            {
                title: <Translate>Multi-tenancy</Translate>,
                link: '/docs/dev/admin-manual/multi-tenant',
            },
        ],
    },
    {
        title: <Translate>FAQ</Translate>,
        icon: require('@site/static/images/sitemap/sitemap-question.png').default,
        list: [
            {
                title: <Translate>FAQs of Operation and Maintenance</Translate>,
                link: '/docs/dev/faq/install-faq',
            },
            {
                title: <Translate>FAQs of Data Operation</Translate>,
                link: '/docs/dev/faq/data-faq',
            },
            {
                title: <Translate>SQL FAQs</Translate>,
                link: '/docs/dev/faq/sql-faq',
            },
        ],
    },
];
export default function Learning(): JSX.Element {
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
                            Learning Path
                        </Translate>
                    }
                    subTitle={
                        <Translate id="sitemap.page.subTitle" description="">
                            Start your journey here to discover infinite possibilities with Apache Doris.
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
                                            {path.title}
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
