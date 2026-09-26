---
{
    "title": "UUID_NUMERIC",
    "language": "en",
    "description": "Return a LARGEINT type uuid"
}
---

## Description

Return a LARGEINT type uuid

This function continues to return LARGEINT; the native [UUID type](../../../basic-element/sql-data-types/uuid.md) does not change that behavior. Use [UUID_V4](../uuid-functions/uuid-v4.md) or [UUID_V7](../uuid-functions/uuid-v7.md) when a native UUID value is required.

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
