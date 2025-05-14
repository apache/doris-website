---
{
    "title": "Data Catalog Overview",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

A Data Catalog is used to describe the attributes of a data source. 

In Doris, multiple catalogs can be created to point to different data sources (such as Hive, Iceberg, MySQL). Doris will automatically obtain the databases, tables, columns, partitions, data locations, etc. of the corresponding data sources through the catalogs. Users can access these catalogs for data analysis through standard SQL statements and can conduct join queries on the data from multiple catalogs.

There are two types of catalogs in Doris:

| Type                         | Description |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | The built-in catalog, named `internal`, used to store Doris internal table data. It cannot be created, modified, or deleted.      |
| External Catalog | External catalogs refer to all catalogs other than the Internal Catalog. Users can create, modify, and delete external catalogs. |

Catalogs are mainly applicable to the following three scenarios, but different catalogs are suitable for different scenarios. For details, see the documentation for the corresponding catalog.

| Scenario | Description      |
| ---- | ------------------------------------------- |
| Query Acceleration | Direct query acceleration for data lakes such as Hive, Iceberg, Paimon, etc.      |
| Data Integration | ZeroETL solution, directly accessing different data sources to generate result data, or facilitating data flow between different data sources. |
| Data Write-back | After data processing via Doris, write back to external data sources.                |

This document uses [Iceberg Catalog](./catalogs/iceberg-catalog.md) as an example to focus on the basic operations of catalogs. For detailed descriptions of different catalogs, please refer to the documentation of the corresponding catalog.

## Creating Catalog

Create an Iceberg Catalog using the `CREATE CATALOG` statement.

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

Essentially, a catalog created in Doris acts as a "proxy" to access the metadata services (such as Hive Metastore) and storage services (such as HDFS/S3) of the corresponding data source. Doris only stores connection properties and other information of the catalog, not the actual metadata and data of the corresponding data source.

### Common Properties

In addition to the set of properties specific to each catalog, here are the common properties for all catalogs `{CommonProperties}`.

| Property Name            | Description                                                                                                                          | Example                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `include_database_list`  | Supports synchronizing only specified Databases, separated by `,`. By default, all Databases are synchronized. Database names are case-sensitive. Use this parameter when there are many Databases in the external data source but only a few need to be accessed, to avoid synchronizing a large amount of metadata. | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list`  | Supports specifying multiple Databases that do not need to be synchronized, separated by `,`. By default, no filtering is applied, and all Databases are synchronized. Database names are case-sensitive. This is used in the same scenario as above, to exclude databases that do not need to be accessed. If there is a conflict, `exclude` takes precedence over `include`. | `'exclude_database_list' = 'db1,db2'` |


### Column Type Mapping

After a user creates a catalog, Doris automatically synchronizes the databases, tables, and columns of the catalog. For column type mapping rules of different catalogs, please refer to the documentation of the corresponding catalog.

For external data types that cannot currently be mapped to Doris column types, such as `UNION`, `INTERVAL`, etc., Doris will map the column type to `UNSUPPORTED`. For queries involving `UNSUPPORTED` types, see the example below:

Assume the synchronized table schema is:

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```

The query behavior is as follows:

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```

## Using Catalog

### Viewing Catalog

After creation, you can view the catalog using the `SHOW CATALOGS` command:

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | hms      | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```

You can view the statement to create a catalog using [SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG).

### Switching Catalog

Doris provides the `SWITCH` statement to switch the connection session context to the corresponding catalog. This is similar to using the `USE` statement to switch databases.

After switching to a catalog, you can use the `USE` statement to continue switching to a specified database, or use `SHOW DATABASES` to view the databases under the current catalog.

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

You can also use the `USE` statement with the fully qualified name `catalog_name.database_name` to switch directly to a specified database within a specified catalog:

```sql
USE iceberg_catalog.iceberg_db;
```

Fully qualified names can also be used in MySQL command line or JDBC connection strings to be compatible with the MySQL connection protocol.

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

The fixed name for the built-in catalog is `internal`. The switching method is the same as for external catalogs.

### Default Catalog
The user attribute `default_init_catalog` is used to set the default catalog for a specific user. Once set, when the specified user connects to Doris, they will automatically switch to the set catalog.

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

Note 1: If the catalog has been explicitly specified in the MySQL command line or JDBC connection strings, then the specified catalog will be used, and the `default_init_catalog` user attribute will not take effect.
Note 2: If the catalog set by the user attribute `default_init_catalog` no longer exists, it will automatically switch to the default `internal` catalog.
Note 3: This feature takes effect starting from version v3.1.x.

### Simple Query

You can query tables in external catalogs using any SQL statement supported by Doris.

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### Cross-Catalog Query

Doris supports join queries across different catalogs.

Here, let's create another MySQL Catalog:

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

Then, perform a join query between Iceberg tables and MySQL tables using SQL:

```sql
SELECT * FROM FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### Data Import

You can import data from a data source into Doris using the `INSERT` command.

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

You can also use the `CTAS (Create Table As Select)` statement to create an internal Doris table from an external data source and import the data:

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### Data Write-Back

Doris supports writing data back to external data sources using the `INSERT` statement. For more details, refer to:

* [Hive Catalog](./catalogs/hive-catalog.md)
* [Iceberg Catalog](./catalogs/iceberg-catalog.md)
* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## Refreshing Catalog

Catalogs created in Doris act as "proxy" to access the metadata services of corresponding data sources. Doris caches some metadata to improve access performance and reduce frequent cross-network requests. However, the cache has a validity period, and without refreshing, you cannot access the latest metadata. Therefore, Doris provides several ways to refresh catalogs.

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris also supports disabling metadata caching to access the latest metadata in real-time.

For detailed information and configuration of metadata caching, please refer to: [Metadata Cache](./meta-cache.md)

## Modifying Catalog

You can modify the properties or name of a catalog using the `ALTER CATALOG` statement:

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## Deleting Catalog

You can delete a specified external catalog using the `DROP CATALOG` statement.

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

Deleting an external catalog from Doris does not remove the actual data; it only deletes the mapping relationship stored in Doris.

## Permission Management

The permission management for databases and tables in an external catalog is the same as for internal tables. For details, refer to the [Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md) documentation.



