---
{
    "title": "USE",
    "language": "en"
}
---

## USE

### Name

USE

### Description

The USE command allows us to use the database

grammar:

```SQL
USE <[CATALOG_NAME].DATABASE_NAME>
```

illustrate:
1. `USE CATALOG_NAME.DATABASE_NAME` will switch the current catalog into `CATALOG_NAME` and then change the current database into `DATABASE_NAME`

### Example

1. If the demo database exists in current catalog, try accessing it:

    ```sql
    mysql> use demo;
    Database changed
    ```
2. If the demo database exists in catalog hms_catalog, try switching the catalog and accessing it:

    ```sql
    mysql> use hms_catalog.demo;
    Database changed
    ```

### Keywords

    USE

### Best Practice

