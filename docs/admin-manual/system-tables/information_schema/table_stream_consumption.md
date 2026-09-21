---
{
    "title": "table_stream_consumption",
    "language": "en",
    "description": "Records the consumption offset, backlog, and last consumption time of every Table Stream on each partition of its base table."
}
---

## Overview

Records the consumption offset, backlog, and last consumption time of every Table Stream on each partition of its base table. Each row corresponds to one consumption unit (a base table partition) of one Stream. See [Table Stream Advanced](../../../data-operate/incremental/table-stream-advanced#partition-level-consumption-offsets) for usage.

## Database

`information_schema`

## Table Information

| Column | Type | Description |
| :--- | :--- | :--- |
| DB_NAME | varchar(64) | The database of the Stream |
| STREAM_NAME | varchar(64) | Stream name |
| STREAM_ID | bigint | Stream ID |
| UNIT | varchar(64) | The consumption unit, i.e. the partition name of the base table. A table without explicit partitions has a single partition named after the table |
| CONSUMPTION_STATUS | varchar(64) | The commit timestamp (TSO) the partition has been consumed up to; `N/A` means the partition has never been consumed |
| LAG | varchar(64) | The difference between the latest committed TSO of the partition and the consumed TSO; `0` means no backlog, `N/A` means the partition has data but has never been consumed. The low 18 bits of a TSO are a logical counter, so `LAG` divided by 262144 is roughly the backlog in milliseconds |
| LAST_CONSUMPTION_TIME | bigint | The time of the most recent consumption of the partition (millisecond timestamp); `-1` means never consumed |

## Examples

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```
