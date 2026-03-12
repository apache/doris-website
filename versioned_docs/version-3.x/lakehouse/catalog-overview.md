---
{
    "title": "Data Catalog Overview",
    "language": "en",
    "description": "Learn about Apache Doris Data Catalog concepts and usage. Create external data catalogs to connect to Hive, Iceberg, Paimon, PostgreSQL, and other data sources for federated cross-source queries, data ingestion, and write-back."
}
---

A Data Catalog describes the properties of a data source.

In Doris, you can create multiple data catalogs pointing to different data sources (such as Hive, Iceberg, Paimon, PostgreSQL). Doris automatically retrieves databases, tables, schemas, partitions, and data locations from the corresponding data source through data catalogs. Users can access these data catalogs for data analysis using standard SQL statements, and perform join queries across data from multiple data catalogs.

There are two types of data catalogs in Doris:

| Type | Description |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | The built-in data catalog with a fixed name of `internal`, used to store Doris internal table data. It cannot be created, modified, or dropped. |
| External Catalog | External data catalogs, referring to all data catalogs other than the Internal Catalog. Users can create, modify, and drop external data catalogs. |

Data catalogs are primarily applicable to the following three types of scenarios, but different data catalogs have different applicable scenarios. Refer to the corresponding data catalog documentation for details.

| Scenario | Description |
| ---- | ------------------------------------------- |
| Query Acceleration | Directly accelerate queries on lakehouse data such as Hive, Iceberg, Paimon, etc. |
| Data Integration | ZeroETL approach to directly access different data sources to generate result data, or enable convenient data flow between different data sources. |
| Data Write-Back | Process and transform data through Doris, then write it back to external data sources. |

This article uses [Iceberg Catalog](./catalogs/iceberg-catalog) as an example to introduce the basic operations of data catalogs. For detailed introductions to different data catalogs, please refer to the corresponding data catalog documentation.

## Creating a Data Catalog

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

Essentially, a data catalog created in Doris acts as a "proxy" to access the metadata service (such as Hive Metastore) and storage service (such as HDFS/S3) of the corresponding data source. Doris only stores connection properties and other information about the data catalog, not the actual metadata or data of the corresponding data source.

### Common Properties

In addition to the property set specific to each data catalog, this section introduces the common properties `{CommonProperties}` shared by all data catalogs.

