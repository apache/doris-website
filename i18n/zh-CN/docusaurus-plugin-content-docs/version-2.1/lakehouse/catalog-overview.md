---
{
    "title": "数据目录概述",
    "language": "zh-CN",
    "description": "数据目录（Data Catalog）用于描述一个数据源的属性。"
}
---

数据目录（Data Catalog）用于描述一个数据源的属性。

在 Doris 中，可以创建多个数据目录指向不同的数据源（如 Hive、Iceberg、MySQL）。Doris 会通过数据目录，自动获取对应数据源的库、表、Schema、分区、数据位置等。用户可以通过标准的 SQL 语句访问这些数据目录进行数据分析，并且可以对多个数据目录中的数据进行关联查询。

Doris 中的数据目录分为两种：

| 类型                         | 说明 |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | 内置数据目录，名称固定为 `internal`，用于存储 Doris 内表数据。不可创建、更改和删除。      |
| External Catalog | 外部数据目录，指代所有 Internal Catalog 以外的数据目录。用户可以创建、更改、删除外部数据目录。 |

数据目录主要适用于以下三类场景，但不同的数据目录适用场景不同，详见对应数据目录的文档。

| 场景 | 说明      |
| ---- | ------------------------------------------- |
| 查询加速 | 针对湖仓数据如 Hive、Iceberg、Paimon 等进行直接查询加速。      |
| 数据集成 | ZeroETL 方案，直接访问不同数据源生成结果数据，或让数据在不同数据源中便捷流转。 |
| 数据写回 | 通过 Doris 进行数据加工处理后，写回到外部数据源。                |

本文以 [Iceberg Catalog](./catalogs/iceberg-catalog) 为例，重点介绍数据目录的基础操作。不同数据目录的详细介绍，请参阅对应的数据目录文档。

## 创建数据目录

通过 `CREATE CATALOG` 语句创建一个 Iceberg Catalog。

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

本质上，在 Doris 中创建的数据目录是作为“代理”访问对应数据源的元数据服务（如 Hive Metastore）和存储服务（如 HDFS/S3）。Doris 中仅存储数据目录的连接属性等信息，不存储对应数据源实际的元数据和数据。

### 通用属性

除每个数据目录特有的属性集合外，这里介绍所有数据目录通用的属性 `{CommonProperites}`。

| 属性名                     | 描述                                                                        | 示例                                    |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 支持只同步指定的多个 Database，以 `,` 分隔。默认同步所有 Database。Database 名称是大小写敏感的。当外部数据源有大量 Database，但仅需访问个别 Database 时，可以使用此参数，避免大量的元数据同步。          | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 支持指定不需要同步的多个 Database，以 `,` 分割。默认不做任何过滤，同步所有 Database。Database 名称是大小写敏感的。适用场景同上，反向排除不需要访问的数据库。如果冲突，`exclude` 优先级高于 `include` | `'exclude_database_list' = 'db1,db2'` |

### 列类型映射

用户创建数据目录后，Doris 会自动同步数据目录的数据库、表和 Schema。不同数据目录的列类型映射规则请参阅对应的数据目录文档。

对于当前无法映射到 Doris 列类型的外部数据类型，如 `UNION`, `INTERVAL` 等，Doris 会将列类型映射为 `UNSUPPORTED` 类型。对于 `UNSUPPORTED` 类型的查询，示例如下：

假设同步后的表 Schema 为：

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```

则查询行为如下：

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```

### Nullable 属性

Doris 目前对外表列的 Nullable 属性支持有特殊限制，具体行为如下：

| 源类型 | Doris 读取行为 | Doris 写入行为 |
| ---   | ------------  | ------------ |
| Nullable | Nullable  | 允许写入 Null 值 |
| Not Null | Nullable，即依然当做可允许为 NULL 的列进行读取 | 允许写入 Null 值，即不对 Null 值进行严格检查。用户需要自行保证数据的完整性和一致性。|

## 使用数据目录

### 查看数据目录

创建后，可以通过 `SHOW CATALOGS` 命令查看 catalog：

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | hms      | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```

可以通过 [SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG) 查看创建 Catalog 的语句。

### 切换数据目录

Doris 提供 `SWITCH` 语句用于将连接会话上下文切换到对应的数据目录。类似使用 `USE` 语句切换数据库。

切换到数据目录后，可以使用 `USE` 语句继续切换到指定的数据库。或通过 `SHOW DATABASES` 查看当前数据目录下的数据库。

```sql
SWITCH iceberg_catalog;

SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| test               |
| iceberg_db         |
+--------------------+

USE iceberg_db;
```

也可以通过 `USE` 语句，直接使用全限定名 `catalog_name.database_name` 切换到指定数据目录下的指定数据库：

```sql
USE iceberg_catalog.iceberg_db;
```

全限定名也可以用于 MySQL 命令行或 JDBC 连接串中，以兼容 MySQL 连接协议。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

内置数据目录的固定名称为 `internal`。切换方式和外部数据目录一致。

### 默认数据目录

通过用户属性 `default_init_catalog`，为指定用户设置默认的数据目录。设置完成后，当指定用户连接 Doris 时，会自动切换到设置的数据目录。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

注意 1：如果 MySQL 命令行或 JDBC 连接串中已经明确指定了数据目录，则以指定的为准，`default_init_catalog` 用户属性不生效；
注意 2：如果用户属性 `default_init_catalog` 设置的数据目录已经不存在，则自动切换到默认的 `internal` 数据目录；
注意 3：该功能从 v3.1.x 版本开始生效；

### 简单查询

可以通过 Doris 支持的任意 SQL 语句查询外部数据目录中的表。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### 跨数据目录查询

Doris 支持跨数据目录的关联查询。

这里我们再创建一个 [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md)：

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

之后通过 SQL 对 Iceberg 表和 MySQL 表进行关联查询：

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### 数据导入

通过 `INSERT` 命令，可以将数据源中的数据导入到 Doris 中。

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

也可以通过 `CTAS(Create Table As Select)` 语句，使用外部数据源创建一张 Doris 内表并将数据导入：

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### 数据写回

Doris 支持通过 `INSERT` 语句直接将数据写回到外部数据源。具体参阅：

* [ Hive Catalog ](./catalogs/hive-catalog.mdx)

* [ Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [ JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## 刷新数据目录

Doris 中创建的数据目录是作为“代理”访问对应数据源的元数据服务的。Doris 会对部分元数据进行缓存。缓存可以提升元数据的访问性能，避免频繁的跨网络请求。但缓存也存在时效性问题，如果不对缓存进行刷新，则无法访问到最新的元数据。因此，Doris 提供了多种刷新数据目录的方式。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris 也支持关闭元数据缓存，以便能够实时访问到最新的元数据。

关于元数据缓存的详细介绍和配置，请参阅：[元数据缓存](./meta-cache.md)

## 修改数据目录

可以通过 `ALTER CATALOG` 对数据目录的属性或名称进行修改：

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## 删除数据目录

可以通过 `DROP CATALOG` 删除指定的外部数据目录。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

从 Doris 中删除外部数据目录，并不会删除实际的数据，只是删除了 Doris 中存储的数据目录映射关系。

## 权限管理

外部数据目录中库表的权限管理和内表一致。具体可参阅 [认证和鉴权](../admin-manual/auth/authentication-and-authorization.md) 文档。

