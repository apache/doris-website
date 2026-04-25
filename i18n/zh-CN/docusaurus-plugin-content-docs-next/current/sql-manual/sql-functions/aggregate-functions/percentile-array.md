---
{
    "title": "PERCENTILE_ARRAY",
    "language": "zh-CN",
    "description": "PERCENTILEARRAY 函数用于计算精确的百分位数数组，允许一次性计算多个百分位数值。这个函数主要适用于小数据量。"
}
---

## 描述

`PERCENTILE_ARRAY` 函数用于计算精确的百分位数数组，允许一次性计算多个百分位数值。这个函数主要适用于小数据量。

主要特点：
1. 精确计算：提供精确的百分位数结果，而不是近似值
2. 批量处理：可以一次计算多个百分位数
3. 适用范围：最适合处理数据量较小的场景

## 语法

```sql
PERCENTILE_ARRAY(<col>, <array_p>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要被计算精确百分位数的列，支持类型：Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt。 |
| `<array_p>` | 百分位数数组，数组中的每个元素必须为常量，类型为 Array<Double>，取值范围为 `[0.0, 1.0]`，如 `[0.5, 0.95, 0.99]`。 |

## 返回值

返回一个 DOUBLE 类型的数组，包含了对应于输入百分位数数组的计算结果。
如果组内没有合法数据，则返回空数组。

## 举例

```sql
-- setup
CREATE TABLE sales_data (
    id INT,
    amount DECIMAL(10, 2)
) DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO sales_data VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);
```

```sql
SELECT percentile_array(amount, [0.25, 0.5, 0.75, 0.9]) as percentiles
FROM sales_data;
```

计算多个百分位数。

```text
+-----------------------------------------------------+
| percentiles                                         |
+-----------------------------------------------------+
| [21.525000000000002, 33, 44.475, 55.41999999999998] |
+-----------------------------------------------------+
```

```sql
SELECT percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) FROM sales_data;
```

只计算非 NULL 数据。

```text
+------------------------------------------------------------+
| percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) |
+------------------------------------------------------------+
| [100.6, 100.6]                                             |
+------------------------------------------------------------+
```

```sql
SELECT percentile_array(NULL, [0.5, 0.99]) FROM sales_data;
```

输入数据均为 NULL 时返回空数组。

```text
+-------------------------------------+
| percentile_array(NULL, [0.5, 0.99]) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
