---
{
    "title": "JDBC Catalog Developer Guide",
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

## 1. Overview

Apache Doris's JdbcCatalog provides access to external databases through the JDBC protocol.

This document provides detailed instructions on how to add support for a new data source type to JdbcCatalog, using the addition of **NewDB** data source as an example.

This document is for version 3.0+.

## 2. Architecture Overview
### 2.1 Overall Architecture

JdbcCatalog adopts a Frontend (FE) and Backend (BE) separated architecture:

* Frontend (FE): Responsible for metadata management, SQL parsing, query planning and optimization.
* Backend (BE): Responsible for data scanning, type conversion and execution.

### 2.2 Core Components

#### Frontend Core Components

* `JdbcResource`: Defines JDBC connection resources and parameters.
* `JdbcExternalCatalog`: Manages the entire Catalog, creates and manages JdbcClient.
* `JdbcExternalDatabase`: Manages database-level metadata.
* `JdbcExternalTable`: Manages table-level metadata and Schema.
* `JdbcClient`: Abstract base class that handles metadata operations (getting database list, table list, column information, etc.).
* `JdbcScanNode`: Scan node in query plan, responsible for generating query SQL.
* `JdbcTableSink`: Sink node in write plan.

#### Backend Core Components

* `vjdbc_connector.cpp`: C++ connector that calls Java executor through JNI. **(Developers do not need to modify this file)**
* `BaseJdbcExecutor`: Java executor abstract base class that handles data read/write operations.
* `JdbcExecutorFactory`: Factory class that creates corresponding executors based on data source type.

## 3. Development Steps for Adding New Data Source

### Step 1: Update Thrift Definition

1. Modify Thrift file

    In the `gensrc/thrift//Types.thrift` file, add new type to the `TOdbcTableType` enum:

2. Generate code

    Execute the script in the Doris root directory to make the new enum values effective in Java and C++ code:

### Step 2: Define Core Metadata in Frontend

1. Modify `JdbcResource.java`

    Add constants for NewDB's URL prefix and type name, and add recognition logic in the `parseDbType` method.

2. Modify `JdbcTable.java`

    Map NewDB type string to Thrift enum and define its SQL identifier reference style.

### Step 3: Implement Frontend Metadata Client (JdbcClient)

#### Core Logic for Metadata Interaction

This step is the core of metadata interaction with external data sources. You need to create a `JdbcNewDBClient.java` file in the `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/` directory and override the following key methods:

```java
// doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcNewDBClient.java

public class JdbcNewDBClient extends JdbcClient {

    public JdbcNewDBClient(JdbcClientConfig jdbcClientConfig) {
        super(jdbcClientConfig);
    }

    /**
     * [Must Override] Get database (or Schema) list.
     * 
     * @return List of database names.
     * @purpose This is the underlying implementation of the `SHOW DATABASES` command.
     * @implementation
     * 1. Get a JDBC Connection from the connection pool.
     * 2. Use `connection.getMetaData().getCatalogs()` or `getSchemas()` to get the list.
     * 3. Iterate through ResultSet and add database names to List<String>.
     * 4. Call `filterDatabaseNames()` to filter out system databases and non-compliant databases.
     */
    @Override
    public List<String> getDatabaseNameList() {
        // Implement logic to get all NewDB database names
    }

    /**
     * This is the underlying implementation of the `SHOW TABLES` command.
     * 
     * @param remoteDbName Database name.
     * @return List of table names.
     */
    @Override
    public List<String> getTablesNameList(String remoteDbName) {
        // Usually no need to override this method directly, but override processTable() that it calls internally
        return super.getTablesNameList(remoteDbName);
    }

    /**
     * [Must Override] Get table metadata.
     * 
     * @purpose Called by getTablesNameList() and isTableExist() methods,
     *          performs metadata lookup through `DatabaseMetaData.getTables()`.
     * @implementation
     * 1. Get JDBC Connection and DatabaseMetaData.
     * 2. Call `databaseMetaData.getTables(catalog, schemaPattern, tableNamePattern, types)`.
     * 3. The key is to pass correct values for `catalog` and `schemaPattern` parameters, which depends on NewDB's JDBC driver implementation.
     *    - If NewDB uses Catalog, pass `remoteDbName` for catalog and `null` for schemaPattern.
     *    - If NewDB uses Schema, pass `null` for catalog and `remoteDbName` for schemaPattern.
     */
    @Override
    protected void processTable(String remoteDbName, String remoteTableName, String[] tableTypes,
            Consumer<ResultSet> resultSetConsumer) {
        // Implement logic to call DatabaseMetaData.getTables()
    }

    /**
     * [Must Override] **Core Method** - Define mapping from NewDB types to Doris types.
     * 
     * @param fieldSchema Contains column information obtained from JDBC Driver, such as type name (getDataTypeName),
     *                    precision (getColumnSize), scale (getDecimalDigits), etc.
     * @return Corresponding Doris `Type`.
     */
    @Override
    public Type jdbcTypeToDoris(JdbcFieldSchema fieldSchema) {
        // Return Doris Type based on information in fieldSchema
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
     * [Recommended Override] Define system databases to filter out from `getDatabaseNameList` results.
     */
    @Override
    protected Set<String> getFilterInternalDatabases() {
        // return ImmutableSet.of("information_schema", "sys", "performance_schema", "newdb_system_db");
    }

    /**
     * [Recommended Override] Define the query statement used for connection testing.
     * Default is "SELECT 1", but some databases (like Oracle) need "SELECT 1 FROM DUAL".
     */
    @Override
    public String getTestQuery() {
        // return "SELECT 1"; // or simple query supported by NewDB
    }

    /**
     * [Optional Override] Define what value the catalog parameter should be when calling `DatabaseMetaData` related methods.
     * Default returns `connection.getCatalog()`. Should return `null` if NewDB doesn't support Catalog.
     */
    @Override
    protected String getCatalogName(Connection conn) throws SQLException {
        // return conn.getCatalog(); // or return null;
    }

    /**
     * [Optional Override] Get column definitions.
     * Default implementation is usually sufficient, but for some databases (like MySQL), you might need to execute a SHOW or SELECT query
     * to get more precise type information (e.g., distinguish between `TINYINT(1)` and `TINYINT`).
     */
    @Override
    public List<JdbcFieldSchema> getJdbcColumnsInfo(String remoteDbName, String remoteTableName) {
        return super.getJdbcColumnsInfo(remoteDbName, remoteTableName);
    }
}
```

#### Register `JdbcNewDBClient` in Factory Class

Modify `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcClient.java`:

### Step 4: Adapt Frontend Query Planning (JdbcScanNode)

In the `getJdbcQueryStr()` method, add specific `LIMIT` clause generation logic for NewDB.

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
            /* Other databases using standard LIMIT */
            // Add here if NewDB also uses standard LIMIT
            )) {
        sql.append(" LIMIT ").append(limit);
    }
    if (shouldPushDownLimit() && jdbcType == TOdbcTableType.NEWDB) {
        // Example: If NewDB has special LIMIT syntax, e.g., 'FETCH FIRST n ROWS ONLY'
        // Handle independently here
        sql.append(" FETCH FIRST ").append(limit).append(" ROWS ONLY");
    }
    return sql.toString();
}
```

### Step 5: Implement Backend Data Executor (JdbcExecutor)

#### Core Logic for Data Reading

This step is the core of actually executing JDBC data read/write through JNI on the BE side. You need to create a `NewDBJdbcExecutor.java` file in the `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/` directory and override the following key methods:

```java
// doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/NewDBJdbcExecutor.java

