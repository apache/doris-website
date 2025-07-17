---
{
    "title": "JDBC Catalog",
    "language": "en"
}
---

JDBC Catalog supports connecting to databases that are compatible with the JDBC protocol through a standard JDBC interface.

This document introduces the general configuration and usage of the JDBC Catalog. For different JDBC sources, please refer to the respective documentation.

:::info Note
The JDBC Catalog feature in Doris relies on the Java layer to read and process data, and its overall performance can be affected by the JDK version. Some internal libraries in older versions of the JDK (such as JDK 8) are less efficient and may lead to higher resource consumption. If higher performance is required, it is recommended to use Doris 3.0, which is compiled with JDK 17 by default and offers better overall performance.
:::

## Applicable Scenarios

The JDBC Catalog is only suitable for data integration, such as importing small amounts of data from a data source into Doris or performing join queries on small tables in a JDBC data source. The JDBC Catalog cannot accelerate queries on the data source or access large amounts of data at once.

## Supported Databases

Doris JDBC Catalog supports connections to the following databases:

| Supported Data Sources |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-mysql-catalog.md) |
| [ Oracle](./jdbc-mysql-catalog.md)     |
| [ SQL Server](./jdbc-mysql-catalog.md) |
| [ IBM DB2](./jdbc-mysql-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

## Configuring Catalog

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' =='jdbc', -- required
    {JdbcProperties},
    {CommonProperties}
);
```

* `{JdbcProperties}`

  * Required Properties

      | Parameter Name   | Description                              | Example                       |
      | ---------------- | ---------------------------------------- | ----------------------------- |
      | `user`           | Data source username                     |                               |
      | `password`       | Data source password                     |                               |
      | `jdbc_url`       | Data source connection URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | Path to the JDBC driver file. For driver package security, see the appendix. | Supports three methods, see below. |
      | `driver_class`   | Class name of the JDBC driver            |                               |

      `driver_url` supports the following three specifications:
    
      1. Filename. For example, `mysql-connector-j-8.3.0.jar`. The Jar file must be pre-placed in the `jdbc_drivers/` directory under the FE and BE deployment directories. The system will automatically search in this directory. The location can also be modified by the `jdbc_drivers_dir` configuration in `fe.conf` and `be.conf`.
      
      2. Local absolute path. For example, `file:///path/to/mysql-connector-j-8.3.0.jar`. The Jar file must be pre-placed in the specified path on all FE/BE nodes.
      
      3. HTTP URL. For example: `http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`. The system will download the driver file from this HTTP address. Only supports HTTP services without authentication.

  * Optional Properties

      | Parameter Name                | Default Value | Description                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | Whether to synchronize the database, table, and column names from the external data source in lowercase                                        |
      | `meta_names_mapping`          |               | When the external data source has names that differ only in case, such as `MY_TABLE` and `my_table`, Doris will report an error due to ambiguity when querying the Catalog. You need to configure the `meta_names_mapping` parameter to resolve conflicts. |
      | `only_specified_database`     | false         | Whether to synchronize only the database specified in the `jdbc_url` (this Database maps to the Database level in Doris)                       |
      | `connection_pool_min_size`    | 1             | Defines the minimum number of connections in the connection pool, used to initialize the pool and ensure at least this number of active connections when keep-alive is enabled. |
      | `connection_pool_max_size`    | 30            | Defines the maximum number of connections in the connection pool. Each FE or BE node corresponding to each Catalog can hold up to this number of connections. |
      | `connection_pool_max_wait_time`| 5000         | Defines the maximum wait time in milliseconds for a client to wait for a connection if none are available in the pool.                         |
      | `connection_pool_max_life_time`| 1800000      | Sets the maximum active duration (in milliseconds) for a connection in the pool. Connections exceeding this time will be recycled. Additionally, half of this value is used as the minimum eviction idle time for the pool, making connections reaching this time eligible for eviction. |
      | `connection_pool_keep_alive`  | false         | Effective only on BE nodes, it determines whether to keep connections active that have reached the minimum eviction idle time but not the maximum lifetime. Disabled by default to reduce unnecessary resource usage. |
        
