---
{
    "title": "CREATE-DATABASE",
    "language": "zh-CN"
}
---

## CREATE-DATABASE

### Name

CREATE DATABASE

## 描述

该语句用于新建数据库（database）

语法：

```sql
CREATE DATABASE [IF NOT EXISTS] db_name
    [PROPERTIES ("key"="value", ...)];
```

`PROPERTIES` 该数据库的附加信息，可以缺省。

- 如果创建 Iceberg 数据库，则需要在 properties 中提供以下信息：

  ```sql
  PROPERTIES (
    "iceberg.database" = "iceberg_db_name",
    "iceberg.hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "iceberg.catalog.type" = "HIVE_CATALOG"
  )
  ```

  参数说明：
  
  - `ceberg.database` ：Iceberg 对应的库名；
  - `iceberg.hive.metastore.uris` ：hive metastore 服务地址;
  - `iceberg.catalog.type`： 默认为 `HIVE_CATALOG`；当前仅支持 `HIVE_CATALOG`，后续会支持更多 Iceberg catalog 类型。

## 举例

1. 新建数据库 db_test

   ```sql
   CREATE DATABASE db_test;
   ```

2. 新建 Iceberg 数据库 iceberg_test

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

