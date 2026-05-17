---
{
    "title": "QUANTILE_PERCENT",
    "language": "zh-CN",
    "description": "QUANTILEPERCENT 函数用于计算给定百分比的分位数值。它接受两个参数：一个 quantilestate 列和一个表示百分比的常量浮点数。该函数返回一个浮点数，表示给定百分比位置的分位数值。"
}
---

## Description

`QUANTILE_PERCENT` 函数用于计算给定百分比的分位数值。它接受两个参数：一个 quantile_state 列和一个表示百分比的常量浮点数。该函数返回一个浮点数，表示给定百分比位置的分位数值。

## Syntax

```sql
QUANTILE_PERCENT(<quantile_state>, <percent>)
```

## Parameters

| 参数 | 描述 |
| -- | -- |
| `<quantile_state>` | 目标列。|
| `<percent>` | 目标百分比。|

## Return value

返回一个 `Double` 类型的分位数值。

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

结果为

```text
+----------+------+--------------------------------------------+
| dt       | id   | quantile_percent(quantile_union(price), 0) |
+----------+------+--------------------------------------------+
| 20220201 |    0 |                                          1 |
| 20220201 |    1 |                                         -1 |
+----------+------+--------------------------------------------+
```