* `{CommonProperties}`

  The CommonProperties section is used to configure common properties. Please refer to the [Catalog Overview](../catalog-overview.md) section on **Common Properties**.

## Query Operations

### Basic Query

```sql
-- 1. switch to catalog, use database and query
SWITCH mysql_ctl;
USE mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 2. use mysql database directly
USE mysql_ctl.mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mysql_ctl.mysql_db.mysql_tbl LIMIT 10;
```

### Query Optimization

#### Predicate Pushdown

When the JDBC Catalog accesses a data source, it essentially selects a BE node, uses the JDBC Client to send a generated SQL query to the source, and retrieves the data. Therefore, the performance depends solely on how efficiently the generated SQL executes on the source side. Doris will attempt to push down predicate conditions and incorporate them into the generated SQL. You can use the `EXPLAIN SQL` statement to view the generated SQL.

```sql
EXPLAIN SELECT smallint_u, sum(int_u)
FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;

...
|   0:VJdbcScanNode(206)                                                                             |
|      TABLE: `doris_test`.`all_types`                                                               |
|      QUERY: SELECT `smallint_u`, `int_u` FROM `doris_test`.`all_types` WHERE ((`smallint_u` > 10)) |
|      PREDICATES: (smallint_u[#1] > 10)                                                             |
|      final projections: smallint_u[#1], int_u[#3]                                                  |
|      final project output tuple id: 1   
...                                                           |
```

#### Function Pushdown

For predicate conditions, the semantics or behavior in Doris and external data sources may be inconsistent. Therefore, Doris restricts and controls predicate pushdown in JDBC external table queries through the following parameter variables:

> Note: Currently, Doris only supports predicate pushdown for MySQL, Clickhouse, and Oracle data sources. More data sources will be supported in the future.

- `enable_jdbc_oracle_null_predicate_push_down`

    Session variable. The default is `false`. That is, when the predicate condition contains a `NULL` value, the predicate will not be pushed down to the Oracle data source. This is because, before Oracle version 21, Oracle does not support `NULL` as an operator.

    This parameter is supported since 2.1.7 and 3.0.3.

- `enable_jdbc_cast_predicate_push_down`

    Session variable. The default is `false`. That is, when there is an explicit or implicit CAST in the predicate condition, the predicate will not be pushed down to the JDBC data source. Since the behavior of CAST is inconsistent across different databases, to ensure correctness, CAST is not pushed down by default. However, users can manually verify whether the behavior of CAST is consistent. If so, this parameter can be set to `true` to allow more predicates to be pushed down for better performance.

    This parameter is supported since 2.1.7 and 3.0.3.

