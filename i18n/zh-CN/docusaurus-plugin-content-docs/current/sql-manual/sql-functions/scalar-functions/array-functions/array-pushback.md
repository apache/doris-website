---
{
    "title": "ARRAY_PUSHBACK",
    "language": "zh-CN",
    "description": "在数组末尾添加一个元素。函数会返回一个新数组，包含原数组的所有元素以及新添加的元素。"
}
---

## array_pushback

<version since="2.0.0">

</version>

## 描述

在数组末尾添加一个元素。函数会返回一个新数组，包含原数组的所有元素以及新添加的元素。

## 别名

- array_append

## 语法

```sql
array_pushback(ARRAY<T> arr, T element)
```

### 参数

- `arr`：ARRAY<T> 类型，要添加元素的数组
- `element`：T 类型，要添加到数组末尾的元素

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：ARRAY<T>

返回值含义：
- 返回一个新数组，包含原数组的所有元素以及新添加的元素
- NULL：如果输入数组为 NULL

使用说明：
- 函数会在数组末尾添加指定的元素
- 空数组可以正常添加元素，新元素的类型需要与数组元素类型兼容
- 对数组元素中的 null 值：null 元素会被正常处理

**查询示例：**

在字符串数组末尾添加元素：
```sql
SELECT array_pushback(['apple', 'banana', 'cherry'], 'date');
+----------------------------------------------------+
| array_pushback(['apple', 'banana', 'cherry'], 'date') |
+----------------------------------------------------+
| ["apple", "banana", "cherry", "date"]              |
+----------------------------------------------------+
```

在包含 null 的数组末尾添加null元素：
```sql
SELECT array_pushback([1, null, 3], null);
+------------------------------------+
| array_pushback([1, null, 3], null) |
+------------------------------------+
| [1, null, 3, null]                 |
+------------------------------------+
```

在空数组末尾添加元素：
```sql
SELECT array_pushback([], 42);
+--------------------------+
| array_pushback([], 42)   |
+--------------------------+
| [42]                     |
+--------------------------+
```

在浮点数数组末尾添加元素：
```sql
SELECT array_pushback([1.1, 2.2, 3.3], 4.4);
+------------------------------------------+
| array_pushback([1.1, 2.2, 3.3], 4.4)    |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```

NULL 数组返回 NULL：
```sql
SELECT array_pushback(NULL, 1);
+--------------------------+
| array_pushback(NULL, 1)  |
+--------------------------+
| NULL                     |
+--------------------------+
```


在 IP 地址数组末尾添加元素：
```sql
SELECT array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```

在嵌套数组末尾添加元素：
```sql
SELECT array_pushback([[1,2], [3,4]], [5,6]);
+------------------------------------------+
| array_pushback([[1,2], [3,4]], [5,6])   |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```

在 MAP 数组末尾添加元素：
```sql
SELECT array_pushback([{'a':1}, {'b':2}], {'c':3});
+----------------------------------------------+
| array_pushback([{'a':1}, {'b':2}], {'c':3}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```

在 STRUCT 数组末尾添加元素：
```sql
SELECT array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```

参数数量错误会报错：
```sql
SELECT array_pushback([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushback' which has 1 arity. Candidate functions are: [array_pushback(Expression, Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_pushback('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushback(VARCHAR(12), TINYINT)
```

### Keywords

ARRAY, PUSHBACK, ARRAY_PUSHBACK
