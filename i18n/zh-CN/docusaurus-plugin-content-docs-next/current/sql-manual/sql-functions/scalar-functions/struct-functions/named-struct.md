---
{
    "title": "NAMED_STRUCT",
    "language": "zh-CN",
    "description": "根据给定的字段名和值构造并返回 struct。函数接受偶数个参数，奇数位是字段名，偶数位是字段值。"
}
---

## 描述

根据给定的字段名和值构造并返回 struct。函数接受偶数个参数，奇数位是字段名，偶数位是字段值。

## 语法

```sql
NAMED_STRUCT( <field_name> , <field_value> [ , <field_name> , <field_value> ... ] )
```

## 参数

- `<field_name>`：构造 struct 的奇数位输入内容，字段的名字，必须为常量字符串
- `<field_value>`：构造 struct 的偶数位输入内容，字段的值，可以是多列或常量

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
- 返回一个包含所有指定字段名和值对的结构体
- 所有字段都支持 NULL 值

## 使用说明

- 函数会将所有字段名和值对组合成一个结构体，奇数位是字段的名字，必须为常量字符串，且不能重复，大小写不敏感，偶数位是字段的值，可以是多列或常量
- 参数个数必须大于1的为非 0 偶数
- 所有字段都标记为可空（nullable）

**查询示例：**

基本用法：
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing');
+-------------------------------------------------------------+
| named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing') |
+-------------------------------------------------------------+
| {"name":"Alice", "age":25, "city":"Beijing"}                |
+-------------------------------------------------------------+
```

包含 null 值：
```sql
select named_struct('id', 1, 'name', null, 'score', 95.5);
+----------------------------------------------------+
| named_struct('id', 1, 'name', null, 'score', 95.5) |
+----------------------------------------------------+
| {"id":1, "name":null, "score":95.5}                |
+----------------------------------------------------+
```

包含复杂类型：
```sql
select named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2));
+-----------------------------------------------------------------------------------------------+
| named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2)) |
+-----------------------------------------------------------------------------------------------+
| {"array":[1, 2, 3], "map":{"key":"value"}, "struct":{"f1":1, "f2":2}}                         |
+-----------------------------------------------------------------------------------------------+
```

创建包含 IP 地址的命名结构体：
```sql
select named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6));
+----------------------------------------------------------------------------------------+
| named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6)) |
+----------------------------------------------------------------------------------------+
| {"ipv4":"192.168.1.1", "ipv6":"2001:db8::1"}                                           |
+----------------------------------------------------------------------------------------+
```

错误示例
参数少于2个：
```sql
select named_Struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)

select named_struct('name');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)
```

参数个数为奇数：
```sql
select named_struct('name', 'Alice', 'age');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct can't be odd parameters, need even parameters named_struct('name', 'Alice', 'age')
```

字段名重复，字段名大小写不敏感：
```sql
select named_struct('name', 'Alice', 'name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name

select named_struct('name', 'Alice', 'Name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name
```
