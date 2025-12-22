---
{
    "title": "STRUCT_ELEMENT",
    "language": "zh-CN",
    "description": "返回 struct 数据列内的某一字段。函数支持通过字段位置（索引）或字段名来访问结构体中的字段。"
}
---

## 描述

返回 struct 数据列内的某一字段。函数支持通过字段位置（索引）或字段名来访问结构体中的字段。

## 语法

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```

## 参数

- `<struct>`：输入的 struct 列
- `<field_location_or_name>`：字段的位置（从1开始）或字段的名字，仅支持常量

## 返回值

返回类型：struct 支持的字段值类型

返回值含义：
- 返回指定的字段值
- 如果输入的 struct 为 null，返回 null
- 如果指定的字段不存在，会报错

## 使用说明

- 支持通过字段位置（索引）访问，索引从1开始
- 支持通过字段名访问，字段名必须完全匹配
- 第二个参数必须是常量（不能是列）
- 函数标记为 AlwaysNullable，返回值可能为 null

## 举例

**查询示例：**

按位置访问：
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1);
+--------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1) |
+--------------------------------------------------------------------------------+
| Alice                                                                          |
+--------------------------------------------------------------------------------+
```

按字段名访问：
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age');
+------------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age') |
+------------------------------------------------------------------------------------+
|                                                                                 25 |
+------------------------------------------------------------------------------------+
```

访问包含有复杂类型的struct：
```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```

访问字段值有 null 的结果：
```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```

错误示例
访问的字段名不存在：
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```

访问的索引越界：
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```

访问的第二个参数不是常量：
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct_element only allows constant int or string second parameter: struct_element(named_struct('name', 'Alice', 'age', 25), inv)
```

输入的struct 为NULL，会报错：
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```