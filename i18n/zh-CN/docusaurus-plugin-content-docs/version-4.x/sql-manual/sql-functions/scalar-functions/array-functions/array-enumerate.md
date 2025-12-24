---
{
    "title": "ARRAY_ENUMERATE",
    "language": "zh-CN",
    "description": "返回数组中每个元素的位置索引（从1开始）。函数会为数组中的每个元素生成对应的位置编号"
}
---

## array_enumerate

<version since="2.0.0">

</version>

## 描述

返回数组中每个元素的位置索引（从1开始）。函数会为数组中的每个元素生成对应的位置编号

## 语法

```sql
array_enumerate(ARRAY<T> arr)
```

### 参数

- `arr`：ARRAY<T> 类型，要生成位置索引的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：ARRAY<BIGINT>

返回值含义：
- 返回一个与输入数组等长的新数组，每个位置的值为对应元素在数组中的位置索引（从1开始）
- NULL：如果输入数组为 NULL

使用说明：
- 函数会为数组中的每个元素生成位置索引，从1开始递增
- 空数组返回空数组，NULL 数组返回 NULL
- 对数组元素中的 null 值：null 元素也会生成对应的位置索引

### 示例

**查询示例：**

为数组生成位置索引：
```sql
SELECT array_enumerate([1, 2, 1, 4, 5]);
+----------------------------------+
| array_enumerate([1, 2, 1, 4, 5]) |
+----------------------------------+
| [1, 2, 3, 4, 5]                  |
+----------------------------------+
```

空数组返回空数组：
```sql
SELECT array_enumerate([]);
+----------------------+
| array_enumerate([])  |
+----------------------+
| []                   |
+----------------------+
```

包含 null 的数组，null 元素也会生成位置索引：
```sql
SELECT array_enumerate([1, null, 3, null, 5]);
+--------------------------------------------+
| array_enumerate([1, null, 3, null, 5])     |
+--------------------------------------------+
| [1, 2, 3, 4, 5]                            |
+--------------------------------------------+
```

复杂类型示例：

嵌套数组类型：
```sql
SELECT array_enumerate([[1,2],[3,4],[5,6]]);
+----------------------------------------+
| array_enumerate([[1,2],[3,4],[5,6]])   |
+----------------------------------------+
| [1, 2, 3]                              |
+----------------------------------------+
```

map 类型：
```sql
SELECT array_enumerate([{'k':1},{'k':2},{'k':3}]);
+----------------------------------------------+
| array_enumerate([{'k':1},{'k':2},{'k':3}])   |
+----------------------------------------------+
| [1, 2, 3]                                    |
+----------------------------------------------+
```

struct 类型：
```sql
SELECT array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
+----------------------------------------------------------------------------------------+
| array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30))) |
+----------------------------------------------------------------------------------------+
| [1, 2]                                                                                  |
+----------------------------------------------------------------------------------------+
```

参数数量错误会报错：
```sql
SELECT array_enumerate([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate' which has 2 arity. Candidate functions are: [array_enumerate(Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_enumerate('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate(VARCHAR(12))
```

### Keywords

ARRAY, ENUMERATE, ARRAY_ENUMERATE 