---
{
    "title": "HAMMING_DISTANCE_APPROXIMATE",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 4.2 的近似 Hamming 距离函数，涵盖整数 byte 数组参数、XOR 后 bit 计数、NULL 与越界校验，以及 Lance UInt8 向量 Top-N 自动下推条件和标量回退语义。"
}
---

## 描述

计算两个 byte 向量的 Hamming 距离，即按位 XOR 后不同 bit 的数量。 NULL 数组或 NULL 元素会报错。

在包含此能力的 Doris 4.2 构建中可用。 符合条件的 Lance Top-N 可使用原生近似检索；其他查询执行标量内核。

## 语法

```sql
HAMMING_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## 参数

| 参数 | 描述 |
|---|---|
| `<array1>` | 整数数组，允许 TINYINT、SMALLINT、INT、BIGINT，统一转换为 ARRAY<BIGINT>；每个元素必须在 `[0,255]`。不接受浮点、Decimal、LARGEINT 数组。 |
| `<array2>` | 整数数组，允许 TINYINT、SMALLINT、INT、BIGINT，统一转换为 ARRAY<BIGINT>；每个元素必须在 `[0,255]`。不接受浮点、Decimal、LARGEINT 数组。 两个数组的长度必须相同。 |

## 返回值

返回 `FLOAT`，值越小越接近。空数组对返回 0；N 字节向量的最大距离是 8N。 长度不匹配、NULL 数组或 NULL 元素会报错，不返回 NULL。 越界元素也会报错。 原生检索的候选范围、数值精度及 NULL/NaN 行为可能与标量执行不同，详见[自动检索下推](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search)。

## 示例

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot be null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot have null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