- Function pushdown blacklist and whitelist

    Functions with the same signature may have inconsistent semantics in Doris and external data sources. Doris has predefined some blacklists and whitelists for function pushdown:

    | Data Source   | Blacklist | Whitelist | Description     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL can also set additional blacklist items through the FE configuration item `jdbc_mysql_unsupported_pushdown_functions`, e.g.: `jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- Function rewrite rules

    There are some functions in Doris and external data sources that have consistent behavior but different names. Doris supports rewriting these functions during function pushdown. The following rewrite rules are currently built-in:

    | Data Source   | Doris Function | Target Function |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- Custom function pushdown and rewrite rules

    In subsequent versions after 3.0.7, Doris supports more flexible function pushdown and rewrite rules. Users can set function pushdown and rewrite rules for a specific Catalog in the Catalog properties:

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    Through `function_rules`, the following rules can be specified:

    - `pushdown`

        Specifies function pushdown rules. The `supported` and `unsupported` arrays specify the function names that can and cannot be pushed down, respectively. If a function exists in both arrays, `supported` takes precedence.

        Doris will first apply the system's predefined blacklists and whitelists, and then apply the user-specified blacklists and whitelists.

    - `rewrite`

        Defines function rewrite rules. As in the example above, the function name `to_date` will be rewritten as `date2` and pushed down.

        Note: Only functions that are allowed to be pushed down will be rewritten.

#### Row Count Limitation

If a query includes the `LIMIT` keyword, Doris will push the `LIMIT` clause down to the data source to reduce data transfer volume. You can use the `EXPLAIN` statement to confirm whether the generated SQL includes the `LIMIT` clause.

## Write Operations

Doris supports writing data back to the corresponding data source via the JDBC protocol.

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## Statement Passthrough

### Applicable Scenarios

Doris supports directly executing corresponding DDL, DML, and query statements in the JDBC data source through statement passthrough. This feature is applicable in the following scenarios:

* Improving Complex Query Performance

  By default, the Doris query optimizer parses the original SQL and generates the SQL to be sent to the data source based on certain rules. This generated SQL is typically a simple single-table query and cannot include operators like aggregation or join queries. For example, consider the following query:

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```

  The final generated SQL would be:

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```

  In this case, the aggregation operation is performed within Doris. Therefore, in some scenarios, a large amount of data may need to be read from the source over the network, resulting in low query efficiency. With statement passthrough, the original SQL can be directly passed to the data source, leveraging the data source's own computation capabilities to execute the SQL, thereby improving query performance.

* Unified Management

  In addition to query SQL, the statement passthrough feature can also pass DDL and DML statements. This allows users to perform database and table operations on the source data directly through Doris, such as creating, deleting tables, or modifying table structures.

### Passthrough SQL

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

The `QUERY` table function takes two parameters:

* `catalog`: The name of the catalog, which should match the name of the catalog.
* `query`: The query statement to execute, written directly using the syntax of the corresponding data source.

### Passthrough DDL and DML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

The `EXECUTE_STMT()` function takes two parameters:

* First parameter: The name of the catalog. Currently, only JDBC-type catalogs are supported.
* Second parameter: The SQL statement to execute. Currently, only DDL and DML statements are supported, and they must be written using the syntax of the corresponding data source.

### Usage Restrictions

When using the `CALL EXECUTE_STMT()` command, Doris directly sends the user-written SQL statement to the JDBC data source associated with the catalog for execution. As a result, this operation has the following restrictions:

* The SQL statement must follow the syntax of the corresponding data source. Doris does not perform syntax or semantic checks.

* Table names referenced in the SQL statement should preferably use fully qualified names, such as `db.tbl`. If the database is not specified, the database name in the JDBC URL of the JDBC catalog will be used.

* The SQL statement cannot reference databases or tables outside the JDBC data source, nor can it reference Doris's databases or tables. However, it can reference tables within the JDBC data source that are not synchronized with the Doris JDBC catalog.

* When executing DML statements, the number of rows inserted, updated, or deleted cannot be retrieved; only the success or failure of the command can be determined.

* Only users with `LOAD` permission on the catalog can execute the `CALL EXECUTE_STMT()` command.

* Only users with `SELECT` permission on the catalog can execute the `query()` table function.

* The JDBC user specified when creating the catalog must have the necessary permissions on the source to execute the corresponding statements.

* The data types of the results read by the `query()` table function are consistent with the data types supported by the queried catalog type.

## Appendix

### Case Sensitivity Settings


By default, database and table names in Doris are case-sensitive, while column names are case-insensitive. This behavior can be modified through configuration parameters. Additionally, the case sensitivity rules for database, table, and column names in some JDBC data sources may differ from those in Doris. This discrepancy can cause naming conflicts during name mapping via the JDBC Catalog. The following section explains how to resolve such issues.

#### Display Name and Query Name

In Doris, an object name (here we use table names as an example) can be divided into a **Display Name** and a **Query Name**. For instance, for a table name, the **Display Name** refers to the name shown in the result of `SHOW TABLES`, while the **Query Name** refers to the name that can be used in a `SELECT` statement.

For example, if the actual name of a table is `MyTable`, the **Display Name** and **Query Name** of this table may differ depending on the configuration of the Frontend (FE) parameter `lower_case_table_names`:

| Configuration | Description | Actual Name | Display Name | Query Name |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | Default configuration. The original name is stored and displayed, and queries are case-sensitive. | `MyTable` | `MyTable` | Case-sensitive in queries, must use: `MyTable` |
| `lower_case_table_names=1` | The name is stored and displayed in lowercase, and queries are case-insensitive. | `MyTable` | `mytable` | Case-insensitive in queries, e.g., you can use `MyTable` or `mytable`. |
| `lower_case_table_names=2` | The original name is stored and displayed, but queries are case-insensitive. | `MyTable` | `MyTable` | Case-insensitive in queries, e.g., you can use `MyTable` or `mytable`. |

#### JDBC Catalog Name Case Sensitivity Rules

Doris itself only allows configuration of the case sensitivity rules for **table names**. However, JDBC Catalog requires additional handling for **database names** and **column names**. Therefore, we use an additional Catalog property, `lower_case_meta_names`, to work in conjunction with `lower_case_table_names`.

| Configuration | Description |
| --- | --- |
| `lower_case_meta_names` | Specified via `properties` when creating a Catalog, and it applies only to that Catalog. The default value is `false`. When set to `true`, Doris converts all database, table, and column names to lowercase for storage and display. Queries must use the lowercase names in Doris. |
| `lower_case_table_names` | A Frontend (FE) configuration item, configured in `fe.conf`, and it applies to the entire cluster. The default value is `0`. |

> Note: If `lower_case_meta_names = true`, the `lower_case_table_names` configuration will be ignored, and all database, table, and column names will be converted to lowercase.

Based on the combinations of `lower_case_meta_names` (true/false) and `lower_case_table_names` (0/1/2), the behavior of database, table, and column names during **storage** and **queries** is shown in the following table ("Original" means retaining the case from the external data source, "Lowercase" means automatically converting to lowercase, and "Any Case" means queries can use any case):

| `lower_case_table_names` & `lower_case_meta_names` | Database Display Name | Table Display Name | Column Display Name | Database Query Name | Table Query Name | Column Query Name |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | Original              | Original           | Original            | Original            | Original         | Any Case          |
| `0 & true`                                        | Lowercase             | Lowercase          | Lowercase           | Lowercase           | Lowercase        | Any Case          |
| `1 & false`                                       | Original              | Lowercase          | Original            | Original            | Any Case         | Any Case          |
| `1 & true`                                        | Lowercase             | Lowercase          | Lowercase           | Lowercase           | Any Case         | Any Case          |
| `2 & false`                                       | Original              | Original           | Original            | Original            | Any Case         | Any Case          |
| `2 & true`                                        | Lowercase             | Lowercase          | Lowercase           | Lowercase           | Any Case         | Any Case          |

#### Case Conflict Check

When performing name mapping through a JDBC Catalog, naming conflicts may occur. For example, if the source column names are case-sensitive and there are two columns, `ID` and `id`. If `lower_case_meta_names = true` is set, these two columns will conflict after being converted to lowercase. Doris performs conflict checks according to the following rules:

* In any scenario, Doris will check for **column name** case conflicts (e.g., whether `id` and `ID` exist simultaneously).

* When `lower_case_meta_names = true`, Doris will check for case conflicts in database names, table names, and column names (e.g., whether `DORIS` and `doris` exist simultaneously).

* When `lower_case_meta_names = false` and `lower_case_table_names` is set to `1` or `2`, Doris will check for **table name** conflicts (e.g., whether `orders` and `ORDERS` exist simultaneously).

* When `lower_case_table_names = 0`, database and table names are case-sensitive, and no additional conversion is required.

#### Solutions to Case Conflicts

When conflicts occur, Doris will throw an error, and the conflicts must be resolved using the following approach.

For cases where databases, tables, or columns with only case differences (e.g., `DORIS` and `doris`) cause Doris to be unable to distinguish them properly, you can resolve the conflict by setting `meta_names_mapping` for the Catalog to specify manual mappings.

**Examples**

```json
{
  "databases": [
    {
      "remoteDatabase": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "doris",
      "mapping": "doris_2"
    }
  ],
  "tables": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "doris",
      "mapping": "doris_2"
    }
  ],
  "columns": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "doris",
      "mapping": "doris_2"
    }
  ]
}
```

### Driver Package Security

Driver packages are uploaded by users to the Doris cluster, which poses certain security risks. Users can enhance security through the following measures:

1. Doris considers all driver packages in the `jdbc_drivers_dir` directory to be secure and does not perform path checks on them. Administrators must manage the files in this directory themselves to ensure their security.

2. If a driver package is specified using a local path or an HTTP path, Doris performs the following checks:

   * The allowed driver package paths are controlled via the FE configuration item `jdbc_driver_secure_path`. This configuration can include multiple paths, separated by semicolons. When this configuration is set, Doris checks whether the `driver_url` path prefix is included in `jdbc_driver_secure_path`. If it is not included, the creation will be denied.

     Example:

     If `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` is configured, only driver package paths starting with `file:///path/to/jdbc_drivers` or `http://path/to/jdbc_drivers` are allowed.

   * This parameter defaults to `*`. If it is empty or set to `*`, all Jar package paths are allowed.

