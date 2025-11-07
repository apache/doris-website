---
{
    "title": "CURRENT_CATALOG",
    "language": "en"
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
