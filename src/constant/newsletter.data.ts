export const NEWSLETTER_DATA = [
    {
        tags: ['Tech Sharing'],
        title: "Multi-tenant workload isolation: a better balance between isolation and utilization",
        content: `Apache Doris supports workload isolation based on Resource Tag and Workload Group. It provides solutions for different tradeoffs among the level of isolation, resource utilization, and stable performance.`,
        to: '/blog/multi-tenant-workload-isolation-in-apache-doris',
        image: 'multi-tenant-workload-group.jpg',
    },
    {
        tags: ['Release Note'],
        title: "Apache Doris version 2.0.10 has been released",
        content: `Thanks to our community users and developers, about 83 improvements and bug fixes have been made in Doris 2.0.10 version.`,
        to: '/blog/release-note-2.0.10',
        image: '2.0.9.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "From Presto, Trino, ClickHouse, and Hive to Apache Doris: SQL convertor for easy migration",
        content: `Users can execute queries with their old SQL syntaxes directly in Doris or batch convert their existing SQL statements on the visual SQL conversion interface.`,
        to: '/blog/from-presto-trino-clickhouse-and-hive-to-apache-doris-sql-convertor-for-easy-migration',
        image: 'sql-convertor-feature.jpeg',
    },
    {
        tags: ['Best Practice'],
        title: "Cross-cluster replication for read-write separation: story of a grocery store brand",
        content: `Cross-cluster replication (CCR) in Apache Doris is proven to be fast, stable, and easy to use. It secures a real-time data synchronization latency of 1 second.`,
        to: '/blog/cross-cluster-replication-for-read-write',
        image: 'ccr-for-read-write-separation.jpg',
    },
];
