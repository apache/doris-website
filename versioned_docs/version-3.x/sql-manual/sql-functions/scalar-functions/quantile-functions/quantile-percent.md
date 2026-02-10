---
{
    "title": "QUANTILE_PERCENT",
    "language": "en",
    "description": "The QUANTILEPERCENT function is used to calculate the quantile value for a given percentage."
}
---

## Description

The `QUANTILE_PERCENT` function is used to calculate the quantile value for a given percentage. It takes two parameters: a quantile_state column and a constant floating-point number representing the percentage. The function returns a floating-point number that represents the quantile value at the given percentage position.

## Syntax

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<quantile_state>` | The target column.|
| `<percent>` | Target percent.|

## Return value

A `Double` type to represent quantile.

## Example

```sql
CREATE TABLE IF NOT EXISTS ${tableName_21} (
         `dt` int(11) NULL COMMENT "",
         `id` int(11) NULL COMMENT "",
         `price` quantile_state QUANTILE_UNION NOT NULL COMMENT ""
        ) ENGINE=OLAP
        AGGREGATE KEY(`dt`, `id`)
        COMMENT "OLAP"
        DISTRIBUTED BY HASH(`dt`) BUCKETS 1
        PROPERTIES ("replication_num" = "1");

INSERT INTO quantile_state_agg_test VALUES(20220201,0, to_quantile_state(1, 2048));

INSERT INTO quantile_state_agg_test VALUES(20220201,1, to_quantile_state(-1, 2048)),
            (20220201,1, to_quantile_state(0, 2048)),(20220201,1, to_quantile_state(1, 2048)),
            (20220201,1, to_quantile_state(2, 2048)),(20220201,1, to_quantile_state(3, 2048));

SELECT dt, id, quantile_percent(quantile_union(price), 0) FROM quantile_state_agg_test GROUP BY dt, id ORDER BY dt, id
--------------

+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
