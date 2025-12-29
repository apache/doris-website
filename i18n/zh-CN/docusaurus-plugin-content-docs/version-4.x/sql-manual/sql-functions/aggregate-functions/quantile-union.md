---
{
    "title": "QUANTILE_UNION",
    "language": "zh-CN",
    "description": "QUANTILEUNION 函数用于合并多个分位数计算的中间结果。这个函数通常与 QUANTILESTATE 配合使用，特别适用于需要分阶段计算分位数的场景。"
}
---

## 描述

`QUANTILE_UNION` 函数用于合并多个分位数计算的中间结果。这个函数通常与 `QUANTILE_STATE` 配合使用，特别适用于需要分阶段计算分位数的场景。

## 语法

```sql
QUANTILE_UNION(<query_state>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<query_state>` | 需要聚合的数据，支持类型为 QuantileState。 |

## 返回值

返回一个可以用于进一步分位数计算的聚合状态，类型为 QuantileState 。
组内没有合法数据时返回 NULL。

## 举例

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5, 'east'),
(2, 15.2, 'east'),
(3, 20.1, 'west'),
(4, 25.8, 'east'),
(5, 30.3, 'west'),
(6, 35.7, 'east'),
(7, 40.2, 'west'),
(8, 45.9, 'east'),
(9, 50.4, 'west'),
(10, 100.6, 'east');
```

```sql
SELECT 
    region,
    QUANTILE_PERCENT(
        QUANTILE_UNION(
            TO_QUANTILE_STATE(response_time, 2048)
        ),
        0.5
    ) AS median_response_time
FROM response_times
GROUP BY region;
```

按区域计算响应时间的 50% 分位数。

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```

```sql
SELECT QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048))
FROM response_times where response_time is null;
```

组内没有合法数据时返回 NULL。

```text
+--------------------------------------------------------+
| QUANTILE_UNION(TO_QUANTILE_STATE(response_time, 2048)) |
+--------------------------------------------------------+
| NULL                                                   |
+--------------------------------------------------------+
```
