---
{
    "title": "REFRESH",
    "language": "zh-CN"
}
---

## REFRESH

### Name

REFRESH


## 描述

该语句用于刷新指定 Catalog/Database/Table 的元数据。

语法：

```sql
REFRESH CATALOG catalog_name;
REFRESH DATABASE [catalog_name.]database_name;
REFRESH TABLE [catalog_name.][database_name.]table_name;
```

刷新Catalog的同时，会强制使对象相关的 Cache 失效。

包括Partition Cache、Schema Cache、File Cache等。

## 举例

1. 刷新 hive catalog

    ```sql
    REFRESH CATALOG hive;
    ```

2. 刷新 database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

3. 刷新 table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```

### Keywords

REFRESH, CATALOG, DATABASE, TABLE

### Best Practice

