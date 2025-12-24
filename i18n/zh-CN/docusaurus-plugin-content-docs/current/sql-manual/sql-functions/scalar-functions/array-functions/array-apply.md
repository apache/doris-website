---
{
    "title": "ARRAY_APPLY",
    "language": "zh-CN",
    "description": "使用指定的二元操作符对数组元素进行过滤，返回满足条件的元素组成的新数组。这是一个简化的数组过滤函数，使用预定义的操作符而不是 lambda 表达式。"
}
---

## array_apply

<version since="1.2.3">

</version>

## 描述

使用指定的二元操作符对数组元素进行过滤，返回满足条件的元素组成的新数组。这是一个简化的数组过滤函数，使用预定义的操作符而不是 lambda 表达式。

## 语法

```sql
array_apply(arr, op, val)
```

### 参数

- `arr`：ARRAY\<T> 类型，要过滤的数组
- `op`：STRING 类型，过滤条件操作符，必须是常量值。支持的操作符：`=`、`!=`、`>`、`>=`、`<`、`<=`
- `val`：T 类型，过滤的条件值，必须是常量值

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN

### 返回值

返回类型：ARRAY\<T>

返回值含义：
- 返回满足过滤条件的所有元素组成的新数组
- NULL：如果输入数组为 NULL 或条件值为 NULL
- 空数组：如果没有元素满足条件

使用说明：
- 操作符和条件值必须是常量，不能是列名或表达式
- 支持的类型有限，主要是数值、日期和布尔类型
- 空数组返回空数组，NULL 数组返回 NULL
- 对数组元素中的 null 值：null 元素会被过滤掉，不参与比较操作

### 示例

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**查询示例：**

过滤 double_array 中大于 2 的元素：
```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```

过滤 int_array 中不等于 3 的元素：
```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```

过滤 date_array 中大于等于指定日期的元素：
```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```

NULL 数组返回 NULL：当输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```

包含 null 的数组，null 元素会被过滤：
```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```

### 异常示例

不支持的操作符：
```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```

不支持字符串类型：
```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```

不支持复杂类型：
```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```

操作符不是常量：
```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```

条件值不是常量：
```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```

参数数量错误：
```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```

传入非数组类型：
```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### keywords

ARRAY, APPLY, ARRAY_APPLY 