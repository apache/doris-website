---
{
    "title": "QUANTILE_UNION",
    "language": "zh-CN"
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
| `<query_state>` | 由 `TO_QUANTILE_STATE` 函数生成的中间状态 |

## 返回值

返回一个可以用于进一步分位数计算的聚合状态。此函数返回的结果仍是 `QUANTILE_STATE`。

## 举例

```sql
-- 创建示例表
CREATE TABLE response_times (
    request_id INT,
    response_time DOUBLE,
    region STRING
) DUPLICATE KEY(request_id)
DISTRIBUTED BY HASH(request_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
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

-- 按区域计算响应时间的 50% 分位数
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

```text
+--------+----------------------+
| region | median_response_time |
+--------+----------------------+
| west   |                35.25 |
| east   |                30.75 |
+--------+----------------------+
```
