export const NEWSLETTER_DATA = [
    {
        tags: ['Tech Sharing'],
        title: "Dynamic JSON in Agent Workloads: Apache Doris vs ClickHouse, Elasticsearch, and OpenSearch",
        content: `AI agent logs create wide, fast-changing JSON payloads that are difficult to analyze with predictable latency. We compare how Apache Doris, ClickHouse, Elasticsearch, and OpenSearch perform in such scenario.`,
        to: 'https://www.velodb.io/blog/dynamic-json-in-agent-workloads-apache-doris-clickhouse-elasticsearch-and-opensearch',
        image: 'blogs/202608_dynamic_json_horizontal.jpeg',
    },
    {
        tags: ['Tech Sharing'],
        title: "PostgreSQL CDC to Apache Doris: Real-Time Sync with One SQL Statement",
        content: `Apache Doris offers native CDC for PostgreSQL, replacing separate CDC, Kafka, Flink, or Spark components with one built-in streaming job.`,
        to: 'https://www.velodb.io/blog/postgresql-cdc-to-apache-doris-real-time-sync-with-one-sql-statement',
        image: 'blogs/202608_PG_CDC_horizontal.jpeg',
    },
    {
        tags: ['Best Practice'],
        title: "From Spark to Apache Doris: How Kwai Made A/B Testing Metrics 145x Faster at Scale",
        content: `Kwai migrated its company-wide A/B testing metrics pipeline from Spark to Apache Doris. The rebuild delivered 145x faster metrics computation and cut resource consumption by 72%.`,
        to: 'https://www.velodb.io/blog/from-spark-to-apache-doris-how-kwai-made-a-b-testing-metrics-145x-faster-at-scale',
        image: 'blogs/202608_Kwai_spark_horizontal.jpeg',
    },
    {
        tags: ['Tech Sharing'],
        title: "Apache Doris Python UDF: Calling the Python Ecosystem from SQL for Agent-Era",
        content: `Apache Doris adds Python UDF in 4.1.3. This enables teams to create and call Python functions directly in SQL, bringing Pandas, PyArrow, and the rest of the Python ecosystem into the Doris query path.`,
        to: 'https://www.velodb.io/blog/apache-doris-python-udf-calling-the-python-from-sql-for-agent-era',
        image: 'blogs/202608_Python_UDF_horizontal.jpeg',
    },
];
