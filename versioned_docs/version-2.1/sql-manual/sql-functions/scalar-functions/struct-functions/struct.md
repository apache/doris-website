---
{
    "title": "STRUCT",
    "language": "en"
}
---

## Description

construct an struct with variadic elements and return it, Tn could be column or literal

## Syntax

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | Construct the input content for the struct |

## Return Value

construct an struct with variadic elements and return it, Tn could be column or literal

## Example

```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
```

```text
+--------------------------------------+--------------------------------------+---------------------------------------------+
| struct(1, 'a', 'abc')                | struct(NULL, 1, NULL)                | struct(cast('2023-03-16' as DATETIMEV2(0))) |
+--------------------------------------+--------------------------------------+---------------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}              |
+--------------------------------------+--------------------------------------+---------------------------------------------+
```
