export const NEWSLETTER_DATA = [
    {
        tags: ['Best Practice'],
        title: "Apache Doris for log and time series data analysis in NetEase, why not Elasticsearch and InfluxDB?",
        content: `NetEase has replaced Elasticsearch and InfluxDB with Apache Doris in its monitoring and time series data analysis platforms, respectively, achieving 11X query performance and saving 70% of resources.`,
        to: '/blog/apache-doris-for-log-and-time-series-data-analysis-in-netease',
        image: 'doris-for-log-and-time-series-data-analysis-in-netease.jpg',
    },
    {
        tags: ['Release Note'],
        title: "Apache Doris version 2.1.3 just released",
        content: `This version has updated several improvements, including writing data back to Hive, materialized view, permission management and bug fixes. It further enhances the performance and stability of the system.`,
        to: '/blog/release-note-2.1.3',
        image: '2.1.3.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "Multi-tenant workload isolation: a better balance between isolation and utilization",
        content: `Apache Doris supports workload isolation based on Resource Tag and Workload Group. It provides solutions for different tradeoffs among the level of isolation, resource utilization, and stable performance.`,
        to: '/blog/multi-tenant-workload-isolation-in-apache-doris',
        image: 'multi-tenant-workload-group.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "From Presto, Trino, ClickHouse, and Hive to Apache Doris: SQL convertor for easy migration",
        content: `Users can execute queries with their old SQL syntaxes directly in Doris or batch convert their existing SQL statements on the visual SQL conversion interface.`,
        to: '/blog/from-presto-trino-clickhouse-and-hive-to-apache-doris-sql-convertor-for-easy-migration',
        image: 'sql-convertor-feature.jpeg',
    },
];
