---
{
    "title": "UUID_NUMERIC",
    "language": "en",
    "description": "Return a LARGEINT type uuid"
}
---

## Description

Return a LARGEINT type uuid

## Syntax

```sql
UUID_NUMERIC()
```

## Return Value

Return a LARGEINT type uuid. Note that LARGEINT is an Int128, so uuid_numeric() may produce negative values

## Example

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
