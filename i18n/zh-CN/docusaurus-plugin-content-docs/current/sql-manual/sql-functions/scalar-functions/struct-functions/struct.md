---
{
    "title": "STRUCT",
    "language": "zh-CN",
    "description": "根据给定的值构造并返回 struct。函数接受一个或多个参数，返回一个包含所有输入元素的结构体。"
}
---

## 描述

根据给定的值构造并返回 struct。函数接受一个或多个参数，返回一个包含所有输入元素的结构体。

## 语法

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## 参数

- `<expr1>, <expr2>, ...`：构造 struct 的输入内容，支持一个或多个参数

**支持的元素类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型：ARRAY、MAP、STRUCT

## 返回值

返回类型：STRUCT<T>

返回值含义：
- 返回一个包含所有输入元素的结构体，字段名默认为 col1, col2, col3, ... 格式
- 所有字段都支持 NULL 值

## 使用说明

- 函数会将所有输入元素组合成一个结构体
- 至少需要一个参数
- 所有字段都标记为可空（nullable）

## 举例

**查询示例：**

基本用法：创建包含混合类型的结构体，并且字段有 null
```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
+--------------------------------------+--------------------------------------+----------------------------------------+
| struct(1, 'a', "abc")                | struct(null, 1, null)                | struct(cast('2023-03-16' as datetime)) |
+--------------------------------------+--------------------------------------+----------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}         |
+--------------------------------------+--------------------------------------+----------------------------------------+
```

创建包含复杂类型的结构体：
```sql
select struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2));
+----------------------------------------------------------------------------------+
| struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2))          |
+----------------------------------------------------------------------------------+
| {"col1":[1, 2, 3], "col2":{"name":"Alice", "age":"20"}, "col3":{"f1":1, "f2":2}} |
+----------------------------------------------------------------------------------+
```

创建包含 IP 地址的结构体：
```sql
select struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6));
+------------------------------------------------------------------+
| struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6)) |
+------------------------------------------------------------------+
| {"col1":"192.168.1.1", "col2":"2001:db8::1"}                     |
+------------------------------------------------------------------+
```

错误示例

不支持的类型会报错：
创建包含 Json/Variant 类型
```sql 
select struct(v) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type

select struct(cast(1 as jsonb)) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type
```

创建空的struct 会报错，至少有一个参数，和 hive 行为保持一致：
```sql
select struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = struct requires at least one argument, like: struct(1)
```



