---
{
    "title": "COSINE_DISTANCE",
    "language": "zh-CN",
    "description": "计算两个向量（向量值为坐标）之间的余弦距离"
}
---

## 描述

计算两个向量（向量值为坐标）之间的余弦距离

## 语法

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<array1>` | 第一个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |
| `<array2>` | 第二个向量，输入数组的元素类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE。允许整个数组为 `NULL` 或空数组 `[]`；非空数组不能包含 `NULL` 元素。 |

两个数组都非空时，元素个数必须一致。

## 返回值

返回两个向量的余弦距离，类型为可空的 `FLOAT`。数组输入遵循以下规则：

- 任一数组整体为 `NULL` 或空数组 `[]` 时，返回 `NULL`，包括 `NULL` 与 `NULL`、`[]` 与 `[]` 的组合。
- 非空数组包含 `NULL` 元素时，报错；另一参数为 `NULL` 或 `[]` 不会使这个非法数组变为有效输入。
- 两个数组都非空但元素个数不一致时，报错。

这些标量计算规则不依赖 `enable_ann_index_empty_array` 配置；该配置仅控制 ANN 索引列是否接受空数组写入。

## 举例

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|                     0.007722139 |                     0.001539648 |
+---------------------------------+---------------------------------+
```


如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```

以下示例展示空数组与 NULL 输入的行为：

```sql
SELECT COSINE_DISTANCE(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       COSINE_DISTANCE(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
