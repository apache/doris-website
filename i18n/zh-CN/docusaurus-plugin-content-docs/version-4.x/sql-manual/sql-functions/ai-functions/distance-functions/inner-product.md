---
{
    "title": "INNER_PRODUCT",
    "language": "zh-CN",
    "description": "计算两个大小相同的向量的标量积"
}
---

## 描述

计算两个大小相同的向量的标量积

## 语法

```sql
INNER_PRODUCT(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
| -- |--|
| `<array1>` | 第一个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array2 保持一致 |
| `<array2>` | 第二个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与 array1 保持一致 |

## 返回值

返回两个大小相同的向量的标量积，返回类型为 `FLOAT`。

如果任一输入数组为 `NULL`，或包含 `NULL` 元素，函数会报错。

## 举例

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

如果输入数组为 `NULL`，函数会报错：

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

如果输入数组包含 `NULL` 元素，函数会报错：

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
