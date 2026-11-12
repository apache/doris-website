---
{
    "title": "HAMMING_DISTANCE",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 4.2 HAMMING_DISTANCE 精确距离函数：对整数 byte 数组执行 XOR 和 bit 计数，说明参数范围、返回类型、空数组、NULL 与越界输入的报错行为。"
}
---

## 描述

计算两个 byte 向量的 Hamming 距离，即按位 XOR 后不同 bit 的数量。 NULL 数组或 NULL 元素会报错。

在包含此能力的 Doris 4.2 构建中可用。 始终执行精确标量计算，不自动改写为 ANN 检索。

## 语法

```sql
HAMMING_DISTANCE(<array1>, <array2>)
```

## 参数

| 参数 | 描述 |
|---|---|
| `<array1>` | 整数数组，允许 TINYINT、SMALLINT、INT、BIGINT，统一转换为 ARRAY<BIGINT>；每个元素必须在 `[0,255]`。不接受浮点、Decimal、LARGEINT 数组。 |
| `<array2>` | 整数数组，允许 TINYINT、SMALLINT、INT、BIGINT，统一转换为 ARRAY<BIGINT>；每个元素必须在 `[0,255]`。不接受浮点、Decimal、LARGEINT 数组。 两个数组的长度必须相同。 |

## 返回值

返回 `FLOAT`，值越小越接近。空数组对返回 0；N 字节向量的最大距离是 8N。 长度不匹配、NULL 数组或 NULL 元素会报错，不返回 NULL。 越界元素也会报错。

## 示例

```sql
SELECT HAMMING_DISTANCE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot be null
```

```sql
SELECT HAMMING_DISTANCE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot have null
```

```sql
SELECT HAMMING_DISTANCE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
