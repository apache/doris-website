---
{
    "title": "SWITCH CATALOG",
    "language": "en"
}
---

## Description

This statement is used to switch catalog.

## Syntax

```sql
SWITCH <catalog_name>
```

## Required Parameters

**1. `<catalog_name>`**
> The name of the catalog to switch to.

## Access Control Requirements

| Privilege  | Object     | Notes                                  |
|------------|------------|----------------------------------------|
| SELECT_PRIV  | Catalog    | SELECT_PRIV privilege is required on the catalog to be switched to. |

## Examples

1. Switch to the catalog `hive`

   ```sql
   SWITCH hive;
   ```
