---
{
    "title": "table_streams",
    "language": "en",
    "description": "Records the definition and state of every Table Stream in the cluster."
}
---

## Overview

Records the definition and state of every Table Stream in the cluster. Each row corresponds to one Stream. See [Table Stream Basics](../../../data-operate/incremental/table-stream) for usage.

## Database

`information_schema`

## Table Information

| Column | Type | Description |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | The database of the Stream |
| STREAM_NAME | varchar(64) | Stream name |
| STREAM_ID | bigint | Stream ID |
| STREAM_TYPE | varchar(64) | Stream type; Streams on internal tables are `OLAP_TABLE_STREAM` |
| CONSUME_TYPE | varchar(64) | Consumption type: `APPEND_ONLY`, `MIN_DELTA`, `DETAIL` |
| STREAM_COMMENT | string | The comment of the Stream |
| BASE_TABLE_NAME | varchar(64) | Base table name |
| BASE_TABLE_DB | varchar(64) | The database of the base table |
| BASE_TABLE_CTL | varchar(64) | The catalog of the base table |
| BASE_TABLE_TYPE | varchar(64) | Base table type |
| ENABLED | boolean | Whether the Stream is usable |
| IS_STALE | boolean | Whether the Stream has become stale (for example, its change records were cleaned up and it can no longer read from its consumption offset) |
| STALE_REASON | string | The reason for being stale; `N/A` when not stale |

## Examples

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```
