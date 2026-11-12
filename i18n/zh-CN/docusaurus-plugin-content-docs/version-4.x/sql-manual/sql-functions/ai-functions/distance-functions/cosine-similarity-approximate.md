---
{
    "title": "COSINE_SIMILARITY_APPROXIMATE",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 4.2 COSINE_SIMILARITY_APPROXIMATE 的语法、FLOAT 返回值、零向量和 NULL 行为，以及 Lance Top-N 自动下推的排序方向、查询向量类型与近似检索边界。"
}
---

## 描述

计算两个向量的余弦相似度。 NULL 数组或 NULL 元素会报错。

在包含此能力的 Doris 4.2 构建中可用。 符合条件的 Lance Top-N 可使用原生近似检索；其他查询执行标量内核。

## 语法

```sql
COSINE_SIMILARITY_APPROXIMATE(<array1>, <array2>)
```

## 参数

| 参数 | 描述 |
|---|---|
| `<array1>` | 数值数组，隐式转换为 ARRAY<FLOAT>，转换可能影响精度。 |
| `<array2>` | 数值数组，隐式转换为 ARRAY<FLOAT>，转换可能影响精度。 两个数组的长度必须相同。 |

## 返回值

返回 `FLOAT`，值越大越相似。标量计算为 `dot(x,y) / (norm(x) * norm(y))`；任一向量范数为零时返回 0，包括空数组对。 长度不匹配、NULL 数组或 NULL 元素会报错，不返回 NULL。 原生检索的候选范围、数值精度及 NULL/NaN 行为可能与标量执行不同，详见[自动检索下推](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search)。

## 示例

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot be null
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot have null
```
