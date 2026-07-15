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
|---|--|
| `<array1>` | 第一个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array2 保持一致 |
| `<array2>` | 第二个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array1 保持一致 |

## 返回值

返回两个向量（向量值为坐标）之间的余弦距离，返回类型为 `FLOAT`。

如果任一输入数组为 `NULL`，或包含 `NULL` 元素，函数会报错。

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

如果输入数组为 `NULL`，函数会报错：

```sql
SELECT COSINE_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot be null
```

如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```
