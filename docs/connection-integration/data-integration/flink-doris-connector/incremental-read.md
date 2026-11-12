---
{
    "title": "Incremental Reading with Doris Changelog",
    "language": "en",
    "description": "Continuously read the row-level changes of a Doris table with changelog enabled through Flink Doris Connector: startup modes, change types, delivery semantics, the offset table, and options."
}
---

# Incremental Reading with Doris Changelog

For a Doris table with changelog enabled (`"changelog.enable" = "true"`), Flink Doris Connector can continuously read row-level changes. For a new consumer, `initial` mode first reads the current table snapshot and then switches to incremental reading. Changes needed for this transition must remain within the source table's changelog retention window.

:::info Version requirements
This feature requires Flink Doris Connector 26.4.0 or later and Doris 5.0.0 or later. Doris changelog is an experimental feature of Doris 5.0.0 and must be enabled with `enable_feature_changelog = true` in the FE configuration. For how to enable it on a table, the supported table models, and its limitations, see [Changelog](../../../data-operate/incremental/changelog.md).
:::

## Example {#example}

First, enable changelog when you create the Doris source table. `changelog.need_historical_value` is required when the consumer needs the before-image of updated rows:

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_changelog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);

INSERT INTO test.student_changelog_source VALUES (1, 'Alice', 18);
```

Then enable Flink Checkpoint and create the Doris source table:

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_changelog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_changelog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_changelog;
```

## Startup Modes {#scan-mode}

After the job starts, changes to `test.student_changelog_source` are continuously emitted as Flink changelog records. Select the startup mode for a new consumer with `source.scan.mode`:

| Mode | Behavior |
| ---- | -------- |
| `snapshot` | Reads the current snapshot and stops. This is the default mode. |
| `initial` | Reads the current snapshot and switches to continuously reading the Doris changelog when the snapshot is complete. |
| `latest` | Skips the snapshot and reads changes generated after the job starts. |
| `from-timestamp` | Skips the snapshot and reads changes starting at the inclusive time specified by `source.scan.timestamp` in `yyyy-MM-dd HH:mm:ss` format. |