| Property | Description | Example |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | Specifies multiple databases to synchronize, separated by `,`. By default, all databases are synchronized. Database names are case-sensitive. When the external data source has a large number of databases but only a few need to be accessed, this parameter can be used to avoid synchronizing a large amount of metadata. | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | Specifies multiple databases to exclude from synchronization, separated by `,`. By default, no filtering is applied and all databases are synchronized. Database names are case-sensitive. Applicable to the same scenario as above, but for inversely excluding databases that do not need to be accessed. In case of conflict, `exclude` takes precedence over `include`. | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | Specifies multiple tables to synchronize, in `db.tbl` format, separated by `,`. When set, listing tables under a database will only return the specified tables, rather than fetching the full table list from the remote metadata service. Applicable when the external data source has a large number of tables and fetching the full table list may time out. | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | Catalog-level table name case control. See the [Table Name Case Sensitivity](#table-name-case-sensitivity-lower_case_table_names) section below for values and their meanings. The default value inherits from the global variable `lower_case_table_names`. | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | Catalog-level database name case control. See the [Database Name Case Sensitivity](#database-name-case-sensitivity-lower_case_database_names) section below for values and their meanings. The default value is `0` (case-sensitive). | `'lower_case_database_names' = '2'` |

### Specifying Table List

This feature is supported since version 4.1.0.

When the external data source (such as Hive Metastore) contains a large number of tables, fetching the full table list from the remote metadata service can be very time-consuming or even time out. By setting the `include_table_list` property, you can specify the tables to synchronize and avoid fetching the full table list from the remote.

`include_table_list` uses the `db.tbl` format, with multiple tables separated by commas `,`.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```

Behavior after setting:

- When listing tables under `db1`, only `table1` and `table2` are returned, without calling the remote metadata service's full table list API.
- When listing tables under `db2`, only `table3` is returned.
- For databases not included in `include_table_list` (such as `db3`), the full table list will still be fetched from the remote metadata service.
- Incorrectly formatted entries in `include_table_list` (not in `db.tbl` format) will be ignored.

:::tip
This property can be used in combination with `include_database_list`. For example, first filter the required databases using `include_database_list`, then further specify the required tables using `include_table_list`.
:::

### Table Name Case Sensitivity

This feature is supported since version 4.1.0.

The `lower_case_table_names` property allows you to control table name case handling at the Catalog level. This property supports three modes:

| Value | Mode | Description |
| -- | ---- | ---- |
| `0` | Case-sensitive (default) | Table names are stored and compared with their original case. When referencing a table name, it must exactly match the case in the remote metadata. |
| `1` | Stored as lowercase | Table names are stored in lowercase in Doris. Suitable for scenarios where you want to uniformly use lowercase table names to access external data sources. |
| `2` | Case-insensitive comparison | Table names are compared in a case-insensitive manner, but the original case from the remote metadata is preserved when displayed. Suitable for scenarios where table name cases are inconsistent in the external data source and you want to access tables in a case-insensitive way. |

If this property is not set, it inherits the value of the global variable `lower_case_table_names` by default.

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```

:::caution
When `lower_case_table_names` is set to `1` or `2`, if tables with names that differ only in case exist in the remote metadata (such as `MyTable` and `mytable`), conflicts may occur. Doris will detect such conflicts and report an error.
:::

### Database Name Case Sensitivity

This feature is supported since version 4.1.0.

The `lower_case_database_names` property allows you to control database name case handling at the Catalog level. This property supports three modes:

| Value | Mode | Description |
| -- | ---- | ---- |
| `0` | Case-sensitive (default) | Database names are stored and compared with their original case. When referencing a database name, it must exactly match the case in the remote metadata. |
| `1` | Stored as lowercase | Database names are stored in lowercase in Doris. Suitable for scenarios where you want to uniformly use lowercase database names to access external data sources. |
| `2` | Case-insensitive comparison | Database names are compared in a case-insensitive manner, but the original case from the remote metadata is preserved when displayed. Suitable for scenarios where database name cases are inconsistent in the external data source and you want to access databases in a case-insensitive way. |

The default value is `0` (case-sensitive).

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_database_names' = '2',
    'lower_case_table_names' = '2'
);
```

:::caution
When `lower_case_database_names` is set to `1` or `2`, if databases with names that differ only in case exist in the remote metadata (such as `MyDB` and `mydb`), conflicts may occur. Doris will detect such conflicts and report an error.
:::

:::info
`lower_case_database_names` and `lower_case_table_names` can be set independently without affecting each other. For example, you can set database names to be case-sensitive (`0`) while setting table names to be case-insensitive (`2`).
:::

### Column Type Mapping

After a user creates a data catalog, Doris automatically synchronizes the databases, tables, and schemas of the data catalog. For column type mapping rules of different data catalogs, please refer to the corresponding data catalog documentation.

For external data types that cannot currently be mapped to Doris column types, such as `UNION`, `INTERVAL`, etc., Doris maps the column type to `UNSUPPORTED`. For queries involving `UNSUPPORTED` types, see the following examples:

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

### Nullable Property

Doris currently has special limitations on the Nullable property support for external table columns. The specific behavior is as follows:

| Source Type | Doris Read Behavior | Doris Write Behavior |
| --- | --- | --- |
| Nullable | Nullable | Allows writing Null values |
| Not Null | Nullable, i.e., still read as a column that allows NULL | Allows writing Null values, i.e., no strict check on Null values. Users need to ensure data integrity and consistency on their own. |

## Using Data Catalogs

### Viewing Data Catalogs

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

You can view the CREATE CATALOG statement using [SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG).

### Switching Data Catalogs

Doris provides the `SWITCH` statement to switch the connection session context to the corresponding data catalog, similar to using the `USE` statement to switch databases.

After switching to a data catalog, you can use the `USE` statement to further switch to a specific database, or use `SHOW DATABASES` to view the databases under the current data catalog.

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

You can also use the `USE` statement with the fully qualified name `catalog_name.database_name` to directly switch to a specific database under a specific data catalog:

```sql
USE iceberg_catalog.iceberg_db;
```

The fully qualified name can also be used in MySQL command line or JDBC connection strings to be compatible with the MySQL connection protocol.

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

The built-in data catalog has a fixed name of `internal`. The switching method is the same as for external data catalogs.

### Default Data Catalog

Use the user property `default_init_catalog` to set the default data catalog for a specific user. Once set, when the specified user connects to Doris, the session will automatically switch to the configured data catalog.

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

Note 1: If a data catalog is explicitly specified in the MySQL command line or JDBC connection string, the specified one takes precedence and the `default_init_catalog` user property does not take effect.

Note 2: If the data catalog set by the user property `default_init_catalog` no longer exists, the session will automatically switch to the default `internal` data catalog.

Note 3: This feature is available starting from version 3.1.x.

### Simple Queries

You can query tables in external data catalogs using any SQL statement supported by Doris.

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### Cross-Catalog Queries

Doris supports join queries across data catalogs.

Here we create another [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md):

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

Then perform a join query between the Iceberg table and the MySQL table using SQL:

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### Data Ingestion

You can import data from data sources into Doris using the `INSERT` command.

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

You can also use the `CTAS (Create Table As Select)` statement to create a Doris internal table from an external data source and import the data:

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### Data Write-Back

Doris supports writing data back to external data sources directly using the `INSERT` statement. For details, refer to:

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## Refreshing Data Catalogs

Data catalogs created in Doris act as "proxies" to access the metadata service of the corresponding data source. Doris caches some metadata. Caching can improve metadata access performance and avoid frequent cross-network requests. However, caching also has timeliness issues — if the cache is not refreshed, the latest metadata cannot be accessed. Therefore, Doris provides multiple ways to refresh data catalogs.

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris also supports disabling metadata caching to enable real-time access to the latest metadata.

For detailed information and configuration of metadata caching, please refer to: [Metadata Cache](./meta-cache.md)

## Modifying Data Catalogs

You can modify the properties or name of a data catalog using `ALTER CATALOG`:

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## Dropping Data Catalogs

You can drop a specified external data catalog using `DROP CATALOG`.

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

Dropping an external data catalog from Doris does not delete the actual data. It only removes the data catalog mapping stored in Doris.

## Permission Management

Permission management for databases and tables in external data catalogs is the same as for internal tables. For details, refer to the [Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md) documentation.
