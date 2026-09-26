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

返回 L1 空间中两点（向量值为坐标）之间的距离，返回类型为 `FLOAT`。

如果任一输入数组为 `NULL`，或包含 `NULL` 元素，函数会报错。

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

如果输入数组为 `NULL`，函数会报错：

```sql
SELECT L1_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot be null
```

如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT L1_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot have null
```
