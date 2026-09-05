---
{
    "title": "INNER_PRODUCT",
    "language": "zh-CN",
    "description": "计算两个稠密向量或稀疏向量的标量积"
}
---

## 描述

计算两个由数组表示的稠密向量，或两个由 Map 表示的稀疏向量的标量积。对于稀疏向量，每个 Map 的 key 表示一个维度，value 表示该维度的坐标值。只有同时出现在两个 Map 中的维度才参与计算。

## 语法

```sql
INNER_PRODUCT(<array1>, <array2>)
INNER_PRODUCT(<map1>, <map2>)
```

## 参数

| 参数 | 描述 |
|---|---|
| `<array1>` | 第一个稠密向量。数组元素支持 TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT 和 DOUBLE 类型，元素数量必须与 `<array2>` 相同。 |
| `<array2>` | 第二个稠密向量。数组元素支持 TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT 和 DOUBLE 类型，元素数量必须与 `<array1>` 相同。 |
| `<map1>` | 第一个稀疏向量。类型必须为 `MAP<K, FLOAT>`，其中 `K` 可以是整数类型（TINYINT、SMALLINT、INT、BIGINT 或 LARGEINT）或字符串类型（CHAR、VARCHAR 或 STRING）。其 key 类型必须与 `<map2>` 的 key 类型属于同一类型族。 |
| `<map2>` | 第二个稀疏向量，类型约束与 `<map1>` 相同。两个 Map 的元素数量可以不同。 |

## 返回值

返回标量积，返回类型为 `FLOAT`。

对于数组输入，将相同位置的元素相乘后求和。如果任一数组为 `NULL`、包含 `NULL` 元素，或两个数组的长度不同，函数会报错。

对于 Map 输入，将相同 key 对应的 value 相乘后求和。只出现在一个 Map 中的 key 不影响结果，相当于缺失维度的坐标值为零。`NULL` key 可以与另一个 `NULL` key 匹配。如果一个 key 重复出现，则使用它最后一次出现的 value。如果任一 Map 为 `NULL`，或任一 key 最终保留的 value 为 `NULL`，函数会报错。

## 示例

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```

```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```

以下示例计算两个稀疏向量的内积。只有 key `a` 和 `b` 同时出现在两个 Map 中，因此结果为 `2 * 5 + 3 * 4 = 22`：

```sql
SELECT INNER_PRODUCT(
    MAP('a', CAST(2 AS FLOAT), 'b', CAST(3 AS FLOAT)),
    MAP('b', CAST(4 AS FLOAT), 'c', CAST(100 AS FLOAT), 'a', CAST(5 AS FLOAT))
) AS result;
```

```text
+--------+
| result |
+--------+
|     22 |
+--------+
```

如果输入数组为 `NULL`，函数会报错：

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```

如果 Map 的 value 为 `NULL`，函数会报错：

```sql
SELECT INNER_PRODUCT(
    MAP(1, CAST(NULL AS FLOAT)),
    MAP(1, CAST(2 AS FLOAT))
);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
