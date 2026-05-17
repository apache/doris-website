---
{
    "title": "TO_QUANTILE_STATE",
    "language": "zh-CN",
    "description": "此函数将数值类型转化成 QUANTILESTATE 类型。 compression 参数是可选项，可设置范围是[2048, 10000]，值越大，后续分位数近似计算的精度越高，内存消耗越大，计算耗时越长。 compression 参数未指定或设置的值在[2048, 10000]范围外，"
}
---

## Description

此函数将数值类型转化成 `QUANTILE_STATE` 类型。 compression 参数是可选项，可设置范围是[2048, 10000]，值越大，后续分位数近似计算的精度越高，内存消耗越大，计算耗时越长。 compression 参数未指定或设置的值在[2048, 10000]范围外，以 2048 的默认值运行

## Syntax

```sql
TO_QUANTILE_STATE(<raw_data> <compression>)
```

## Parameters

| 参数 | 描述 |
| -- | -- |
| `<raw_data>` | 目标列。|
| `<compression>` | 压缩阈值。|

## Return value

转换之后的 `QUANTILE_STATE` 类型的列。

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
