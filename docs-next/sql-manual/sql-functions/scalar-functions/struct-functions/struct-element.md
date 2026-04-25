---
{
    "title": "STRUCT_ELEMENT",
    "language": "en-US",
    "description": "Returns a specific field within a struct data column. The function supports accessing fields in a struct through field position (index) or field name."
}
---

## Description

Returns a specific field within a struct data column. The function supports accessing fields in a struct through field position (index) or field name.

## Syntax

```sql
STRUCT_ELEMENT( <struct>, <field_location_or_name> )
```

## Parameters

- `<struct>`: Input struct column
- `<field_location_or_name>`: Field position (starting from 1) or field name, only supports constants

## Return Value

Return type: Field value type supported by struct

Return value meaning:
- Returns the specified field value
- If the input struct is null, returns null
- If the specified field does not exist, an error will be reported

## Usage

- Supports accessing by field position (index), index starts from 1
- Supports accessing by field name, field name must match exactly
- The second parameter must be a constant (cannot be a column)
- The function is marked as AlwaysNullable, return value may be null

## Examples

**Query Examples:**

Access by position:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1);
+--------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 1) |
+--------------------------------------------------------------------------------+
| Alice                                                                          |
+--------------------------------------------------------------------------------+
```

Access by field name:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age');
+------------------------------------------------------------------------------------+
| struct_element(named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing'), 'age') |
+------------------------------------------------------------------------------------+
|                                                                                 25 |
+------------------------------------------------------------------------------------+
```

Accessing struct containing complex types:
```sql
select struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array');
+---------------------------------------------------------------------------------+
| struct_element(named_struct('array', [1,2,3], 'map', {'key':'value'}), 'array') |
+---------------------------------------------------------------------------------+
| [1, 2, 3]                                                                       |
+---------------------------------------------------------------------------------+
```

Accessing result with null field value:
```sql
select struct_element(named_struct('name', null, 'age', 25), 'name');
+---------------------------------------------------------------+
| struct_element(named_struct('name', null, 'age', 25), 'name') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+
```

Error Examples

Accessing non-existent field name:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent');
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field name nonexistent was not found: struct_element(named_struct('name', 'Alice', 'age', 25), 'nonexistent')
```

Accessing out-of-bounds index:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = the specified field index out of bound: struct_element(named_struct('name', 'Alice', 'age', 25), 5)
```

Second parameter is not a constant:
```sql
select struct_element(named_struct('name', 'Alice', 'age', 25), inv) from var_with_index where k = 4;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct_element only allows constant int or string second parameter: struct_element(named_struct('name', 'Alice', 'age', 25), inv)
```

Input struct is NULL, will report error:
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