public class NewDBJdbcExecutor extends BaseJdbcExecutor {

    public NewDBJdbcExecutor(byte[] thriftParams) throws Exception {
        super(thriftParams);
    }

    /**
     * [Override as needed] Initialize Java-side cache for storing a batch of data.
     *
     * @purpose This is a key performance optimization. It pre-allocates memory for the entire batch of data before starting to iterate through the ResultSet.
     *          This avoids repeated object creation in loops, significantly improving data reading performance.
     * @implementation
     * 1. Iterate through each column.
     * 2. For most standard types, best practice is to call `outputTable.getColumn(i).newObjectContainerArray(batchSizeNum)`.
     *    This creates a type-safe array container based on Doris target type (like Integer[], BigDecimal[], Long[], etc.).
     * 3. For types needing special handling (e.g., a binary object returned by JDBC Driver but we only want to treat as String),
     *    allocate a more generic container like `Object[]`.
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
     * [Must Override] **Core Method** - Get single column data from JDBC ResultSet.
     * 
     * @param columnIndex Column index (starting from 0).
     * @param type Expected column type on Doris side.
     * @return Java object retrieved and converted from ResultSet.
     * @implementation
     * 1. Use `resultSet.getObject(columnIndex + 1, TargetClass.class)` to get value, this is the safest way.
     * 2. `TargetClass.class` should match Doris `type`, e.g., `Type.INT` corresponds to `Integer.class`.
     * 3. Must handle `NULL` values correctly through `resultSet.wasNull()`.
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
     * [Must Override] Provide output converter for specific types.
     * 
     * @purpose Perform final processing on values obtained by `getColumnValue` before passing to C++ layer.
     *          Commonly used for scenarios requiring specific formatting.
     * @implementation
     *   A common example is `java.sql.Time` type. To preserve its microsecond precision, `getColumnValue` 
     *   gets the `Time` object, while the converter formats it to the `HH:mm:ss.SSSSSS` string required by Doris.
     *   Another example is converting `byte[]` type to hexadecimal display string.
     */
    @Override
    protected ColumnValueConverter getOutputConverter(ColumnType columnType, String replaceString) {
        if (columnType.getType() == ColumnType.Type.STRING) {
            // Example: Time type handling in MySQL Executor
            return createConverter(input -> {
                if (input instanceof java.sql.Time) {
                    return timeToString((java.sql.Time) input); // timeToString is a method in BaseJdbcExecutor
                }
                return input.toString();
            }, String.class);
        }
        return null; // Other types usually don't need conversion
    }

