---
{
    "title": "Row-level TTL (Experimental)",
    "language": "en",
    "description": "Configure experimental row-level TTL in Apache Doris. Learn retention and expiration modes, updates, query restrictions, and physical reclamation limits.",
    "keywords": ["row-level TTL", "data expiration", "retention", "experimental", "Compaction"],
    "doc_type": "feature"
}
---

## Overview

Row-level TTL (Time to Live) makes individual rows invisible after their expiration time and allows background Compaction to reclaim them. Use it when rows in the same table or partition need different expiration times. It supports native Duplicate Key and Unique Key tables, including Merge-on-Write (MOW) and Merge-on-Read (MOR), but not Aggregate Key tables.

:::caution Experimental feature

Row-level TTL is experimental. This page describes the current development version; it does not indicate availability in released versions. Validate it in a test environment before adopting it. Enable TTL when creating the table: it cannot subsequently be enabled on an existing ordinary table, disabled, or switched to another TTL mode. Partial column updates, Sequence Columns, and materialized views have restrictions described below. Expiration does not guarantee immediate disk-space reclamation.

:::

Two mutually exclusive modes are available:

| Mode | Configuration | Expiration time |
| --- | --- | --- |
| Source column | Enable TTL and set `function_column.ttl_col` and `function_column.ttl` together | Source timestamp + table retention duration |
| Direct expiration | Enable TTL without setting either of those properties | Per-row absolute expiration written to `__DORIS_TTL_COL__` |

A NULL source value or NULL direct expiration means the row does not expire through TTL. A row is expired when its expiration time is **less than or equal to** the current time used by the query. The query uses one current-time value, rather than advancing the expiration threshold for every row it scans. A later query can therefore return fewer rows without any intervening writes.

## Quick Start

Connect to a database using an account with permission to create, insert into, and query tables. Run the following in a test database. The single-replica setting is for this example, not a production replication recommendation.

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_events;
CREATE TABLE row_ttl_events (
    id INT,
    event_time DATETIME(6) NULL,
    message STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true",
    "function_column.ttl_col" = "event_time",
    "function_column.ttl" = "1 day",
    "function_column.ttl_time_zone" = "+00:00"
);

INSERT INTO row_ttl_events VALUES
    (1, NOW(6) - INTERVAL 2 DAY, 'expired'),
    (2, NULL, 'persistent'),
    (3, NOW(6), 'live');

SELECT id, message FROM row_ttl_events ORDER BY id;
```

Querying immediately after insertion returns:

```text
id  message
2   persistent
3   live
```

The old event is already invisible without waiting for Compaction. The NULL event time does not expire. TTL is based on the supplied event time, not automatically on the load time; a late-arriving event can be expired as soon as it is loaded.

## Parameters

All `function_column.*` properties below are string-valued table properties.

| Property | Default / required condition | Meaning and modification rules |
| --- | --- | --- |
| `function_column.enable_row_ttl` | `false`; set to `true` to enable either mode | Boolean string. Can only be set when creating the table. |
| `function_column.ttl_col` | Unset; required together with `function_column.ttl` in source-column mode | Name of an existing non-generated Value column of type DATE/DATEV2, DATETIME/DATETIMEV2, or TIMESTAMPTZ. Key columns and TIMESTAMP_NS are not supported. Cannot be changed after creation. |
| `function_column.ttl` | Unset; required together with `function_column.ttl_col` | Nonnegative integer duration. After creation, only the same or a shorter duration is allowed. `0` means expiration at the source timestamp, **not disabling TTL**. Unavailable in direct-expiration mode. |
| `function_column.ttl_time_zone` | Required for DATE/DATETIME-family source columns; defaults to `+00:00` for TIMESTAMPTZ | Time zone for interpreting source timestamps. Accepts `UTC`, `Z`, or a fixed offset from `-12:00` to `+14:00` in `+HH:MM` / `-HH:MM` form. TIMESTAMPTZ permits only zero offset. Cannot be changed after creation or set in direct-expiration mode. |

Durations without a unit are seconds. Supported units are `week`/`weeks`, `day`/`days`/`d`, `hour`/`hours`/`h`, `minute`/`minutes`/`m`, and `second`/`seconds`/`s`, case-insensitively. For example, `86400`, `1 day`, and `24h` represent the same duration. Fractions, negative values, compound durations such as `1 day 2 hours`, months, years, and values that overflow a signed 64-bit microsecond duration are rejected. A day is a fixed 24 hours. The source timestamp plus the duration must also fit in signed 64-bit epoch microseconds; an overflow causes expiration calculation to fail.

In source-column mode, regional time zones such as `Asia/Shanghai` and daylight-saving rules are not supported. DATE values are interpreted at midnight in the configured offset. TIMESTAMPTZ values represent absolute instants. Changing the query session's time zone does not change an already stored row's TTL policy.

### Hidden TTL column

Doris creates the nullable hidden column `__DORIS_TTL_COL__` automatically. Do not declare it in the table schema.

- **Source-column mode:** Doris copies the source value into this hidden column. Write or update the source column; do not supply an independent expiration through the hidden column.
- **Direct-expiration mode:** The hidden column is BIGINT, storing **microseconds since the Unix epoch**, not seconds or milliseconds. NULL, DEFAULT, or omission during a full insert gives a NULL expiration. BIGINT inputs are used directly; `0` and negative values are already expired at present-day query times. DATE/DATETIME and TIMESTAMPTZ expressions are converted to epoch microseconds. DATE/DATETIME conversion uses the SQL session's `time_zone` or the load job's `timezone`; TIMESTAMPTZ is already an absolute instant. Cast textual dates explicitly to a supported temporal type. TIMESTAMP_NS is not supported.

For inspection, enable `show_hidden_columns` and explicitly select the hidden column. This does **not** bypass TTL filtering or make expired rows visible.

## Examples

### Assign an expiration to each row

```sql
SET time_zone = '+00:00';
DROP TABLE IF EXISTS row_ttl_expirations;
CREATE TABLE row_ttl_expirations (id INT, message STRING)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "function_column.enable_row_ttl" = "true"
);

