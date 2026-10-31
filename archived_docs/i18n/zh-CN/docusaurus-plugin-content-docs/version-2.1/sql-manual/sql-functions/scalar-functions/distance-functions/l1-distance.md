---
{
    "title": "L1_DISTANCE",
    "language": "zh-CN",
    "description": "计算 L1 空间中两点（向量值为坐标）之间的距离"
}
---

## 描述

计算 L1 空间中两点（向量值为坐标）之间的距离

## 语法

```sql
L1_DISTANCE(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- |--|
| `<array1>` | 第一个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array2 保持一致 |
| `<array2>` | 第二个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array1 保持一致 |

## 返回值

返回 L1 空间中两点（向量值为坐标）之间的距离。如果输入 array 为 NULL，或者 array 中任何元素为 NULL，则返回 NULL。

## 举例

```sql
SELECT L1_DISTANCE([4, 5], [6, 8]),L1_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l1_distance([4, 5], [6, 8]) | l1_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                           5 |                           2 |
+-----------------------------+-----------------------------+
```
