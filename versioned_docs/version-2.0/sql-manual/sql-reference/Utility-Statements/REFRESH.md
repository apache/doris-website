---
{
    "title": "REFRESH",
    "language": "en"
}
---

## REFRESH

### Name

REFRESH

### Description

This statement refreshes the metadata of the specified Catalog/Database/Table.

syntax:

```sql
REFRESH CATALOG catalog_name;
REFRESH DATABASE [catalog_name.]database_name;
REFRESH TABLE [catalog_name.][database_name.]table_name;
```

When the Catalog is refreshed, the object-related Cache is forced to be invalidated.

Including Partition Cache, Schema Cache, File Cache, etc.

### Example

1. Refresh hive catalog

    ```sql
    REFRESH CATALOG hive;
    ```

2. Refresh database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

3. Refresh table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```

### Keywords

REFRESH, CATALOG, DATABASE, TABLE

### Best Practice