INSERT INTO row_ttl_expirations(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'expired', 0),
    (2, 'persistent', NULL),
    (3, 'live', NOW(6) + INTERVAL 1 DAY);
INSERT INTO row_ttl_expirations VALUES (4, 'omitted');

SELECT id, message FROM row_ttl_expirations ORDER BY id;
```

Querying immediately returns:

```text
id  message
2   persistent
3   live
4   omitted
```

`INSERT ... SELECT` also accepts temporal expressions for the hidden column and converts them using the same rules.

### Load expiration timestamps with Stream Load

Use the `row_ttl_expirations` table above. Replace the connection placeholders and use an account with load permission. The input contains an expiration timestamp, so explicitly cast it in the column mapping and specify the load time zone:

```bash
curl --location-trusted -u '<user>:<password>' \
  -H 'label:row_ttl_expirations_example_1' \
  -H 'column_separator:,' \
  -H 'timezone:+00:00' \
  -H 'columns:id,message,expiration,__DORIS_TTL_COL__=cast(expiration as datetime(6))' \
  -T - 'http://<fe_host>:<http_port>/api/<database>/row_ttl_expirations/_stream_load' <<'DATA'
10,stream-live,2099-01-01 00:00:00.000000
11,stream-expired,2000-01-01 00:00:00.000000
DATA
```

Use a new label if repeating the load. A successful response has `Status` equal to `Success`; expiration itself does not make an otherwise valid input row a load error. Before 2099, the following query returns only row 10:

```sql
SELECT id, message FROM row_ttl_expirations WHERE id >= 10 ORDER BY id;
```

```text
id  message
10  stream-live
```

If the input already contains epoch **microseconds**, map it directly with `columns:id,message,__DORIS_TTL_COL__` instead of casting it to DATETIME.

### Update a Unique Key row

Ordinary SQL UPDATE is supported. For visible rows, changing unrelated columns preserves the TTL value; changing the source timestamp or direct expiration changes when the row expires. This differs from the unsupported partial column update load modes.

```sql
DROP TABLE IF EXISTS row_ttl_accounts;
CREATE TABLE row_ttl_accounts (id INT, message STRING)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "function_column.enable_row_ttl" = "true"
);
INSERT INTO row_ttl_accounts(id, message, __DORIS_TTL_COL__) VALUES
    (1, 'original', 9223372036854775807);
UPDATE row_ttl_accounts SET message = 'updated' WHERE id = 1;

SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message  __DORIS_TTL_COL__
1   updated  9223372036854775807
```

A full-row UPSERT replaces the row. In direct mode, omitting the expiration therefore clears the old expiration:

```sql
INSERT INTO row_ttl_accounts(id, message) VALUES (1, 'replaced');
SET show_hidden_columns = true;
SELECT id, message, __DORIS_TTL_COL__ FROM row_ttl_accounts ORDER BY id;
SET show_hidden_columns = false;
```

```text
id  message   __DORIS_TTL_COL__
1   replaced  NULL
```

In source-column mode, a full insert that omits the source uses that column's normal default/NULL rules, not the previous row's timestamp. An UPDATE cannot find an already expired row through an ordinary query; use a full insert with the desired values to write a new version. On Unique Key tables, expiration of the newest version does not reveal an older version of the same key.

### Shorten retention

Using the source-column table from Quick Start and an account with ALTER permission:

```sql
ALTER TABLE row_ttl_events SET ("function_column.ttl" = "12 hours");
SHOW CREATE TABLE row_ttl_events;
```

The new retention applies to existing source values as well as future writes. `SHOW CREATE TABLE` shows the updated `function_column.ttl` property. Durations shown as unitless integers are in seconds. Rows newly outside the retention period become invisible to queries using the new policy and eligible for reclamation. Setting the same duration again is allowed; increasing it is rejected because previously expired data may already have been reclaimed.

:::caution Failed ALTER does not imply rollback

The shorter query policy is persisted before reclamation settings are distributed. An ALTER can report a timeout, a missing configuration-version acknowledgment, or a concurrent table change after the shorter retention has taken effect. Check `SHOW CREATE TABLE`, resolve the reported issue, and retry with the same duration to synchronize the policy. Do not attempt to restore the old, longer duration.

:::

## Limitations

| Area | Current behavior / restriction |
| --- | --- |
| Table model | Native Duplicate Key and Unique Key (MOW/MOR) tables only; Aggregate Key is rejected. |
| Enabling and changing mode | Enable only at CREATE TABLE time. ALTER cannot enable/disable TTL, change its source or time zone, or switch modes. `ENABLE FEATURE "ROW_TTL"` is not supported. Only source-column retention can be shortened. |
| Sequence Column | Cannot coexist with row TTL, including enabling `SEQUENCE_LOAD` afterward. |
| Schema changes | Cannot drop or modify the TTL source or hidden column, or rename the source column. Unrelated column changes remain subject to normal schema-change rules. |
| Partial column updates | Not supported for either TTL mode. This includes INSERT with `enable_unique_key_partial_update = true`, Stream Load `partial_columns = true`, `UPDATE_FIXED_COLUMNS`, and `UPDATE_FLEXIBLE_COLUMNS`, even when the request supplies a TTL value. Full UPSERT, ordinary SQL UPDATE, and DELETE remain available under their normal table-model rules. |
| Materialized views | `CREATE MATERIALIZED VIEW` for synchronous materialized views is rejected on TTL tables; asynchronous materialized views cannot use TTL base tables. This is distinct from ordinary `ALTER TABLE ... ADD ROLLUP`, which is supported with the TTL hidden column maintained by Doris. |
| Historical and incremental access | `FOR VERSION AS OF`, `FOR TIME AS OF`, `@incr(...)`, and `CREATE STREAM ... ON TABLE` are not supported on TTL tables. |
| Query hints | `PREAGGOPEN` is rejected. MOR scans disable storage preaggregation to preserve version-merge and expiration semantics. |
| Query performance | SQL Cache, Query Cache, short-circuit point queries, and certain TopN pushdowns are disabled for TTL scans. Point lookups, aggregates, joins, and ORDER BY/LIMIT still work, but do not assume the same execution plan or performance as a non-TTL table. |
| Consistency checks | Automatic checksum consistency checks skip TTL tables; explicit checksum consistency checks for TTL tablets are rejected. This does not disable ordinary replication. |

### Physical reclamation boundaries

TTL visibility is checked during queries; disk reclamation depends on eligible background Compaction and subsequent obsolete-file cleanup. An idle table, delayed Compaction, or retained old files can leave expired data on disk. There is no fixed deletion deadline.

- Duplicate Key tables can reclaim expired rows in supported segment, cumulative, base, and full Compaction paths.
- Unique Key MOW tables can reclaim expired rows from published rowsets in cumulative, base, and full Compaction. Pre-publication segment Compaction keeps expired keys for write-conflict resolution.
- Unique Key MOR tables reclaim expired rows only in full Compaction or base Compaction covering versions from 0, so removal does not reveal older versions of the same key.
- Cold-data Compaction does not perform row-TTL reclamation.
- Changelog tablets do not apply row TTL to remove log entries. If Changelog is enabled, raw Changelog can retain writes whose base-table rows have expired; its retention is separate. Row TTL is not a guarantee that every copy or change record is erased at expiration.

### Error handling

| Error / symptom | Action |
| --- | --- |
| `function_column.ttl_col and function_column.ttl must be set together` | Supply both for source-column mode, or omit both for direct-expiration mode. |
| `function_column.ttl_time_zone is required` | Set an explicit fixed offset for a DATE/DATETIME source column. |
| `row ttl column must be a value column` | Choose a supported temporal Value column, not a Key column. |
| `Partial update is not supported on tables with row TTL` | Use full UPSERT with intentional defaults for omitted columns, or ordinary SQL UPDATE; do not simply remove the partial-update setting without checking omitted values. |
| `Increasing function_column.ttl is not supported` | Retain or shorten the duration. Plan a new table and reload from a retained source if longer retention is required; TTL cannot restore reclaimed data. |
| `TTL properties can only be specified when creating a table` | Do not ALTER the enable flag, source, or time zone. Only `function_column.ttl` can be changed on a source-column TTL table. |
| Rows disappear but storage size does not decrease | Check Compaction progress and the reclamation boundaries above. Expiration and physical deletion are separate. |

## Best Practices

- Choose source-column mode for a uniform duration after each event, and direct-expiration mode when the application assigns an absolute deadline per row. Check late-arriving timestamps and NULL values before loading.
- Prefer [dynamic partitioning](../../table-design/data-partitioning/dynamic-partitioning.md) when retention naturally follows whole time partitions. Row TTL is useful for finer granularity, but adds per-row filtering and constrains query optimizations.
- Test actual ingestion, update, query, and Compaction workloads before adoption. In particular, check dependencies on partial updates, Sequence Columns, materialized views, historical queries, and caching.
- Before shortening retention, confirm the intended cutoff and retain any data that must remain recoverable outside this TTL policy. Validate visibility with normal queries; do not treat disk usage or hidden-column inspection as proof of expiration or complete erasure.
