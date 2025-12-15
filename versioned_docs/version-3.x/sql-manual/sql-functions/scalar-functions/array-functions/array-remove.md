---
{
    "title": "ARRAY_REMOVE",
    "language": "en"
}
---

## Description

Removes all specified elements from an array

## Syntax

```sql
ARRAY_REMOVE(<arr>, <val>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |
| `<val>` | Specifying Elements |

## Return Value

Returns the array after removing all specified elements. If the input parameter is NULL, it returns NULL

## Example

```sql
SELECT ARRAY_REMOVE(['test', NULL, 'value'], 'value');
```

```text
+------------------------------------------------+
| array_remove(['test', NULL, 'value'], 'value') |
+------------------------------------------------+
| ["test", null]                                 |
+------------------------------------------------+
```
