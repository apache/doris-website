---
{
    "title": "Lookup Join",
    "language": "en",
    "description": "Use Flink Doris Connector for Lookup Join dimension table association with batched, asynchronous queries, and the Lookup options."
}
---

# Lookup Join

Lookup Join can optimize the performance of dimension table joins in Flink. When using Flink JDBC Connector for dimension table joins, you may encounter the following problems:

- Flink JDBC Connector uses synchronous query mode: each time upstream data (such as Kafka) sends a record, the Doris dimension table is queried immediately, leading to high query latency in high-concurrency scenarios.
- Queries executed via JDBC are usually point lookups one record at a time, while Doris recommends batch queries for better query efficiency.

Using [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) in Flink Doris Connector has the following advantages:

- Caches upstream data in batches, avoiding the high latency and database pressure caused by per-record queries.
- Executes association queries asynchronously, increasing data throughput and reducing the Doris query load.

## Example {#example}

The dimension table must be configured with `jdbc-url`, which the Lookup queries go through. Enable the cache with the `lookup.cache.*` options:

```sql
CREATE TABLE fact_table (
    `id` BIGINT,
    `name` STRING,
    `city` STRING,
    `process_time` as proctime()
) WITH (
    'connector' = 'kafka',
    ...
);

create table dim_city(
    `city` STRING,
    `level` INT,
    `province` STRING,
    `country` STRING
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'dim.dim_city',
    'username' = 'root',
    'password' = '',
    'lookup.cache.max-rows' = '100000',
    'lookup.cache.ttl' = '300s'
);

SELECT a.id, a.name, a.city, c.province, c.country, c.level
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

## Options {#options}

| Key                               | Default Value | Required | Comment                                       |
| --------------------------------- | ------------- | -------- | --------------------------------------------- |
| lookup.cache.max-rows             | -1            | N        | The maximum number of rows cached by lookup. The default value is -1, meaning caching is disabled. |
| lookup.cache.ttl                  | 10s           | N        | The maximum cache time for lookup. The default is 10s. |
| lookup.max-retries                | 1             | N        | The number of retries after a lookup query failure. |
| lookup.jdbc.async                 | FALSE         | N        | Whether to enable asynchronous lookup. The default is false. |
| lookup.jdbc.read.batch.size       | 128           | N        | In asynchronous lookup, the maximum batch size per query. |
| lookup.jdbc.read.batch.queue-size | 256           | N        | In asynchronous lookup, the size of the intermediate buffer queue. |
| lookup.jdbc.read.thread-size      | 3             | N        | The number of jdbc threads for lookup in each task. |
