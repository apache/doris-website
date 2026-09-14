---
{
    "title": "Lookup Join 维表关联",
    "language": "zh-CN",
    "description": "使用 Flink Doris Connector 进行 Lookup Join 维表关联，通过攒批和异步查询提升性能，以及 Lookup 相关配置项。"
}
---

# Lookup Join 维表关联

使用 Lookup Join 可优化 Flink 中维表关联的性能。当使用 Flink JDBC Connector 进行维表关联时，会遇到以下问题：

- Flink JDBC Connector 采用同步查询模式：上游数据（如 Kafka）每发送一条数据，会立即查询 Doris 维表，导致高并发场景下查询延迟较高。
- JDBC 方式执行的查询通常是逐条点查，Doris 更推荐批量查询以提升查询效率。

使用 [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join) 在 Flink Doris Connector 中具有以下优势：

- 批量缓存上游数据，避免逐条查询带来的高延迟和数据库压力。
- 异步执行关联查询，提升数据吞吐量并减少 Doris 查询负载。

## 使用示例 {#example}

维表需要配置 `jdbc-url`，Lookup 查询通过该 JDBC 地址执行；通过 `lookup.cache.*` 可以开启缓存：

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

## 配置项 {#options}

| Key                               | Default Value | Required | Comment                                      |
| --------------------------------- | ------------- | -------- | -------------------------------------------- |
| lookup.cache.max-rows             | -1            | N        | lookup 缓存的最大行数，默认值 -1，不开启缓存 |
| lookup.cache.ttl                  | 10s           | N        | lookup 缓存的最大时间，默认 10s              |
| lookup.max-retries                | 1             | N        | lookup 查询失败后的重试次数                  |
| lookup.jdbc.async                 | FALSE         | N        | 是否开启异步的 lookup，默认 false            |
| lookup.jdbc.read.batch.size       | 128           | N        | 异步 lookup 下，每次查询的最大批次大小       |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 异步 lookup 时，中间缓冲队列的大小           |
| lookup.jdbc.read.thread-size      | 3             | N        | 每个 task 中 lookup 的 jdbc 线程数           |
