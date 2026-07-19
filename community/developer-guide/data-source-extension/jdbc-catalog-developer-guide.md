---
title: JDBC Catalog Data Source Extension Developer Guide
language: en
description: "How to add a new data source to Apache Doris JDBC Catalog: FE-side implementation, BE-side mapping, and regression test cases."
keywords:
    - Apache Doris JDBC Catalog
    - Data source extension
    - JdbcClient
    - JdbcExecutor
    - Metadata mapping
    - jdbcTypeToDoris
    - getColumnValue
    - Predicate pushdown
    - Function pushdown
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

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data source extension / Kernel development -->

# JDBC Catalog Data Source Extension Developer Guide

This document is for kernel developers who need to add a new data source to Apache Doris JDBC Catalog. It describes the classes to modify in the FE and BE layers, the key method signatures, and the regression test conventions. The examples below add a new data source named **NewDB**.

> Applicable version: Apache Doris 3.0 and later.

## Contents

- [1. Overall Architecture](#1-overall-architecture): Responsibilities and core components of FE and BE
- [2. Development Steps Overview](#2-development-steps-overview): A six-step table
- [3. Step 1 - Update the Thrift Definition](#3-step-1---update-the-thrift-definition)
- [4. Step 2 - Define Core Metadata in FE](#4-step-2---define-core-metadata-in-fe)
- [5. Step 3 - Implement the FE Metadata Client JdbcClient](#5-step-3---implement-the-fe-metadata-client-jdbcclient)
- [6. Step 4 - Adapt the FE Query Plan JdbcScanNode](#6-step-4---adapt-the-fe-query-plan-jdbcscannode)
- [7. Step 5 - Implement the BE Data Executor JdbcExecutor](#7-step-5---implement-the-be-data-executor-jdbcexecutor)
- [8. Step 6 - Add Regression Tests](#8-step-6---add-regression-tests)
- [9. Development Notes](#9-development-notes): Type mapping, error handling, predicate and function pushdown
- [10. Deployment Configuration](#10-deployment-configuration): Driver placement and `CREATE CATALOG` examples

---

## 1. Overall Architecture

<!-- Knowledge type: Architecture decision -->

JdbcCatalog uses an architecture that separates Frontend (FE) and Backend (BE):

| Layer | Responsibility |
|----|------|
| Frontend (FE) | Metadata management, SQL parsing, query planning, and optimization |
| Backend (BE)  | Data scanning, type conversion, and execution |

### FE Core Components

| Component | Role |
|------|------|
| `JdbcResource` | Defines the JDBC connection resource and parameters |
| `JdbcExternalCatalog` | Manages the entire Catalog, creates and manages the `JdbcClient` |
| `JdbcExternalDatabase` | Manages metadata at the database level |
| `JdbcExternalTable` | Manages metadata and schema at the table level |
| `JdbcClient` | Abstract base class that handles metadata operations (database list, table list, column information, etc.) |
| `JdbcScanNode` | The scan node in the query plan, responsible for generating the query SQL |
| `JdbcTableSink` | The sink node in the write plan |

### BE Core Components

| Component | Role |
|------|------|
| `vjdbc_connector.cpp` | C++ connector that calls the Java executor through JNI. **Developers do not need to modify this file.** |
| `BaseJdbcExecutor` | Abstract base class for the Java executor; handles data read and write operations |
| `JdbcExecutorFactory` | Factory class that creates the corresponding executor based on the data source type |

---

## 2. Development Steps Overview

<!-- Knowledge type: Operation steps -->

| Step | Goal | Files Involved |
|------|------|----------|
| Step 1 | Register the new data source type | `gensrc/thrift/Types.thrift` |
| Step 2 | Recognize the URL and type on the FE side | `JdbcResource.java`, `JdbcTable.java` |
| Step 3 | Implement the metadata client | `JdbcNewDBClient.java`, `JdbcClient.java` (factory registration) |
| Step 4 | Adapt the query plan | `JdbcScanNode.java` |
| Step 5 | Implement the BE-side data executor | `NewDBJdbcExecutor.java`, `JdbcExecutorFactory.java` |
| Step 6 | Add regression tests | `regression-test/suites/external_table_p0/jdbc/...` |

---

## 3. Step 1 - Update the Thrift Definition

1. **Modify the Thrift file**: In `gensrc/thrift/Types.thrift`, add a new type to the `TOdbcTableType` enum.

2. **Generate code**: Run the script in the Doris root directory to make the new enum value take effect in Java and C++ code.

---

## 4. Step 2 - Define Core Metadata in FE

1. **Modify `JdbcResource.java`**: Add constants for the NewDB URL prefix and type name, and add the recognition logic in the `parseDbType` method.

2. **Modify `JdbcTable.java`**: Map the NewDB type string to the Thrift enum, and define the quoting style of its SQL identifier (such as the identifier quote character).

---

## 5. Step 3 - Implement the FE Metadata Client JdbcClient

### 5.1 Core Logic for Metadata Interaction

This step is the core of metadata interaction with the external data source. Create `JdbcNewDBClient.java` under the `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/` directory, and override the following key methods:

```java
// doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcNewDBClient.java

public class JdbcNewDBClient extends JdbcClient {

    public JdbcNewDBClient(JdbcClientConfig jdbcClientConfig) {
        super(jdbcClientConfig);
    }

    /**
     * [Must override] Get the list of databases (or schemas).
     *
     * @return The list of database names.
     * @purpose This is the underlying implementation of the `SHOW DATABASES` command.
     * @implementation
     * 1. Get a JDBC Connection from the connection pool.
     * 2. Use `connection.getMetaData().getCatalogs()` or `getSchemas()` to get the list.
     * 3. Iterate the ResultSet and add the database names to a List<String>.
     * 4. Call `filterDatabaseNames()` to filter out system databases and databases that do not match the rules.
     */
    @Override
    public List<String> getDatabaseNameList() {
        // Implement the logic to get all database names of NewDB
    }

    /**
     * This is the underlying implementation of the `SHOW TABLES` command.
     *
     * @param remoteDbName The database name.
     * @return The list of table names.
     */
    @Override
    public List<String> getTablesNameList(String remoteDbName) {
        // Usually you do not need to override this method directly; override the internally called processTable() instead
        return super.getTablesNameList(remoteDbName);
    }

    /**
     * [Must override] Get the metadata of a table.
     *
     * @purpose Called by methods such as getTablesNameList() and isTableExist()
     *          to perform metadata lookup through `DatabaseMetaData.getTables()`.
     * @implementation
     * 1. Get the JDBC Connection and DatabaseMetaData.
     * 2. Call `databaseMetaData.getTables(catalog, schemaPattern, tableNamePattern, types)`.
     * 3. The key is to pass the correct values for the `catalog` and `schemaPattern` parameters, which depends on the JDBC driver implementation of NewDB.
     *    - If NewDB uses Catalog, pass `remoteDbName` as catalog and `null` as schemaPattern.
     *    - If NewDB uses Schema, pass `null` as catalog and `remoteDbName` as schemaPattern.
     */
    @Override
    protected void processTable(String remoteDbName, String remoteTableName, String[] tableTypes,
            Consumer<ResultSet> resultSetConsumer) {
        // Implement the logic that calls DatabaseMetaData.getTables()
    }

    /**
     * [Must override] **Core method** - Define the mapping from NewDB types to Doris types.
     *
     * @param fieldSchema Contains the column information obtained from the JDBC Driver, such as type name (getDataTypeName),
     *                    precision (getColumnSize), scale (getDecimalDigits), and so on.
     * @return The corresponding Doris `Type`.
     */
    @Override
    public Type jdbcTypeToDoris(JdbcFieldSchema fieldSchema) {
        // Return the Doris Type based on the information in fieldSchema
        // For example:
        // String newdbType = fieldSchema.getDataTypeName().toUpperCase();
        // switch (newdbType) {
        //     case "VARCHAR": return ScalarType.createStringType();
        //     case "INTEGER": return Type.INT;
        //     case "DECIMAL":
        //         return ScalarType.createDecimalV3Type(fieldSchema.getColumnSize(), fieldSchema.getDecimalDigits());
        //     // ... other type mappings
        //     default: return Type.UNSUPPORTED;
        // }
    }

    /**
     * [Recommended override] Define the system databases that should be filtered out from the `getDatabaseNameList` result.
     */
    @Override
    protected Set<String> getFilterInternalDatabases() {
        // return ImmutableSet.of("information_schema", "sys", "performance_schema", "newdb_system_db");
    }

    /**
     * [Recommended override] Define the query statement used when testing the connection.
     * The default is "SELECT 1", but some databases (such as Oracle) require "SELECT 1 FROM DUAL".
     */
    @Override
    public String getTestQuery() {
        // return "SELECT 1"; // Or a simple query supported by NewDB
    }

    /**
     * [Optional override] Define what value the catalog parameter should take when calling `DatabaseMetaData`-related methods.
     * The default returns `connection.getCatalog()`. If NewDB does not support Catalog, return `null`.
     */
    @Override
    protected String getCatalogName(Connection conn) throws SQLException {
        // return conn.getCatalog(); // Or return null;
    }

    /**
     * [Optional override] Get column definitions.
     * The default implementation is usually enough, but for some databases (such as MySQL), you may need to execute a SHOW or SELECT query
     * to get more precise type information (for example, to distinguish `TINYINT(1)` from `TINYINT`).
     */
    @Override
    public List<JdbcFieldSchema> getJdbcColumnsInfo(String remoteDbName, String remoteTableName) {
        return super.getJdbcColumnsInfo(remoteDbName, remoteTableName);
    }
}
```

### 5.2 Register `JdbcNewDBClient` in the Factory Class

Modify `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcClient.java` so that the factory method returns a `JdbcNewDBClient` instance based on `TOdbcTableType`.

---

## 6. Step 4 - Adapt the FE Query Plan JdbcScanNode

In the `JdbcScanNode.getJdbcQueryStr()` method, add the specific `LIMIT` clause generation logic for NewDB. The example below shows three typical branches: MSSQL (`TOP n`), the standard `LIMIT`, and `FETCH FIRST n ROWS ONLY`:

```java
// doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/source/JdbcScanNode.java

private String getJdbcQueryStr() {
    // ...
    // MSSQL use select top to do top n
    if (shouldPushDownLimit() && jdbcType == TOdbcTableType.SQLSERVER) {
        sql.append("TOP " + limit + " ");
    }
    // ...
    sql.append(Joiner.on(", ").join(columns));
    sql.append(" FROM ").append(tableName);
    // ...
    // Other DataBase use limit do top n
    if (shouldPushDownLimit()
            && (jdbcType == TOdbcTableType.MYSQL
            || jdbcType == TOdbcTableType.POSTGRESQL
            /* Other databases that use the standard LIMIT */
            // If NewDB also uses the standard LIMIT, add it here
            )) {
        sql.append(" LIMIT ").append(limit);
    }
    if (shouldPushDownLimit() && jdbcType == TOdbcTableType.NEWDB) {
        // Example: if NewDB has a special LIMIT syntax such as 'FETCH FIRST n ROWS ONLY',
        // handle it separately here
        sql.append(" FETCH FIRST ").append(limit).append(" ROWS ONLY");
    }
    return sql.toString();
}
```

---

## 7. Step 5 - Implement the BE Data Executor JdbcExecutor

### 7.1 Core Logic for Data Reading

This step actually executes JDBC data read and write on the BE side through JNI. Create `NewDBJdbcExecutor.java` under the `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/` directory, and override the following key methods:

```java
// doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/NewDBJdbcExecutor.java

public class NewDBJdbcExecutor extends BaseJdbcExecutor {

    public NewDBJdbcExecutor(byte[] thriftParams) throws Exception {
        super(thriftParams);
    }

    /**
     * [Override as needed] Initialize the Java-side cache that holds a batch of data.
     *
     * @purpose This is a key performance optimization. It pre-allocates memory for the entire batch before iterating the ResultSet.
     *          This avoids creating objects repeatedly in the loop and significantly improves data read performance.
     * @implementation
     * 1. Iterate over each column.
     * 2. For most standard types, the best practice is to call `outputTable.getColumn(i).newObjectContainerArray(batchSizeNum)`.
     *    This creates a type-safe array container (such as Integer[], BigDecimal[], Long[], etc.) based on the Doris target type.
     * 3. For types that need special handling (for example, a type returned as a binary object by the JDBC Driver but that you only want to handle as a String),
     *    allocate a more generic container, such as `Object[]`.
     */
    @Override
    protected void initializeBlock(int columnCount, String[] replaceStringList, int batchSizeNum,
            VectorTable outputTable) {
        for (int i = 0; i < columnCount; ++i) {
            if (outputTable.getColumnType(i).getType() == Type.STRING) {
                block.add(new Object[batchSizeNum]);
            } else {
                block.add(outputTable.getColumn(i).newObjectContainerArray(batchSizeNum));
            }
        }
    }

    /**
     * [Must override] **Core method** - Get the data of a single column from the JDBC ResultSet.
     *
     * @param columnIndex The column index (starting from 0).
     * @param type The column type expected on the Doris side.
     * @return The Java object fetched and converted from the ResultSet.
     * @implementation
     * 1. Use `resultSet.getObject(columnIndex + 1, TargetClass.class)` to get the value; this is the safest way.
     * 2. `TargetClass.class` should match the Doris `type`. For example, `Type.INT` corresponds to `Integer.class`.
     * 3. You must handle `NULL` values correctly via `resultSet.wasNull()`.
     */
    @Override
    protected Object getColumnValue(int columnIndex, ColumnType type, String[] replaceStringList) throws SQLException {
        switch (type.getType()) {
            case INT:
                return resultSet.getObject(columnIndex + 1, Integer.class);
            case DATETIME:
                return resultSet.getObject(columnIndex + 1, LocalDateTime.class);
            // ... other types
            default:
                 return resultSet.getObject(columnIndex + 1);
        }
    }

    /**
     * [Must override] Provide an output converter for specific types.
     *
     * @purpose Do final processing on the value returned by `getColumnValue` before passing it to the C++ layer.
     *          Commonly used in scenarios that require specific formatting.
     * @implementation
     *   A common example is the `java.sql.Time` type. To preserve its microsecond precision, `getColumnValue`
     *   gets a `Time` object, and the converter formats it into the `HH:mm:ss.SSSSSS` string that Doris requires.
     *   Another example is converting a `byte[]` to a hex-display string.
     */
    @Override
    protected ColumnValueConverter getOutputConverter(ColumnType columnType, String replaceString) {
        if (columnType.getType() == ColumnType.Type.STRING) {
            // Example: how the MySQL Executor handles the Time type
            return createConverter(input -> {
                if (input instanceof java.sql.Time) {
                    return timeToString((java.sql.Time) input); // timeToString is a method in BaseJdbcExecutor
                }
                return input.toString();
            }, String.class);
        }
        return null; // Other types usually do not need conversion
    }

    /**
     * [Optional override] Initialize the PreparedStatement.
     *
     * @purpose Use this when you need to optimize the size and method of certain write or read operations.
     * @implementation
     * 1. You must handle read (READ) and write (WRITE) operations separately.
     * 2. For read operations, use `stmt.setFetchSize()` to control how many rows the JDBC Driver pulls from the database at one time.
     *    This avoids OOM. Different drivers behave differently for this parameter (for example, setting it to `Integer.MIN_VALUE` in MySQL enables streaming reads).
     */
    @Override
    protected void initializeStatement(Connection conn, JdbcDataSourceConfig config, String sql) throws SQLException {
        // if (config.getOp() == TJdbcOperation.READ) {
        //     stmt = conn.prepareStatement(sql, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
        //     stmt.setFetchSize(1024); // Set an appropriate fetch size for NewDB
        // } else {
        //     preparedStatement = conn.prepareStatement(sql);
        // }
    }

    /**
     * [Optional override] Interrupt the JDBC connection when the query is canceled.
     *
     * @purpose Override this if the driver of a data source has a special way to interrupt.
     * @implementation Call `connection.abort()` or another interrupt method provided by the driver.
     */
    @Override
    protected void abortReadConnection(Connection connection, ResultSet resultSet) throws SQLException {
        // connection.abort(MoreExecutors.directExecutor());
    }

    /**
     * [Override as needed] Set the validation query for the Hikari connection pool. The default is SELECT 1; override if the data source has a special syntax.
     *
     * @purpose Ensure that connections obtained from the pool are valid.
     */
    @Override
    protected void setValidationQuery(HikariDataSource ds) {
        // ds.setConnectionTestQuery("SELECT 1"); // Validation query for NewDB
    }

    /**
     * [Optional override] Set system properties specific to the JDBC Driver.
     *
     * @purpose Some drivers require `System.setProperty()` to enable or disable certain features.
     */
    @Override
    protected void setJdbcDriverSystemProperties() {
        // System.setProperty("newdb.driver.property", "true");
    }
}
```

### 7.2 Register `NewDBJdbcExecutor` in the Factory Class

Modify `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/JdbcExecutorFactory.java` so that the factory method returns a `NewDBJdbcExecutor` instance based on the data source type.

---

## 8. Step 6 - Add Regression Tests

Refer to `doris/regression-test/suites/external_table_p0/jdbc/type_test/select/test_mysql_all_types_select.groovy` to create a simple test case.

Create `test_newdb_select.groovy`:

```groovy
suite("test_newdb_select", "p0,external,newdb") {
    String enabled = context.config.otherConfigs.get("enableJdbcTest")
    if (enabled != null && enabled.equalsIgnoreCase("true")) {
        // 1. Define the connection information for NewDB
        def newdb_port = context.config.otherConfigs.get("newdb_port")
        def driver_url = "http://your_repo/newdb-driver.jar"

        // 2. Create the Catalog
        sql """create catalog newdb_catalog properties(
            "type"="jdbc",
            "user"="root",
            "password"="123456",
            "jdbc_url" = "jdbc:newdb://\${context.config.otherConfigs.get("externalEnvIp")}:\${newdb_port}/your_db",
            "driver_url" = "\${driver_url}",
            "driver_class" = "com.newdb.jdbc.Driver"
        );"""

        // 3. Run the test
        sql """use newdb_catalog.your_db"""
        qt_select """select * from your_table order by 1 limit 10;"""

        // 4. Clean up the environment
        sql """drop catalog newdb_catalog"""
    }
}
```

---

## 9. Development Notes

### 9.1 Data Type Mapping

<!-- Knowledge type: Configuration parameters -->

Handle the following carefully in the `jdbcTypeToDoris` method:

| Category | Focus |
|------|--------|
| Precision mapping | The `DECIMAL` type must map precision and scale correctly |
| Time types | Pay attention to time zone and precision handling |
| Special types | For example, some special binary types |

### 9.2 Data Reading for Specific Data Sources

In subclasses of `BaseJdbcExecutor`, focus on two methods:

| Method | Role |
|------|------|
| `getColumnValue` | How to get data from the JDBC ResultSet |
| `getOutputConverter` | Data conversion function that performs final formatting before handing data to the C++ layer |

### 9.3 Error Handling

- **SQL exception conversion**: Convert data source-specific exceptions to `JdbcClientException`.
- **Driver compatibility**: Handle compatibility issues across different driver versions.

### 9.4 Predicate and Function Pushdown (Optional Optimization)

To improve query performance, Doris pushes `WHERE` conditions and some functions down to the external data source whenever possible:

- **Predicate pushdown**: In most cases, Doris handles this automatically. But for special syntax (such as special date functions), you may need to adapt the `conjunctExprToString()` method in `JdbcScanNode.java`.
- **Function pushdown**: You can define the list of functions that NewDB supports for pushdown and the function name replacement rules in `JdbcFunctionPushDownRule.java` to achieve better performance.

---

## 10. Deployment Configuration

<!-- Knowledge type: Operation steps -->

### 10.1 Driver Deployment

```bash
# Place the NewDB JDBC driver in the specified directory
cp newdb-jdbc-driver.jar $DORIS_HOME/plugins/jdbc_drivers/
```

### 10.2 Create a Catalog

```sql
CREATE CATALOG newdb_catalog PROPERTIES (
    "type" = "jdbc",
    "user" = "newdb_user",
    "password" = "newdb_password",
    "jdbc_url" = "jdbc:newdb://host:port/database",
    "driver_url" = "newdb-jdbc-driver.jar",
    "driver_class" = "com.newdb.jdbc.Driver"
);

-- Use the Catalog
USE newdb_catalog.database_name;
SELECT * FROM table_name LIMIT 10;
```

---

## FAQ and Common Errors

<!-- Knowledge type: Troubleshooting -->

**Q: `SHOW DATABASES` does not return business databases and only shows system databases?**

A: Check whether the filter list in `getFilterInternalDatabases()` and `filterDatabaseNames()` is reasonable. Also confirm whether `getDatabaseNameList()` calls `getCatalogs()` or `getSchemas()`; this must be consistent with the metadata semantics of the data source.

**Q: Missing type mappings cause `Type.UNSUPPORTED` to appear?**

A: Add the corresponding branches in `jdbcTypeToDoris`. For composite types such as `DECIMAL`, remember to read `fieldSchema.getColumnSize()` and `getDecimalDigits()`.

**Q: Occasional OOM during queries?**

A: Use `stmt.setFetchSize()` in `initializeStatement` to control the number of rows fetched per round. For MySQL, you can use `Integer.MIN_VALUE` to enable streaming reads.

**Q: The connection is not released in time when the query is canceled?**

A: Override `abortReadConnection` and call `connection.abort()` or another interrupt method provided by the driver.

**Q: Creating a Catalog reports `Test query failed`?**

A: Override `getTestQuery()` to return the simplest query supported by the data source (for example, Oracle uses `SELECT 1 FROM DUAL`).
