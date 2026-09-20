---
{
    "title": "Incremental Reading with Doris Binlog",
    "language": "en",
    "description": "Continuously read the row-level changes of a Doris table with ROW-format Binlog enabled through Flink Doris Connector: startup modes, change types, delivery semantics, the offset table, and options."
}
---

# Incremental Reading with Doris Binlog

For a Doris table with ROW-format Binlog enabled, Flink Doris Connector can continuously read row-level changes. In `initial` mode, the Connector first reads the current table snapshot and then seamlessly switches to incremental reading.

:::info Version requirements
This feature requires Flink Doris Connector 26.3.0 or later and Doris 5.0.0 or later. Row Binlog is an experimental feature of Doris 5.0.0 and must be enabled with `enable_feature_binlog = true` in the FE configuration. For how to enable it on a table, the supported table models, and its limitations, see [Row Binlog](../../../data-operate/incremental/row-binlog.md).
:::

## Example {#example}

First, enable row-format Binlog on the Doris source table. `binlog.need_historical_value` is required when the consumer needs the before-image of updated rows:

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_binlog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);

INSERT INTO test.student_binlog_source VALUES (1, 'Alice', 18);
```

Then enable Flink Checkpoint and create the Doris source table:

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_binlog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_binlog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_binlog;
```

## Startup Modes {#scan-mode}

After the job starts, changes to `test.student_binlog_source` are continuously emitted as Flink changelog records. Select the startup mode with `source.scan.mode`:

| Mode | Behavior |
| ---- | -------- |
| `snapshot` | Reads the current snapshot and stops. This is the default mode. |
| `initial` | Reads the current snapshot and switches to continuous Binlog reading when the snapshot is complete. |
| `latest` | Skips the snapshot and reads changes generated after the job starts. |
| `from-timestamp` | Skips the snapshot and reads changes starting at the inclusive time specified by `source.scan.timestamp` in `yyyy-MM-dd HH:mm:ss` format. |

## Change Types {#increment-type}

By default, the Connector emits full row changes in `detail` mode. Set `source.binlog.increment-type` to `min_delta` for the minimal change set or `append_only` for append events only.

## Notes

- Incremental reading uses Arrow Flight SQL. The Connector enables it by default and automatically discovers its port.
- Enable Flink Checkpoint.
- Configure Doris Binlog retention to cover the maximum expected job downtime. If the required Binlog data has expired, restart from a new snapshot or specify a new start time.
- When performing a Binlog incremental read, Doris waits for in-flight transactions affecting the source table within the read window to complete. If the wait times out, the read returns an error. The Connector retries the same window only for this error, for up to `source.binlog.visible-wait-timeout` (default: `5m`). Set it to `0s` to disable Connector retries; other errors fail immediately.

## Delivery Semantics and Deduplication {#delivery}

The Doris Binlog Source currently provides at-least-once delivery, so change events can be replayed after a failure and may affect Flink query results. Flink's CDC event deduplication is disabled by default. To use it, set the following option before submitting the query:

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

When this option is enabled, the source table must declare a primary key, as in the example above. Flink uses an additional stateful operator to normalize the changelog. See the [Flink configuration reference](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) for details.

## Publishing Consumption Progress to Doris (Optional) {#offset-table}

Consumption progress is stored in Flink Checkpoints by default. To also query the progress in Doris, create the following offset table:

```sql
CREATE DATABASE IF NOT EXISTS ops;

CREATE TABLE ops.flink_source_offsets (
    consumer_id VARCHAR(256) NOT NULL,
    offset_timestamp DATETIME NOT NULL,
    update_time DATETIMEV2(3) NOT NULL
)
UNIQUE KEY(consumer_id)
DISTRIBUTED BY HASH(consumer_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.binlog.offset-table' = 'ops.flink_source_offsets',
'source.binlog.consumer-id' = 'student-sync'
```

`source.binlog.consumer-id` identifies the consumer job and should remain unchanged when the same job restarts.

## Options {#options}

The following options control incremental reading. The other Source options are listed in [Reading Data from Doris](./read.md#options).

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source startup mode. Supported values: `snapshot`, `initial`, `latest`, and `from-timestamp`.                                                           |
| source.scan.timestamp       | --            | N        | Inclusive start time in `yyyy-MM-dd HH:mm:ss` format. Required only for `from-timestamp`.                                                              |
| source.binlog.increment-type | detail       | N        | Binlog change type: `detail`, `min_delta`, or `append_only`.                                                                                           |
| source.binlog.poll-interval | 10s           | N        | Interval for polling new Binlog data. The minimum value is 1 second.                                                                                    |
| source.binlog.visible-wait-timeout | 5m            | N        | Maximum time for the Connector to retry the same read window after Doris returns a transaction visibility wait timeout error. Set to `0s` to disable retries; negative values are invalid. |
| source.binlog.offset-table  | --            | N        | Doris table in `database.table` format used to publish offsets covered by completed Checkpoints. Configure with `source.binlog.consumer-id` and `jdbc-url`. |
| source.binlog.consumer-id   | --            | N        | Stable consumer identifier written to `source.binlog.offset-table`.                                                                                   |
