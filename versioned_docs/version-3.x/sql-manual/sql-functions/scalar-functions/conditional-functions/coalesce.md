---
{
    "title": "COALESCE",
    "language": "en",
    "description": "Returns the first non-null expression from left to right in the parameter list. If all arguments are NULL, returns NULL."
}
---

## Description

Returns the first non-null expression from left to right in the parameter list. If all arguments are NULL, returns NULL.

## Syntax

```sql
COALESCE(<expr> [, ...])
```

## Parameters

| Parameter      | Description                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `<expr>` | A sequence of expressions to evaluate. All expressions must be compatible data types. |

## Return Value

The first non-null expression in the parameter list. Returns NULL if all arguments are NULL.

## Examples

```sql
SELECT COALESCE(NULL, '1111', '0000');
```

```text
+--------------------------------+
| coalesce(NULL, '1111', '0000') |
+--------------------------------+
| 1111                           |
+--------------------------------+
```