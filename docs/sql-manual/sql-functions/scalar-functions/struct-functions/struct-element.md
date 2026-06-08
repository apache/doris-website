---
{
    "title": "STRUCT_ELEMENT",
    "language": "en",
    "description": "Returns a specific field within a struct data column. The function supports accessing fields in a struct through field position (index) or field name."
}
---

:::caution
The `STRUCT_ELEMENT` function has been removed since version 4.1.3. Since no other database or query engine provides this function, we removed it. Please use the [`ELEMENT_AT`](../variant-functions/element-at.md) function instead (or the equivalent subscript `s[k]` / `s['field_name']` and dot `s.field_name` syntax).
:::

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
- Supports accessing by field name; the field name is matched **case-insensitively**
- The second parameter must be a constant (cannot be a column)
- The function is marked as AlwaysNullable, return value may be null
- Since version 4.1.3, `STRUCT_ELEMENT` is removed. Use `ELEMENT_AT(<struct>, ...)`, the subscript operators `<struct>[<index>]` / `<struct>['<field_name>']`, or the dot operator `<struct_col>.<field_name>` instead — these are all equivalent ways to access a struct field.

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

Access using the subscript operator (equivalent to the calls above):
```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')[1] as by_index,
       named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing')['age'] as by_name;
+----------+---------+
| by_index | by_name |
+----------+---------+
| Alice    |      25 |
+----------+---------+
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
ERROR 1105 (HY000): errCode = 2, detailMessage = element_at over a struct only allows a constant int or string second parameter: element_at(named_struct('name', 'Alice', 'age', 25), inv)
```

Input struct is NULL, will report error:
```sql
select struct_element(NULL, 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: struct_element(NULL, TINYINT)
```