When resuming a job, saved consumption progress takes precedence over the startup mode. See [Publishing Consumption Progress to Doris](#offset-table) for the recovery rules. Both a restored offset and a `from-timestamp` start are subject to the source table's `changelog.ttl_seconds`; see the expiration behavior below.

## Change Types {#increment-type}

By default, the Connector emits full row changes in `detail` mode. Set `source.changelog.increment-type` to `min_delta` for the minimal change set or `append_only` for append events only.

The Connector reads changes through Doris `@incr` queries. If the requested start has expired according to `changelog.ttl_seconds`, the behavior depends on the change type:

| Change type | Behavior when the start has expired |
| ---- | ---- |
| `detail` (default), `append_only` | Doris moves the effective start to the first retained TSO and skips expired changes. The job can continue without an expiration error, but those changes are missing from its output. |
| `min_delta` | The read fails with `Changelog offset has expired according to changelog.ttl_seconds`, rather than returning incomplete net changes. |

These rules apply during normal consumption, after the initial snapshot, and when restoring from saved state. A running job or a successful Checkpoint does not prove that no changes have expired. `source.changelog.visible-wait-timeout` does not retry expiration errors.

## Notes

- Incremental reading uses Arrow Flight SQL. The Connector enables it by default and automatically discovers its port.
- Enable Flink Checkpoint.
- Doris `changelog.ttl_seconds` defaults to `86400` seconds (one day) and must be greater than `0`. Expiration does not wait for the Flink job or its Checkpoints. Increasing the TTL cannot restore physically cleaned-up records.
- Set the TTL to cover the initial snapshot duration, consumption backlog, and the time needed to recover from an outage and catch up, with additional margin. Monitor the age of the oldest changes still needed by the job, including when restoring an older Checkpoint or Savepoint.
- For automatic physical cleanup, also enable `enable_feature_changelog = true` on the BEs and keep automatic compaction enabled. Incremental queries filter expired records even before physical cleanup finishes. See [Changelog retention and cleanup](../../../data-operate/incremental/changelog.md#retention-and-cleanup).
- When performing an incremental read, Doris waits for in-flight transactions affecting the source table within the read window to complete. If the wait times out, the read returns an error. The Connector retries the same window only for this error, for up to `source.changelog.visible-wait-timeout` (default: `5m`). Set it to `0s` to disable Connector retries; other errors fail immediately.

### Recovery after changelog expiration {#changelog-expiration-recovery}

If required changes have expired, the existing offset cannot provide complete incremental recovery. For a job that must keep downstream data consistent with the current source table, start a new bootstrap with `source.scan.mode = 'initial'`, without restoring the expired Checkpoint or Savepoint, and rebuild downstream data from the new snapshot. If an offset table is configured, also use a new `source.changelog.consumer-id` with no saved record, or remove both `source.changelog.offset-table` and `source.changelog.consumer-id`. Otherwise, the old Flink state or external offset still takes precedence over `initial` and prevents a new full snapshot.

A new snapshot rebuilds the current table state; it cannot reproduce expired historical events. Starting with `latest` or a newer `from-timestamp` also skips the missing interval. Use those modes only when skipping that interval is acceptable or the missing data has been recovered separately.

## Delivery Semantics and Deduplication {#delivery}

The Doris source provides at-least-once delivery for incremental reading while all required change records are still retained in Doris. Change events can be replayed after a failure and may affect Flink query results. Flink's CDC event deduplication is disabled by default. To use it, set the following option before submitting the query:

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

When this option is enabled, the source table must declare a primary key, as in the example above. Flink uses an additional stateful operator to normalize the Flink changelog. See the [Flink configuration reference](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate) for details.

Checkpoints save consumption state, and CDC deduplication handles replayed events. Neither prevents Doris changelog expiration nor recovers events that have already been lost to expiration.

## Publishing Consumption Progress to Doris (Optional) {#offset-table}

The optional offset table saves consumption progress in Doris for observation and for automatically resuming a job that is not restored from a Checkpoint or Savepoint.

Create the following offset table before submitting the job. The Doris account configured with `username` and `password` needs `SELECT` and `INSERT` permissions on this table:

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

Keep Flink Checkpoint enabled and add these options to the Source table's `WITH` clause in the example above:

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.changelog.offset-table' = 'ops.flink_source_offsets',
'source.changelog.consumer-id' = 'student-sync'
```

Keep the same offset table and `source.changelog.consumer-id` when restarting a job. Use different IDs for different jobs or source tables to avoid overwriting consumption progress.

`offset_timestamp` is the next inclusive starting point for incremental reading. After a Checkpoint succeeds, the Connector asynchronously saves the consumption progress covered by that Checkpoint and retries failed writes. Saved progress can lag behind, so resuming may replay some data.

After progress has been published, query it in Doris:

```sql
SELECT consumer_id, offset_timestamp
FROM ops.flink_source_offsets
WHERE consumer_id = 'student-sync';
```

Example result:

```text
+--------------+---------------------+
| consumer_id  | offset_timestamp    |
+--------------+---------------------+
| student-sync | 2026-10-09 10:00:00 |
+--------------+---------------------+
```

The starting point is determined by the first matching rule in this order:

| Condition | Behavior |
| ---- | ---- |
| The job is restored from a Checkpoint or Savepoint | Uses the saved consumption state. |
| The offset table has a record for the current `consumer-id` | Resumes from `offset_timestamp`, overriding the startup mode's starting point. `initial` also skips the snapshot. |
| No offset table is configured, or no record exists for the consumer | Starts according to `source.scan.mode`. |

If the configured offset table is missing or unreadable, or the consumer has duplicate records or an invalid timestamp, startup fails instead of falling back to the startup mode.

The offset table saves only the consumption starting point, not downstream Flink operator or sink state. Restore a Checkpoint or Savepoint to recover that state. For expired offsets, see [Recovery after changelog expiration](#changelog-expiration-recovery).

## Options {#options}

The following options control incremental reading. The other Source options are listed in [Reading Data from Doris](./read.md#options).

| Key                         | Default Value | Required | Comment                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source startup mode. Supported values: `snapshot`, `initial`, `latest`, and `from-timestamp`.                                                           |
| source.scan.timestamp       | --            | N        | Required for `from-timestamp`. Inclusive start time in `yyyy-MM-dd HH:mm:ss` format. Saved consumption progress takes precedence; see [Recovery rules](#offset-table). |
| source.changelog.increment-type | detail    | N        | Change type: `detail`, `min_delta`, or `append_only`. On an expired start, `detail` / `append_only` skip expired changes and `min_delta` fails. |
| source.changelog.poll-interval | 10s        | N        | Interval for polling new changes. The minimum value is 1 second.                                                                                        |
| source.changelog.visible-wait-timeout | 5m         | N        | Maximum time for the Connector to retry the same read window after Doris returns a transaction visibility wait timeout error. Set to `0s` to disable retries; negative values are invalid. |
| source.changelog.offset-table  | --         | N        | Doris table used to save consumption progress and resume reading. Create it in advance in `database.table` format. Configure with `source.changelog.consumer-id` and `jdbc-url`; supported only in incremental modes. |
| source.changelog.consumer-id   | --         | N        | Unique consumer job identifier in the offset table. Keep it unchanged when restarting the same job. |
