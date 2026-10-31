---
{
    "title": "NAMED_STRUCT",
    "language": "en",
    "description": "Construct and return a struct based on the given strings and values. Notes:"
}
---

## Description

Construct and return a struct based on the given strings and values. Notes:

- The number of parameters must be a non-zero even number.The odd-indexed elements are the names of the fields, which must be constant strings.The even-indexed elements are the values of the fields, which can be either multiple columns or constants.

## Syntax

```sql
NAMED_STRUCT( <field_name> , <filed_value> [ , <field_name> , <filed_value> ... ] )
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<field_name>` | The odd-indexed elements in constructing the struct are the field names, which must be constant strings |
| `<filed_value>` | The even-indexed elements in constructing the struct represent the field values, which can be either multiple columns or constants |

## Return Value

Construct and return a struct based on the given strings and values.

## Example

```sql
select named_struct('f1', 1, 'f2', 'a', 'f3', "abc"),named_struct('a', null, 'b', "v");
```

```text
+-----------------------------------------------+-----------------------------------+
| named_struct('f1', 1, 'f2', 'a', 'f3', 'abc') | named_struct('a', NULL, 'b', 'v') |
+-----------------------------------------------+-----------------------------------+
| {"f1":1, "f2":"a", "f3":"abc"}                | {"a":null, "b":"v"}               |
+-----------------------------------------------+-----------------------------------+
```
