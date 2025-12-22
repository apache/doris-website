---
{
    "title": "ARRAY",
    "language": "zh-CN",
    "description": "创建一个数组。函数接受零个或多个参数，返回一个包含所有输入元素的数组。"
}
---

## array

<version since="2.0.0">

</version>

## 描述

创建一个数组。函数接受零个或多个参数，返回一个包含所有输入元素的数组。

## 语法

```sql
array([element1, element2, ...])
```

### 参数

- `element1, element2, ...`：任意类型，要包含在数组中的元素。支持零个或多个参数。

**支持的元素类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：ARRAY<T>

返回值含义：
- 返回一个包含所有输入元素的数组
- 空数组：如果没有输入参数

使用说明：
- 函数会将所有输入相同数据类型的元素组合成一个数组
- 复杂类型和基础类型无法兼容组合成一个数组，复杂类型之间也无法兼容组合成一个数组
- 支持零个或多个参数

**查询示例：**

创建包含多个元素的数组：
```sql
SELECT array(1, 2, 3, 4, 5);
+----------------------+
| array(1, 2, 3, 4, 5) |
+----------------------+
| [1, 2, 3, 4, 5]     |
+----------------------+
```

创建包含不同类型元素的数组：
```sql
SELECT array(1, 'hello', 3.14, true);
+----------------------------------+
| array(1, 'hello', 3.14, true)    |
+----------------------------------+
| ["1", "hello", "3.14", "true"]   |
+----------------------------------+
```

创建空数组：
```sql
SELECT array();
+----------+
| array()  |
+----------+
| []       |
+----------+
```

创建包含 null 元素的数组：
```sql
SELECT array(1, null, 3, null, 5);
+--------------------------------+
| array(1, null, 3, null, 5)    |
+--------------------------------+
| [1, null, 3, null, 5]         |
+--------------------------------+
```

### 复杂类型示例

创建包含 array 的数组：
```sql
SELECT array([1,2], [3,4], [5,6]);
+----------------------------+
| array([1,2], [3,4], [5,6]) |
+----------------------------+
| [[1, 2], [3, 4], [5, 6]]   |
+----------------------------+
```

创建包含 map 的数组：
```sql
SELECT array({'a':1}, {'b':2}, {'c':3});
+----------------------------------+
| array({'a':1}, {'b':2}, {'c':3}) |
+----------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]      |
+----------------------------------+
```

创建包含 struct 的数组：
```sql
SELECT array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30));
+-----------------------------------------------------------------------------------+
| array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)) |
+-----------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                            |
+-----------------------------------------------------------------------------------+
```

复杂类型与基本类型混合会报错：
```sql
SELECT array([1,2], 'hello');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TEXT
```

复杂类型之前混合会报错：
```sql
SELECT array([1,2], named_struct('name','Alice','age',20));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array(ARRAY<TINYINT>, STRUCT<name:VARCHAR(5),age:TINYINT>)
```

### Keywords

ARRAY