    /**
     * [Optional Override] Initialize PreparedStatement.
     * 
     * @purpose If optimization of certain write/read sizes and methods is needed
     * @implementation
     * 1. Must handle read operations (READ) and write operations (WRITE) separately.
     * 2. For read operations, control how many rows the JDBC Driver fetches from database at once through `stmt.setFetchSize()`.
     *    This can avoid OOM. Different Drivers behave differently with this parameter (e.g., MySQL setting to `Integer.MIN_VALUE` enables streaming read).
     */
    @Override
    protected void initializeStatement(Connection conn, JdbcDataSourceConfig config, String sql) throws SQLException {
        // if (config.getOp() == TJdbcOperation.READ) {
        //     stmt = conn.prepareStatement(sql, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
        //     stmt.setFetchSize(1024); // Set appropriate fetch size for NewDB
        // } else {
        //     preparedStatement = conn.prepareStatement(sql);
        // }
    }
    
    /**
     * [Optional Override] Interrupt JDBC connection when query is cancelled.
     * 
     * @purpose If certain data source Driver has special interruption method, need to override here
     * @implementation Call `connection.abort()` or other interruption methods provided by Driver.
     */
    @Override
    protected void abortReadConnection(Connection connection, ResultSet resultSet) throws SQLException {
        // connection.abort(MoreExecutors.directExecutor());
    }

