---
{
    "title": "ARRAY_PRODUCT",
    "language": "zh-CN",
    "description": "计算数组中所有元素的乘积。函数会遍历数组中的所有元素，将它们相乘并返回结果。"
}
---

## array_product

<version since="2.0.0">

</version>

## 描述

计算数组中所有元素的乘积。函数会遍历数组中的所有元素，将它们相乘并返回结果。

## 语法

```sql
array_product(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY<T> 类型，要计算乘积的数组

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL

### 返回值

返回类型：T

返回值含义：
- 返回数组中所有元素的乘积
- NULL：如果数组为空、数组为 NULL，或者所有元素都为 NULL

使用说明：
- 函数会跳过数组中的 NULL 值，只对非 NULL 元素进行乘积计算
- 如果数组中所有元素都为 NULL，返回 NULL
- 空数组返回 NULL
- 复杂类型（MAP、STRUCT、ARRAY）不支持乘积计算，调用会报错
- 对数组元素中的 null 值：null 元素不参与乘积计算

**查询示例：**

计算整数数组的乘积：
```sql
SELECT array_product([1, 2, 3, 4, 5]);
+--------------------------------+
| array_product([1, 2, 3, 4, 5]) |
+--------------------------------+
|                            120 |
+--------------------------------+
```

计算浮点数数组的乘积：
```sql
SELECT array_product([1.1, 2.2, 3.3, 4.4, 5.5]);
+------------------------------------------+
| array_product([1.1, 2.2, 3.3, 4.4, 5.5]) |
+------------------------------------------+
|                                    190.8 |
+------------------------------------------+
```

计算包含 null 的数组的乘积：
```sql
SELECT array_product([1, null, 3, null, 5]);
+----------------------------------------+
| array_product([1, null, 3, null, 5])  |
+----------------------------------------+
| 15.0                                   |
+----------------------------------------+
```

计算布尔数组的乘积（true=1, false=0）：
```sql
SELECT array_product([true, false, true, true]);
+------------------------------------------+
| array_product([true, false, true, true]) |
+------------------------------------------+
|                                        0 |
+------------------------------------------+
```

空数组返回 NULL：
```sql
SELECT array_product([]);
+----------------------+
| array_product([])    |
+----------------------+
| NULL                 |
+----------------------+
```

所有元素都为 null 的数组返回 NULL：
```sql
SELECT array_product([null, null, null]);
+----------------------------------+
| array_product([null, null, null]) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错：
```sql
SELECT array_product([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<ARRAY<TINYINT>>
```

map 类型不支持，报错：
```sql
SELECT array_product([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage: array_product does not support type: ARRAY<MAP<VARCHAR(1),TINYINT>>
```

参数数量错误会报错：
```sql
SELECT array_product([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_product' which has 2 arity. Candidate functions are: [array_product(Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_product('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_product(VARCHAR(12))
```

### Keywords

ARRAY, PRODUCT, ARRAY_PRODUCT
