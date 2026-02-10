---
{
    "title": "CURRENT_CATALOG",
    "language": "en",
    "description": "Get the catalog of the current sql client connection."
}
---

## Description

Get the catalog of the current sql client connection.

## Syntax

```sql
CURRENT_CATALOG()
```

## Return Value

The catalog name of the current sql client connection.

## Examples

```sql
select current_catalog();
```

```text
+-------------------+
| current_catalog() |
+-------------------+
| internal          |
+-------------------+
```