    /**
     * [Override as needed] Set validation query for Hikari connection pool, default is SELECT 1, override if data source has special syntax
     * 
     * @purpose Ensure connections obtained from pool are valid.
     */
    @Override
    protected void setValidationQuery(HikariDataSource ds) {
        // ds.setConnectionTestQuery("SELECT 1"); // NewDB validation query
    }

    /**
     * [Optional Override] Set JDBC Driver specific system properties.
     * 
     * @purpose Some Drivers need to enable or disable certain features through `System.setProperty()`.
     */
    @Override
    protected void setJdbcDriverSystemProperties() {
        // System.setProperty("newdb.driver.property", "true");
    }
}
```



#### Register `NewDBJdbcExecutor` in Factory Class

Modify `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/JdbcExecutorFactory.java`:

### Step 6: Add Regression Tests

Refer to `doris/regression-test/suites/external_table_p0/jdbc/type_test/select/test_mysql_all_types_select.groovy` to create a simple test case.

* Create `test_newdb_select.groovy`

  ```groovy
  suite("test_newdb_select", "p0,external,newdb") {
      String enabled = context.config.otherConfigs.get("enableJdbcTest")
      if (enabled != null && enabled.equalsIgnoreCase("true")) {
          // 1. Define NewDB connection information
          def newdb_port = context.config.otherConfigs.get("newdb_port")
          def driver_url = "http://your_repo/newdb-driver.jar"

          // 2. Create Catalog
          sql """create catalog newdb_catalog properties(
              "type"="jdbc",
              "user"="root",
              "password"="123456",
              "jdbc_url" = "jdbc:newdb://\${context.config.otherConfigs.get("externalEnvIp")}:\${newdb_port}/your_db",
              "driver_url" = "\${driver_url}",
              "driver_class" = "com.newdb.jdbc.Driver"
          );"""

          // 3. Execute tests
          sql """use newdb_catalog.your_db"""
          qt_select """select * from your_table order by 1 limit 10;"""

          // 4. Clean up environment
          sql """drop catalog newdb_catalog"""
      }
  }
  ```

## 4. Development Considerations

### 4.1 Data Type Mapping

In the `jdbcTypeToDoris` method, careful handling is needed for:

* Precision mapping: `DECIMAL` types need correct precision and scale mapping.
* Time types: Pay attention to timezone and precision handling.
* Special types: Such as some binary special types

### 4.2 Data Source Specific Data Reading

In subclasses of `BaseJdbcExecutor`, focus on:

* `getColumnValue`: How to get data
* `getOutputConverter`: Data conversion function

### 4.3 Error Handling

* SQL exception conversion: Convert data source specific exceptions to `JdbcClientException`.
* Driver compatibility: Handle compatibility issues with different driver versions.

### 4.4 Predicate and Function Pushdown (Optional Optimization)

To improve query performance, Doris will push down `WHERE` conditions and some functions to external data sources for execution whenever possible.

* Predicate pushdown: In most scenarios, Doris handles this automatically. But for special syntax (like special date functions), adaptation might be needed in the `conjunctExprToString()` method of `JdbcScanNode.java`.
* Function pushdown: You can define the list of functions that NewDB supports for pushdown and function name replacement rules in `JdbcFunctionPushDownRule.java` for better performance.

## 5. Deployment Configuration

### 5.1 Driver Deployment

```bash
# Put NewDB JDBC driver in the specified directory
cp newdb-jdbc-driver.jar $DORIS_HOME/plugins/jdbc_drivers/
```

### 5.2 Create Catalog

```sql
CREATE CATALOG newdb_catalog PROPERTIES (
    "type" = "jdbc",
    "user" = "newdb_user",
    "password" = "newdb_password",
    "jdbc_url" = "jdbc:newdb://host:port/database",
    "driver_url" = "newdb-jdbc-driver.jar",
    "driver_class" = "com.newdb.jdbc.Driver"
);

-- Use Catalog
USE newdb_catalog.database_name;
SELECT * FROM table_name LIMIT 10;
```
