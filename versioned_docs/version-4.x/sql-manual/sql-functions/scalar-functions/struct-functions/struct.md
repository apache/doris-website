---
{
    "title": "STRUCT",
    "language": "en-US"
}
---

## Description

Constructs and returns a struct based on given values. The function accepts one or more parameters and returns a struct containing all input elements.

## Syntax

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## Parameters

- `<expr1>, <expr2>, ...`: Input content for constructing the struct, supports one or more parameters

**Supported element types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex types: ARRAY, MAP, STRUCT

## Return Value

Return type: STRUCT<T>

Return value meaning:
- Returns a struct containing all input elements, field names default to col1, col2, col3, ... format
- All fields support NULL values

## Usage

- The function combines all input elements into a struct
- At least one parameter is required
- All fields are marked as nullable

## Examples

**Query Examples:**

Basic usage: Creating a struct containing mixed types with null fields
```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
+--------------------------------------+--------------------------------------+----------------------------------------+
| struct(1, 'a', "abc")                | struct(null, 1, null)                | struct(cast('2023-03-16' as datetime)) |
+--------------------------------------+--------------------------------------+----------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}         |
+--------------------------------------+--------------------------------------+----------------------------------------+
```

Creating a struct containing complex types:
```sql
select struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2));
+----------------------------------------------------------------------------------+
| struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2))          |
+----------------------------------------------------------------------------------+
| {"col1":[1, 2, 3], "col2":{"name":"Alice", "age":"20"}, "col3":{"f1":1, "f2":2}} |
+----------------------------------------------------------------------------------+
```

Creating a struct containing IP addresses:
```sql
select struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6));
+------------------------------------------------------------------+
| struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6)) |
+------------------------------------------------------------------+
| {"col1":"192.168.1.1", "col2":"2001:db8::1"}                     |
+------------------------------------------------------------------+
```

Error Examples

Unsupported types will report error:
Creating struct containing Json/Variant types
```sql 
select struct(v) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type

select struct(cast(1 as jsonb)) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type
```

Creating empty struct will report error, at least one parameter is required, consistent with hive behavior:
```sql
select struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = struct requires at least one argument, like: struct(1)
```
