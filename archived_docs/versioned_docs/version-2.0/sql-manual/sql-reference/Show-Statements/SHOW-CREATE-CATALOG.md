---
{
    "title": "SHOW-CREATE-CATALOG",
    "language": "en"
}
---

## SHOW-CREATE-CATALOG

### Name

:::tip Tips
This feature  is supported since the Apache Doris 1.2 version
:::

SHOW CREATE CATALOG



### Description

This statement shows the creating statement of a doris catalog.

grammar:

```sql
SHOW CREATE CATALOG catalog_name;
```

illustrate:
- `catalog_name`: The name of the catalog which exist in doris.

### Example

1. View the creating statement of the hive catalog in doris

   ```sql
   SHOW CREATE CATALOG hive;
   ```

### Keywords

    SHOW, CREATE, CATALOG

### Best Practice

