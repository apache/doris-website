export const NEWSLETTER_DATA = [
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
    {
        tags: ['Tech Sharing'],
        title: "Arrow Flight SQL for 10X faster data transfer",
        content: `Apache Doris 2.1 supports Arrow Flight SQL protocol for reading data from Doris. It delivers tens-fold speedups compared to PyMySQL and Pandas.`,
        to: '/blog/arrow-flight-sql-in-apache-doris-for-10x-faster-data-transfer',
        image: 'arrow-flight-sql-in-apache-doris-for-10x-faster-data-transfer.png',
    },
    {
        tags: ['Best Practice'],
        title: "Cross-cluster replication for read-write separation: story of a grocery store brand",
        content: `Cross-cluster replication (CCR) in Apache Doris is proven to be fast, stable, and easy to use. It secures a real-time data synchronization latency of 1 second.`,
        to: '/blog/cross-cluster-replication-for-read-write',
        image: 'ccr-for-read-write-separation.jpg',
    },
];
