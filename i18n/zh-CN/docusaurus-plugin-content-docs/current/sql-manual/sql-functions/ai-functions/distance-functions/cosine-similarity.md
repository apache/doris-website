---
{
    "title": "COSINE_SIMILARITY",
    "language": "zh-CN",
    "description": "计算两个向量之间的余弦相似度"
}
---

## 描述

计算两个向量之间的余弦相似度。
函数按照向量的点积与模长计算相似度，结果范围为 `[-1, 1]`。

## 语法

```sql
COSINE_SIMILARITY(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<array1>` | 第一个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |
| `<array2>` | 第二个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |

两个数组都非空时，元素个数必须一致。

## 返回值

返回两个向量的余弦相似度，类型为可空的 `FLOAT`。数组输入遵循以下规则：

- 任一数组整体为 `NULL` 或空数组 `[]` 时，返回 `NULL`，包括 `NULL` 与 `NULL`、`[]` 与 `[]` 的组合。
- 非空数组包含 `NULL` 元素时，报错；另一参数为 `NULL` 或 `[]` 不会使这个非法数组变为有效输入。
- 两个数组都非空但元素个数不一致时，报错。

这些标量计算规则不依赖 `enable_ann_index_empty_array` 配置；该配置仅控制 ANN 索引列是否接受空数组写入。

两个数组均有效且非空时，零向量（例如 `[0, 0]`）仍返回 `0.0`，与空数组不同。

## 举例

```sql
-- 两个向量完全相同，相似度为 1
SELECT COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

`[1, 2, 3]` 与 `[1, 2, 3]` 的方向完全一致，因此相似度为 `1`。

```sql
-- 两个向量正交，相似度为 0
SELECT COSINE_SIMILARITY([1, 0], [0, 1]);
```

```text
+-----------------------------------+
| COSINE_SIMILARITY([1, 0], [0, 1]) |
+-----------------------------------+
|                                 0 |
+-----------------------------------+
```

两个向量互相垂直，点积为 `0`，因此相似度为 `0`。

```sql
-- 任一向量为零向量时，返回 0
SELECT COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]) |
+-----------------------------------------+
|                                       0 |
+-----------------------------------------+
```

零向量没有有效方向，因此结果为 `0`。

```sql
-- 空数组返回 NULL
SELECT COSINE_SIMILARITY([], []);
```

```text
+---------------------------+
| COSINE_SIMILARITY([], []) |
+---------------------------+
|                      NULL |
+---------------------------+
```

```sql
-- 输入数组中包含 NULL，会报错
SELECT COSINE_SIMILARITY([1, NULL, 3], [1, 2, 3]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_similarity cannot have null
```

以下示例展示空数组与 NULL 输入的行为：

```sql
SELECT COSINE_SIMILARITY(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       COSINE_SIMILARITY(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
