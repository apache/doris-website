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

返回两个向量（向量值为坐标）之间的余弦距离。如果输入 array 为 NULL，或者 array 中任何元素为 NULL，则返回 NULL。

## 举例

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|            0.007722123286332261 |           0.0015396467945875125 |
+---------------------------------+---------------------------------+
```
