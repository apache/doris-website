export const NEWSLETTER_DATA = [
    {
        tags: ['Best Practice'],
        title: "How ByteDance Solved Billion-Scale Vector Search Problem with Apache Doris 4.0",
        content: `With Apache Doris 4.0 and its hybrid search capabilities, ByteDance built a search system handling 1 billion+ vectors, achieving accuracy, low latency, and cost-efficiency in infra costs. `,
        to: 'https://www.velodb.io/blog/bytedance-solved-billion-scale-vector-search-problem-with-apache-doris-4-0',
        image: 'blogs/202512_ByteDance_horizontal.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Apache Doris Up to 34x Faster Than ClickHouse in Real-Time Updates",
        content: `We benchmarked Apache Doris against ClickHouse on ClickBench and SSB (Star Schema Benchmark), under fair resource allocations in each product's cloud services. Results: Apache Doris is 18-34x faster than ClickHouse in SSB and 2.5-4.6x faster than ClickHouse in ClickBench.`,
        to: 'https://www.velodb.io/blog/apache-doris-34x-faster-clickhouse-realtime-updates',
        image: 'blogs/20250930_ck_cdc_header_1.jpg',
    },
    {
        tags: ['Tech Sharing'],
        title: "Fast JSON Analytics in Apache Doris: 100x Faster Than PostgreSQL and MongoDB",
        content: `Apache Doris uses the VARIANT data type to deliver flexible, high-performance JSON handling, thanks to features like dynamic subcolumns, sparse columns, schema templates, lazy materialization, and path-based indexing.`,
        to: 'https://www.velodb.io/blog/fast-json-analytics-in-apache-doris-100x-faster-than-postgresql-and-mongodb',
        image: 'blogs/202512_Variant_horizontal.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Deploying Apache Doris with MinIO: Analytics with Storage-Compute Separation",
        content: `In the Apache Doris + MinIO architecture, Apache Doris handles compute, MinIO handles storage, and the result is a modern analytics architecture that’s fast, scalable, cost-efficient, and separates compute from storage. `,
        to: 'https://www.velodb.io/blog/deploying-apache-doris-with-minio',
        image: 'blogs/202512_MinIO.png', 
    }

];