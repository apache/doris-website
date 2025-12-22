---
{
    "title": "ARRAY_EXCEPT",
    "language": "zh-CN",
    "description": "返回第一个数组中存在但第二个数组中不存在的元素，去重后组成新数组，保持原始顺序。"
}
---

## array_except

<version since="2.0.0">

</version>

## 描述

返回第一个数组中存在但第二个数组中不存在的元素，去重后组成新数组，保持原始顺序。

## 语法

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### 参数

- `arr1`：ARRAY<T> 类型，第一个数组。
- `arr2`：ARRAY<T> 类型，第二个数组。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：ARRAY<T>

返回值含义：
- 返回一个新数组，包含 arr1 中存在但 arr2 中不存在的所有唯一元素，顺序与 arr1 保持一致。
- NULL：如果任一输入数组为 NULL。

使用说明：
- 仅支持基础类型数组，不支持复杂类型（ARRAY、MAP、STRUCT）。
- 空数组与任意数组做 except，结果为空数组。
- 对数组元素中的 null 值：null 元素会被视为普通元素参与运算，null 与 null 被认为是相同的

### 示例

```sql
CREATE TABLE array_except_test (
    id INT,
    arr1 ARRAY<INT>,
    arr2 ARRAY<INT>,
    str_arr1 ARRAY<STRING>,
    str_arr2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_except_test VALUES
(1, [1, 2, 3, 4, 5], [2, 4]),
(2, [10, 20, 30], [30, 40]),
(3, [], [1, 2]),
(4, NULL, [1, 2]),
(5, [1, null, 2, null, 3], [null, 2]),
(6, [1, 2, 3], NULL),
(7, [1, 2, 3], []),
(8, [], []),
(9, [1, 2, 2, 3, 3, 3, 4, 5, 5], [2, 3, 5]),
(10, [1], [1]);
```

**查询示例：**

基础整数数组 except：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

部分元素重叠：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

空数组与任意数组：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL 数组：当任何一个输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

包含 null 的数组：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

第二个数组为 NULL：当任何一个输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

第二个数组为空：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

两个数组都为空：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

去重示例：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

所有元素都被 except 掉：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

字符串数组 except：
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### 异常示例

参数数量错误：
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

类型不兼容：
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

传入非数组类型：
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

复杂类型不支持：
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### keywords

ARRAY, EXCEPT, ARRAY_EXCEPT 