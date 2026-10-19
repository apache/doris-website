---
title: JDBC Catalog 데이터 소스 확장 개발자 가이드
language: ko
description: "Apache Doris JDBC Catalog에 새 데이터 소스를 추가하는 방법: FE 측 구현, BE 측 매핑 및 회귀 테스트 케이스."
keywords:
    - Apache Doris JDBC Catalog
    - 데이터 소스 확장
    - JdbcClient
    - JdbcExecutor
    - 메타데이터 매핑
    - jdbcTypeToDoris
    - getColumnValue
    - 조건자 푸시다운
    - 함수 푸시다운
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

# JDBC Catalog 데이터 소스 확장 개발자 가이드 {#jdbc-catalog-data-source-extension-developer-guide}

이 문서는 Apache Doris JDBC Catalog에 새 데이터 소스를 추가하려는 커널 개발자를 위한 가이드입니다. FE와 BE 계층에서 수정해야 할 클래스, 주요 메서드 시그니처, 회귀 테스트 작성 규칙을 설명합니다. 아래 예제에서는 **NewDB**라는 새 데이터 소스를 추가합니다.

> 적용 버전: Apache Doris 3.0 이상.

## 목차 {#contents}

- [1. 전체 아키텍처](#1-overall-architecture): FE와 BE의 담당 기능 및 핵심 구성 요소
- [2. 개발 단계 개요](#2-development-steps-overview): 여섯 단계로 정리한 표
- [3. 1단계 - Thrift 정의 업데이트](#3-step-1---update-the-thrift-definition)
- [4. 2단계 - FE의 핵심 메타데이터 정의](#4-step-2---define-core-metadata-in-fe)
- [5. 3단계 - FE 메타데이터 클라이언트 JdbcClient 구현](#5-step-3---implement-the-fe-metadata-client-jdbcclient)
- [6. 4단계 - FE 쿼리 계획 JdbcScanNode 조정](#6-step-4---adapt-the-fe-query-plan-jdbcscannode)
- [7. 5단계 - BE 데이터 실행기 JdbcExecutor 구현](#7-step-5---implement-the-be-data-executor-jdbcexecutor)
- [8. 6단계 - 회귀 테스트 추가](#8-step-6---add-regression-tests)
- [9. 개발 시 유의 사항](#9-development-notes): 타입 매핑, 오류 처리, 조건자 및 함수 푸시다운
- [10. 배포 설정](#10-deployment-configuration): 드라이버 배치 및 `CREATE CATALOG` 예제

---

## 1. 전체 아키텍처 {#1-overall-architecture}

<!-- Knowledge type: Architecture decision -->

JdbcCatalog는 Frontend (FE)와 Backend (BE)를 분리하는 아키텍처를 사용합니다.

| 계층 | 담당 기능 |
|----|------|
| Frontend (FE) | 메타데이터 관리, SQL 파싱, 쿼리 계획 수립 및 최적화 |
| Backend (BE)  | 데이터 스캔, 타입 변환 및 실행 |

### FE 핵심 구성 요소 {#fe-core-components}

| 구성 요소 | 역할 |
|------|------|
| `JdbcResource` | JDBC 연결 리소스와 매개변수를 정의합니다 |
| `JdbcExternalCatalog` | Catalog 전체를 관리하고 `JdbcClient`를 생성하고 관리합니다 |
| `JdbcExternalDatabase` | 데이터베이스 수준의 메타데이터를 관리합니다 |
| `JdbcExternalTable` | 테이블 수준의 메타데이터와 스키마를 관리합니다 |
| `JdbcClient` | 메타데이터 작업(데이터베이스 목록, 테이블 목록, 컬럼 정보 등)을 처리하는 추상 기본 클래스입니다 |
| `JdbcScanNode` | 쿼리 계획의 스캔 노드로, 쿼리 SQL 생성을 담당합니다 |
| `JdbcTableSink` | 쓰기 계획의 싱크 노드입니다 |

### BE 핵심 구성 요소 {#be-core-components}

| 구성 요소 | 역할 |
|------|------|
| `vjdbc_connector.cpp` | JNI를 통해 Java 실행기를 호출하는 C++ 커넥터입니다. **개발자는 이 파일을 수정할 필요가 없습니다.** |
| `BaseJdbcExecutor` | Java 실행기의 추상 기본 클래스로, 데이터 읽기 및 쓰기 작업을 처리합니다 |
| `JdbcExecutorFactory` | 데이터 소스 유형에 따라 해당 실행기를 생성하는 팩터리 클래스입니다 |

---

## 2. 개발 단계 개요 {#2-development-steps-overview}

<!-- Knowledge type: Operation steps -->

| 단계 | 목표 | 관련 파일 |
|------|------|----------|
| 1단계 | 새 데이터 소스 유형 등록 | `gensrc/thrift/Types.thrift` |
| 2단계 | FE 측에서 URL 및 유형 인식 | `JdbcResource.java`, `JdbcTable.java` |
| 3단계 | 메타데이터 클라이언트 구현 | `JdbcNewDBClient.java`, `JdbcClient.java` (팩터리 등록) |
| 4단계 | 쿼리 계획 조정 | `JdbcScanNode.java` |
| 5단계 | BE 측 데이터 실행기 구현 | `NewDBJdbcExecutor.java`, `JdbcExecutorFactory.java` |
| 6단계 | 회귀 테스트 추가 | `regression-test/suites/external_table_p0/jdbc/...` |

---

## 3. 1단계 - Thrift 정의 업데이트 {#3-step-1---update-the-thrift-definition}

1. **Thrift 파일 수정**: `gensrc/thrift/Types.thrift`의 `TOdbcTableType` 열거형에 새 유형을 추가합니다.

2. **코드 생성**: Doris 루트 디렉터리에서 스크립트를 실행하여 Java 및 C++ 코드에 새 열거형 값이 반영되도록 합니다.

---

## 4. 2단계 - FE의 핵심 메타데이터 정의 {#4-step-2---define-core-metadata-in-fe}

1. **`JdbcResource.java` 수정**: NewDB URL 접두사와 유형 이름을 나타내는 상수를 추가하고, `parseDbType` 메서드에 인식 로직을 추가합니다.

2. **`JdbcTable.java` 수정**: NewDB 유형 문자열을 Thrift 열거형에 매핑하고, SQL 식별자의 인용 방식(예: 식별자 인용 문자)을 정의합니다.

---

## 5. 3단계 - FE 메타데이터 클라이언트 JdbcClient 구현 {#5-step-3---implement-the-fe-metadata-client-jdbcclient}

### 5.1 메타데이터 상호작용의 핵심 로직 {#51-core-logic-for-metadata-interaction}

이 단계는 외부 데이터 소스와 메타데이터를 주고받는 핵심 부분입니다. `JdbcNewDBClient.java`를 `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/` 디렉터리에 생성하고 다음 주요 메서드를 재정의합니다.

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

### 5.2 팩터리 클래스에 `JdbcNewDBClient` 등록 {#52-register-jdbcnewdbclient-in-the-factory-class}

`doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcClient.java`를 수정하여 팩터리 메서드가 반환할 `JdbcNewDBClient` 인스턴스를 `TOdbcTableType`에 따라 선택하도록 합니다.

---

## 6. 4단계 - FE 쿼리 계획 JdbcScanNode 조정 {#6-step-4---adapt-the-fe-query-plan-jdbcscannode}

`JdbcScanNode.getJdbcQueryStr()` 메서드에 NewDB에 맞는 `LIMIT` 절 생성 로직을 추가합니다. 아래 예제는 대표적인 세 가지 분기인 MSSQL의 `TOP n`, 표준 `LIMIT`, `FETCH FIRST n ROWS ONLY`를 보여 줍니다.

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

## 7. 5단계 - BE 데이터 실행기 JdbcExecutor 구현 {#7-step-5---implement-the-be-data-executor-jdbcexecutor}

### 7.1 데이터 읽기의 핵심 로직 {#71-core-logic-for-data-reading}

이 단계에서는 JNI를 통해 BE 측에서 JDBC 데이터 읽기 및 쓰기를 실제로 실행합니다. `NewDBJdbcExecutor.java`를 `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/` 디렉터리에 생성하고 다음 주요 메서드를 재정의합니다.

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

### 7.2 팩터리 클래스에 `NewDBJdbcExecutor` 등록 {#72-register-newdbjdbcexecutor-in-the-factory-class}

`doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/JdbcExecutorFactory.java`를 수정하여 팩터리 메서드가 데이터 소스 유형에 따라 해당 `NewDBJdbcExecutor` 인스턴스를 반환하도록 합니다.

---

## 8. 6단계 - 회귀 테스트 추가 {#8-step-6---add-regression-tests}

`doris/regression-test/suites/external_table_p0/jdbc/type_test/select/test_mysql_all_types_select.groovy`를 참고하여 간단한 테스트 케이스를 작성합니다.

`test_newdb_select.groovy`를 생성합니다.

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

## 9. 개발 시 유의 사항 {#9-development-notes}

### 9.1 데이터 타입 매핑 {#91-data-type-mapping}

<!-- Knowledge type: Configuration parameters -->

`jdbcTypeToDoris` 메서드에서 다음 사항을 주의해서 처리합니다.

| 분류 | 중점 사항 |
|------|--------|
| 정밀도 매핑 | `DECIMAL` 타입의 정밀도와 스케일을 올바르게 매핑해야 합니다 |
| 시간 타입 | 시간대와 정밀도 처리에 주의합니다 |
| 특수 타입 | 예를 들어 일부 특수 바이너리 타입이 해당합니다 |

### 9.2 특정 데이터 소스의 데이터 읽기 {#92-data-reading-for-specific-data-sources}

`BaseJdbcExecutor`의 하위 클래스에서는 다음 두 메서드에 중점을 둡니다.

| 메서드 | 역할 |
|------|------|
| `getColumnValue` | JDBC ResultSet에서 데이터를 가져오는 방법을 정의합니다 |
| `getOutputConverter` | 데이터를 C++ 계층에 전달하기 전에 최종 형식 변환을 수행하는 데이터 변환 함수입니다 |

### 9.3 오류 처리 {#93-error-handling}

- **SQL 예외 변환**: 데이터 소스별 예외를 `JdbcClientException`으로 변환합니다.
- **드라이버 호환성**: 서로 다른 드라이버 버전 간의 호환성 문제를 처리합니다.

### 9.4 조건자 및 함수 푸시다운(선택적 최적화) {#94-predicate-and-function-pushdown-optional-optimization}

쿼리 성능을 개선하기 위해 Doris는 가능한 경우 `WHERE` 조건과 일부 함수를 외부 데이터 소스로 푸시다운합니다.

- **조건자 푸시다운**: 대부분의 경우 Doris가 자동으로 처리합니다. 하지만 특수 구문(예: 특수 날짜 함수)의 경우 `conjunctExprToString()` 메서드를 `JdbcScanNode.java`에서 조정해야 할 수 있습니다.
- **함수 푸시다운**: `JdbcFunctionPushDownRule.java`에 NewDB가 푸시다운을 지원하는 함수 목록과 함수 이름 대체 규칙을 정의하여 성능을 개선할 수 있습니다.

---

## 10. 배포 설정 {#10-deployment-configuration}

<!-- Knowledge type: Operation steps -->

### 10.1 드라이버 배포 {#101-driver-deployment}

```bash
# Place the NewDB JDBC driver in the specified directory
cp newdb-jdbc-driver.jar $DORIS_HOME/plugins/jdbc_drivers/
```

### 10.2 Catalog 생성 {#102-create-a-catalog}

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

## 자주 묻는 질문과 일반적인 오류 {#faq-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

**질문: `SHOW DATABASES`가 업무 데이터베이스를 반환하지 않고 시스템 데이터베이스만 표시하나요?**

답변: `getFilterInternalDatabases()`와 `filterDatabaseNames()`의 필터 목록이 적절한지 확인합니다. 또한 `getDatabaseNameList()`에서 `getCatalogs()`를 호출하는지, `getSchemas()`를 호출하는지 확인합니다. 이는 데이터 소스의 메타데이터 의미 체계와 일치해야 합니다.

**질문: 타입 매핑이 누락되어 `Type.UNSUPPORTED`가 표시되나요?**

답변: `jdbcTypeToDoris`에 해당 분기를 추가합니다. `DECIMAL`과 같은 복합 타입에서는 반드시 `fieldSchema.getColumnSize()`와 `getDecimalDigits()`를 읽어야 합니다.

**질문: 쿼리 중 간헐적으로 OOM이 발생하나요?**

답변: `stmt.setFetchSize()`를 `initializeStatement`에서 사용하여 한 번에 가져오는 행 수를 제어합니다. MySQL에서는 `Integer.MIN_VALUE`를 사용하여 스트리밍 읽기를 활성화할 수 있습니다.

**질문: 쿼리를 취소해도 연결이 제때 해제되지 않나요?**

답변: `abortReadConnection`을 재정의하고 `connection.abort()` 또는 드라이버가 제공하는 다른 중단 메서드를 호출합니다.

**질문: Catalog를 생성할 때 `Test query failed` 오류가 발생하나요?**

답변: `getTestQuery()`를 재정의하여 데이터 소스에서 지원하는 가장 간단한 쿼리를 반환하도록 합니다(예: Oracle은 `SELECT 1 FROM DUAL`을 사용합니다).
