export const NEWSLETTER_DATA = [
    {
        tags: ['Release Note'],
        title: "Apache Doris 3.1 Released: Better Semi-Structured Data Analytics, Stronger Lakehouse Support",
        content: `Doris 3.1 introduces a sparse column and schema template for the VARIANT data type, making it more efficient to store and query large datasets with dynamic fields, such as logs and JSON data. For lakehouse capabilities, it enhances asynchronous materialized views and expands support for Iceberg and Paimon to build a stronger bridge between data lakes and data warehouses.`,
        to: 'https://doris.apache.org/blog/release-note-3.1.0/',
        image: '/3.1.0.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "Apache Doris Up To 40x Faster Than ClickHouse | OLAP Showdown Part 2",
        content: `In every benchmark tested: CoffeeBench, TPC-H, and TPC-DS, Apache Doris consistently pulled ahead, establishing clear dominance over both ClickHouse v25.8 on-premises and ClickHouse Cloud.`,
        to: 'https://www.velodb.io/blog/1504',
        image: 'blogs/olap-showdown-2.JPEG',
    },
    {
        tags: ['Tech Sharing'],
        title: "Data Traits in Apache Doris: The Secret Weapon Behind 2x Faster Performance",
        content: `At the core of database systems, the query optimizer acts as a shrewd strategist, constantly analyzing data traits to devise the optimal execution plans. Apache Doris, a high-performance MPP analytical database, employs a built-in Data Trait analysis mechanism in its optimizer. By uncovering statistical traits and semantic constraints within the data, Data Trait provides fundamental support for query optimization. Let’s explore its power!`,
        to: 'https://www.velodb.io/blog/1488',
        image: 'blogs/data-trait-in-apache-doris.PNG',
    },
    {
        tags: ['Tech Sharing'],
        title: "Deep Dive: Data Pruning in Apache Doris",
        content: `We present the implementation strategies of four data pruning techniques in Apache Doris: predicate filtering, LIMIT pruning, TopK pruning, and JOIN pruning. Currently, these efficient pruning strategies significantly improve data processing efficiency in Doris.`,
        to: 'https://www.velodb.io/blog/1489',
        image: 'blogs/data-pruning-in-apache-doris.PNG',
    },


];