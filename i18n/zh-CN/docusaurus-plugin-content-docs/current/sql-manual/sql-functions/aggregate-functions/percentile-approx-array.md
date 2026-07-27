---
{
    "title": "PERCENTILE_APPROX_ARRAY",
    "language": "zh-CN",
    "description": "PERCENTILE_APPROX_ARRAY 使用共享的 T-Digest 状态在一次聚合中计算多个近似百分位数。"
}
---

## 描述

`PERCENTILE_APPROX_ARRAY` 在一次聚合中计算多个近似百分位数。函数为输入值构建一个 T-Digest，并基于这个共享状态计算所有指定的百分位数，因此比针对每个百分位数分别调用 `PERCENTILE_APPROX` 更高效。

:::note
自 4.2.0 版本开始支持该函数。
:::

## 语法

```sql
PERCENTILE_APPROX_ARRAY(<col>, <quantiles> [, <compression>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要计算百分位数的数值表达式，输入值会转换为 `DOUBLE`。函数忽略 `NULL` 值。 |
| `<quantiles>` | 常量 `ARRAY<DOUBLE>`。每个元素都必须是有限值、非 NULL 且位于 `[0.0, 1.0]` 范围内。结果顺序与数组一致，并保留重复的百分位点。允许传入空数组。 |
| `<compression>` | 可选的常量 `DOUBLE`，取值范围为 `[2048, 10000]`。值越大通常精度越高，但内存占用也越大。默认值为 `10000`；非有限值或超出有效范围时也使用 `10000`。 |

## 返回值

返回 `ARRAY<DOUBLE>`，其中每个元素对应 `<quantiles>` 中相同位置的近似百分位数。当 `<quantiles>` 为空，或组内没有非 NULL 输入值时，返回空数组。百分位点超出范围或 `<quantiles>` 包含 NULL 元素时返回错误。

## 举例

```sql
CREATE TABLE percentile_approx_array_example (
    id INT,
    value DOUBLE NULL
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO percentile_approx_array_example VALUES
    (1, 1.0), (2, 2.0), (3, 3.0), (4, NULL),
    (5, 10.0), (6, 20.0), (7, 30.0), (8, 100.0);
```

使用默认 compression 计算多个近似百分位数：

```sql
SELECT percentile_approx_array(value, [0.0, 0.25, 0.5, 0.75, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+--------------------------+
| percentiles              |
+--------------------------+
| [1, 2.25, 10, 27.5, 100] |
+--------------------------+
```

显式指定 compression：

```sql
SELECT percentile_approx_array(value, [0.25, 0.5, 0.75], 2048) AS percentiles
FROM percentile_approx_array_example;
```

```text
+------------------+
| percentiles      |
+------------------+
| [2.25, 10, 27.5] |
+------------------+
```

输入值全部为 NULL 时返回空数组：

```sql
SELECT percentile_approx_array(CAST(NULL AS DOUBLE), [0.0, 0.5, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```

百分位数组为空时也返回空数组：

```sql
SELECT percentile_approx_array(value, []) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```
