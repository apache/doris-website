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

| 参数 | 说明 |
| -- | -- |
| `<array1>` | 第一个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |
| `<array2>` | 第二个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |
| `<map1>` | 第一个稀疏向量。类型必须为 `MAP<K, FLOAT>`，其中 `K` 可以是整数类型（TINYINT、SMALLINT、INT、BIGINT 或 LARGEINT）或字符串类型（CHAR、VARCHAR 或 STRING）。其 key 类型必须与 `<map2>` 的 key 类型属于同一类型族。 |
| `<map2>` | 第二个稀疏向量，类型约束与 `<map1>` 相同。两个 Map 的元素数量可以不同。 |

两个数组都非空时，元素个数必须一致。

MAP 重载接收两个 `MAP<K, FLOAT>` 参数 `<map1>` 和 `<map2>`，键必须同属整数类型或字符串类型，并可转换为相同类型；值可由其他数值类型转换。该重载按共同键计算稀疏向量的点积。

## 返回值

对于数组输入，返回两个向量的标量积，类型为可空的 `FLOAT`。数组输入遵循以下规则：

- 任一数组整体为 `NULL` 或空数组 `[]` 时，返回 `NULL`，包括 `NULL` 与 `NULL`、`[]` 与 `[]` 的组合。
- 非空数组包含 `NULL` 元素时，报错；另一参数为 `NULL` 或 `[]` 不会使这个非法数组变为有效输入。
- 两个数组都非空但元素个数不一致时，报错。

MAP 重载的行为保持不变：返回非空的 `FLOAT`；空 MAP 或没有共同键时返回 `0`。整个 MAP 为 `NULL`，或去重后保留的值为 `NULL` 时会报错。重复键使用最后一个值，`NULL` 键可与另一个 MAP 的 `NULL` 键匹配。

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

以下示例展示空数组与 NULL 输入的行为：

```sql
SELECT INNER_PRODUCT(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       INNER_PRODUCT(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```

```sql
SELECT INNER_PRODUCT(MAP(1, 2.0, 2, 3.0), MAP(2, 4.0, 3, 5.0)) AS map_result,
       INNER_PRODUCT(CAST(MAP() AS MAP<INT, FLOAT>), MAP(1, 2.0)) AS empty_map_result;
```

```text
+------------+------------------+
| map_result | empty_map_result |
+------------+------------------+
|         12 |                0 |
+------------+------------------+
```
