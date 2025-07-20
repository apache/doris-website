---
{
    "title": "GEOMEAN",
    "language": "zh-CN"
}
---

## Description

GEOMEAN 函数计算指定列中一组值的几何平均值。几何平均值定义为 n 个值的乘积的 n 次方根，即 $(x_1 \cdot x_2 \cdot \ldots \cdot x_n)^{1/n}$，其中 n 是输入值的数量。我们的 GEOMEAN 函数支持包含零值的列（将零视为有效输入）和 NULL 值（自动忽略 NULL 值），但不支持负值。如果输入列包含负值，将返回 NaN。

## 语法

```sql
GEOMEAN(<col>)
```

## 参数

| 参数 | 描述 |
| -- | -- |
| `<col>` | 一个表达式（通常是列名），指定用于计算几何平均值的值。值必须为非负数（允许零和 NULL）。 |

## 返回值

- 如果输入列包含负值，返回 NaN。
- 如果输入列仅包含 NULL 值，返回 NULL。
- 如果输入列仅包含一些非负值，返回 DOUBLE 类型的值。

## 示例

**sql**

```sql
CREATE TABLE test_geomean_all (
    id INT,
    value DOUBLE
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_geomean_all VALUES
    (1, 2.0),
    (1, 8.0),
    (2, 2.0),
    (2, NULL),
    (2, 8.0),
    (3, NULL),
    (4, -1.0),
    (5, -2.0),
    (5, -8.0),
    (6, -1.0),
    (6, 0.0),
    (7, 0.0),
    (7, -1.0);

SELECT id, GEOMEAN(value) AS geometric_mean
FROM test_geomean_all
GROUP BY id
ORDER BY id;
```

**输出**

```text
+------+----------------+
| id   | geometric_mean |
+------+----------------+
|    1 |              4 |
|    2 |              4 |
|    3 |           NULL |
|    4 |            NaN |
|    5 |            NaN |
|    6 |            NaN |
|    7 |            NaN |
+------+----------------+
```

**解释:**
- 对于 id = 1：值为 [2.0, 8.0]，乘积为 (2.0 * 8.0 = 16.0)，因此几何平均值为 $(16)^{1/2} = 4.0$。
- 对于 id = 2：值为 [2.0, NULL, 8.0]，忽略 NULL 值，因此几何平均值与 id = 1 相同。
- 对于 id = 3：仅包含 NULL 值，因此结果为 NULL。
- 对于 id = 4, 5：存在负值，不允许计算几何平均值——无论负值的数量是奇数还是偶数（尽管 -2.0 * -8.0 = 16.0）。
- 对于 id = 6, 7：结果表明，当列中同时包含 0.0 和负值时——无论它们的顺序如何——计算都被禁止。
