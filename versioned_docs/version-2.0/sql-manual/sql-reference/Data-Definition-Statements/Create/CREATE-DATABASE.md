---
{
    "title": "CREATE-DATABASE",
    "language": "en"
}
---

## CREATE-DATABASE

### Name

CREATE DATABASE

### Description

This statement is used to create a new database (database)

grammar:

```sql
CREATE DATABASE [IF NOT EXISTS] db_name
    [PROPERTIES ("key"="value", ...)];
```

`PROPERTIES` Additional information about the database, which can be defaulted.

- If you create an Iceberg database, you need to provide the following information in properties:

  ```sql
  PROPERTIES (
    "iceberg.database" = "iceberg_db_name",
    "iceberg.hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "iceberg.catalog.type" = "HIVE_CATALOG"
  )
  ```

  illustrate:
  
  - `ceberg.database` : the library name corresponding to Iceberg;
  - `iceberg.hive.metastore.uris` : hive metastore service address;
  - `iceberg.catalog.type`: The default is `HIVE_CATALOG`; currently only `HIVE_CATALOG` is supported, and more Iceberg catalog types will be supported in the future.

- If you want to specify the default replica distribution for tables in db, you need to specify `replication_allocation` (the `replication_allocation` attribute of table will have higher priority than db)

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

### Example

1. Create a new database db_test

   ```sql
   CREATE DATABASE db_test;
   ```

2. Create a new Iceberg database iceberg_test

   ```sql
   CREATE DATABASE `iceberg_test`
   PROPERTIES (
   "iceberg.database" = "doris",
   "iceberg.hive.metastore.uris" = "thrift://127.0.0.1:9083",
   "iceberg.catalog.type" = "HIVE_CATALOG"
   );
   ```

### Keywords

```text
CREATE, DATABASE
```

### Best Practice