3. When creating a data directory, you can specify the checksum of the driver package using the `checksum` parameter. After loading the driver package, Doris will validate the checksum, and if the validation fails, the creation will be denied.

### Connection Pool Cleanup

In Doris, each FE and BE node maintains a connection pool to avoid the frequent opening and closing of individual data source connections. Each connection in the pool can be used to establish a connection with the data source and execute queries. After the task is completed, these connections are returned to the pool for reuse, which not only improves performance but also reduces the system overhead of establishing connections and helps prevent reaching the connection limit of the data source.

The size of the connection pool can be adjusted according to actual needs to better accommodate different workloads. Typically, the minimum number of connections in the pool should be set to 1 to ensure that at least one connection remains active when the keep-alive mechanism is enabled. The maximum number of connections should be set to a reasonable value to avoid excessive resource consumption.

To prevent the accumulation of unused connection pool caches on the BE, you can set the `jdbc_connection_pool_cache_clear_time_sec` parameter on the BE to specify the cache cleanup interval. The default value is 28,800 seconds (8 hours), after which the BE will forcibly clear all connection pool caches that have not been used within this time.

### Credential Update

When using the JDBC Catalog to connect to external data sources, it is important to carefully update database credentials.

Doris maintains active connections through the connection pool to respond quickly to queries. However, after changing credentials, the connection pool might continue using the old credentials to attempt new connections and fail. Since the system tries to maintain a certain number of active connections, these erroneous attempts will be repeated, and in some database systems, frequent failures might lead to account lockout.

