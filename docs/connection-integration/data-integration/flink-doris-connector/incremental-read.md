---
{
    "title": "Incremental Reading with Doris Binlog",
    "language": "en",
    "description": "Continuously read the row-level changes of a Doris table with ROW-format Binlog enabled through Flink Doris Connector: startup modes, change types, delivery semantics, the offset table, and options."
}
---

# Incremental Reading with Doris Binlog

For a Doris table with ROW-format Binlog enabled, Flink Doris Connector can continuously read row-level changes. In `initial` mode, the Connector first reads the current table snapshot and then switches to incremental reading. Changes needed for this transition must remain within the source table's Binlog retention window.

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

When restoring from a Flink Checkpoint or Savepoint, the Connector resumes the saved consumption state. Changing `source.scan.mode` or `source.scan.timestamp` does not reset that state. Both a restored offset and a `from-timestamp` start are subject to the source table's `binlog.ttl_seconds`; see the expiration behavior below.

## Change Types {#increment-type}

By default, the Connector emits full row changes in `detail` mode. Set `source.binlog.increment-type` to `min_delta` for the minimal change set or `append_only` for append events only.

The Connector reads changes through Doris `@incr` queries. If the requested start has expired according to `binlog.ttl_seconds`, the behavior depends on the change type:

| Change type | Behavior when the start has expired |
| ---- | ---- |
| `detail` (default), `append_only` | Doris moves the effective start to the first retained TSO and skips expired changes. The job can continue without an expiration error, but those changes are missing from its output. |
| `min_delta` | The read fails with `Row binlog offset has expired according to binlog.ttl_seconds`, rather than returning incomplete net changes. |

These rules apply during normal consumption, after the initial snapshot, and when restoring from saved state. A running job or a successful Checkpoint does not prove that no changes have expired. `source.binlog.visible-wait-timeout` does not retry expiration errors.

## Notes

- Incremental reading uses Arrow Flight SQL. The Connector enables it by default and automatically discovers its port.
- Enable Flink Checkpoint.
- Doris `binlog.ttl_seconds` defaults to `86400` seconds (one day) and must be greater than `0`. Expiration does not wait for the Flink job or its Checkpoints. Increasing the TTL cannot restore physically cleaned-up records.
- Set the TTL to cover the initial snapshot duration, consumption backlog, and the time needed to recover from an outage and catch up, with additional margin. Monitor the age of the oldest changes still needed by the job, including when restoring an older Checkpoint or Savepoint.
- For automatic physical cleanup, also enable `enable_feature_binlog = true` on the BEs and keep automatic compaction enabled. Incremental queries filter expired records even before physical cleanup finishes. See [Row Binlog retention and cleanup](../../../data-operate/incremental/row-binlog.md#retention-and-cleanup).
- When performing a Binlog incremental read, Doris waits for in-flight transactions affecting the source table within the read window to complete. If the wait times out, the read returns an error. The Connector retries the same window only for this error, for up to `source.binlog.visible-wait-timeout` (default: `5m`). Set it to `0s` to disable Connector retries; other errors fail immediately.

### Recovery after Binlog expiration {#binlog-expiration-recovery}

If required changes have expired, the existing offset cannot provide complete incremental recovery. For a job that must keep downstream data consistent with the current source table, start a new bootstrap with `source.scan.mode = 'initial'`, without restoring the expired Checkpoint or Savepoint, and rebuild downstream data from the new snapshot. Restoring old state while setting `initial` still resumes the saved state instead of starting a new full snapshot.

A new snapshot rebuilds the current table state; it cannot reproduce expired historical events. Starting with `latest` or a newer `from-timestamp` also skips the missing interval. Use those modes only when skipping that interval is acceptable or the missing data has been recovered separately.

## Delivery Semantics and Deduplication {#delivery}

The Doris Binlog Source provides at-least-once delivery while all required change records are still retained in Doris. Change events can be replayed after a failure and may affect Flink query results. Flink's CDC event deduplication is disabled by default. To use it, set the following option before submitting the query:

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

When this option is enabled, the source table must declare a primary key, as in the example above. Flink uses an additional stateful operator to normalize the changelog. See the [Flink configuration reference](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) for details.

Checkpoints save consumption state, and CDC deduplication handles replayed events. Neither prevents Doris Binlog expiration nor recovers events that have already been lost to expiration.

## Publishing Consumption Progress to Doris (Optional) {#offset-table}

Consumption progress is stored in Flink Checkpoint state. The optional offset table is only for observing progress covered by completed Checkpoints. The Connector does not read this table to automatically resume consumption when a job starts or restarts.

To query consumption progress in Doris, create the following offset table:

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

`source.binlog.consumer-id` identifies the consumer job in the offset table. Keep it unchanged when the same job restarts to track its progress.

If you cannot restore from a Flink Checkpoint or Savepoint and all changes needed from the saved `offset_timestamp` are still retained, copy it into `source.scan.timestamp` and set `source.scan.mode` to `from-timestamp` to manually resume from that offset. If it has expired, follow [Recovery after Binlog expiration](#binlog-expiration-recovery); copying an expired timestamp does not restore the missing changes. For example, if the following timestamp is still within the retention window:

```sql
'source.scan.mode' = 'from-timestamp',
'source.scan.timestamp' = '2026-10-09 10:00:00'
```

## Options {#options}

The following options control incremental reading. The other Source options are listed in [Reading Data from Doris](./read.md#options).

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source startup mode. Supported values: `snapshot`, `initial`, `latest`, and `from-timestamp`.                                                           |
| source.scan.timestamp       | --            | N        | Inclusive start time in `yyyy-MM-dd HH:mm:ss` format. Required only for `from-timestamp`. An expired start follows the behavior in [Change Types](#increment-type); it cannot recover expired changes. |
| source.binlog.increment-type | detail       | N        | Binlog change type: `detail`, `min_delta`, or `append_only`. On an expired start, `detail` / `append_only` skip expired changes and `min_delta` fails. |
| source.binlog.poll-interval | 10s           | N        | Interval for polling new Binlog data. The minimum value is 1 second.                                                                                    |
| source.binlog.visible-wait-timeout | 5m            | N        | Maximum time for the Connector to retry the same read window after Doris returns a transaction visibility wait timeout error. Set to `0s` to disable retries; negative values are invalid. |
| source.binlog.offset-table  | --            | N        | Doris table in `database.table` format used to publish offsets covered by completed Checkpoints for observation only, not for automatic recovery. Configure with `source.binlog.consumer-id` and `jdbc-url`. |
| source.binlog.consumer-id   | --            | N        | Stable consumer identifier written to `source.binlog.offset-table`.                                                                                   |
