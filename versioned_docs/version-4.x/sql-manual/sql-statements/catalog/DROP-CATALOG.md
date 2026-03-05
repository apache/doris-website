---
{
    "title": "DROP CATALOG",
    "language": "en",
    "description": "This statement is used to delete the external catalog."
}
---

## Description

This statement is used to delete the external catalog.

## Syntax

```sql
DROP CATALOG [IF EXISTS] <catalog_name>;
```

## Required Parameters

**1. `<catalog_name>`**
The name of the catalog to be dropped.

## Access Control Requirements
| Privilege | Object  | Notes                                                               |
|:----------|:--------|:--------------------------------------------------------------------|
| DROP_PRIV | Catalog | The DROP_PRIV permission for the corresponding catalog is required. |


## Example

1. Drop catalog hive

   ```sql
   DROP CATALOG hive;
   ```