It is recommended to update the Doris JDBC Catalog configuration in sync when credentials must be changed and restart the Doris cluster to ensure all nodes use the latest credentials, preventing connection failures and potential account lockouts.

Possible account lockouts include:

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```

### Connection Pool Troubleshooting

1. HikariPool Connection Timeout Error: `Connection is not available, request timed out after 5000ms`

   * Possible Causes

     * Cause 1: Network issues (e.g., server unreachable)

     * Cause 2: Authentication issues, such as invalid username or password

     * Cause 3: High network latency causing connection creation to exceed the 5-second timeout

     * Cause 4: Too many concurrent queries exceeding the maximum connections configured in the pool

   * Solutions

     * If you only encounter the error `Connection is not available, request timed out after 5000ms`, check Causes 3 and 4:

       * Check for high network latency or resource exhaustion.

       * Increase the maximum number of connections in the pool:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```

       * Increase the connection timeout:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```

     * If there are additional error messages besides `Connection is not available, request timed out after 5000ms`, check these additional errors:

       * Network issues (e.g., server unreachable) may cause connection failures. Ensure the network connection is stable.

       * Authentication issues (e.g., invalid username or password) may also cause connection failures. Verify the database credentials in the configuration to ensure the username and password are correct.

       * Investigate issues related to network, database, or authentication based on the specific error messages to identify the root cause.
