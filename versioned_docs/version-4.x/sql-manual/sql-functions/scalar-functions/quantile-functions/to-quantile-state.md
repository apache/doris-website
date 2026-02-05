---
{
    "title": "TO_QUANTILE_STATE",
    "language": "en",
    "description": "This function converts numeric types to QUANTILESTATE type. The compression parameter is optional and can be set in the range [2048, 10000]."
}
---

## Description

This function converts numeric types to `QUANTILE_STATE` type. The compression parameter is optional and can be set in the range [2048, 10000]. The larger the value, the higher the accuracy of subsequent quantile approximation calculations, the greater the memory consumption, and the longer the calculation time. If the compression parameter is not specified or the value is set outside the range [2048, 10000], it runs with the default value of 2048.

## Syntax

```sql
TO_QUANTILE_STATE(<raw_data> <compression>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<raw_data>` | The target column.|
| `<compression>` | Compression threshold.|

## Return value

The converted column of `QUANTILE_STATE` type.

## Example

```sql
CREATE TABLE IF NOT EXISTS quantile_state_agg_test (
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
```

Result is

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```
