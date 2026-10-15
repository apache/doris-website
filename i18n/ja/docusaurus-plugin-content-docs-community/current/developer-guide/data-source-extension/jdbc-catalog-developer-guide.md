---
title: JDBC Catalog データソース拡張開発者ガイド
language: ja
description: "Apache Doris JDBC Catalog に新しいデータソースを追加する方法。FE 側の実装、BE 側のマッピング、回帰テストケースを説明します。"
keywords:
    - Apache Doris JDBC Catalog
    - データソースの拡張
    - JdbcClient
    - JdbcExecutor
    - メタデータのマッピング
    - jdbcTypeToDoris
    - getColumnValue
    - 述語のプッシュダウン
    - 関数のプッシュダウン
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

# JDBC Catalog データソース拡張開発者ガイド {#jdbc-catalog-data-source-extension-developer-guide}

このドキュメントは、Apache Doris JDBC Catalog に新しいデータソースを追加するカーネル開発者向けです。FE 層と BE 層で変更するクラス、主要なメソッドシグネチャ、回帰テストの規約について説明します。以下の例では、**NewDB** という新しいデータソースを追加します。

> 対象バージョン: Apache Doris 3.0 以降。

## 目次 {#contents}

- [1. 全体アーキテクチャ](#1-overall-architecture): FE と BE の役割と主要コンポーネント
- [2. 開発手順の概要](#2-development-steps-overview): 六つの手順をまとめた表
- [3. 手順 1 - Thrift 定義の更新](#3-step-1---update-the-thrift-definition)
- [4. 手順 2 - FE での基本メタデータの定義](#4-step-2---define-core-metadata-in-fe)
- [5. 手順 3 - FE メタデータクライアント JdbcClient の実装](#5-step-3---implement-the-fe-metadata-client-jdbcclient)
- [6. 手順 4 - FE クエリプラン JdbcScanNode の調整](#6-step-4---adapt-the-fe-query-plan-jdbcscannode)
- [7. 手順 5 - BE データエグゼキュータ JdbcExecutor の実装](#7-step-5---implement-the-be-data-executor-jdbcexecutor)
- [8. 手順 6 - 回帰テストの追加](#8-step-6---add-regression-tests)
- [9. 開発時の注意事項](#9-development-notes): 型のマッピング、エラー処理、述語と関数のプッシュダウン
- [10. デプロイ設定](#10-deployment-configuration): ドライバーの配置と `CREATE CATALOG` の例

---

## 1. 全体アーキテクチャ {#1-overall-architecture}

<!-- Knowledge type: Architecture decision -->

JdbcCatalog は、Frontend (FE) と Backend (BE) の役割を分けたアーキテクチャを採用しています。

| 層 | 役割 |
|----|------|
| Frontend (FE) | メタデータ管理、SQL 解析、クエリプランニング、最適化 |
| Backend (BE)  | データスキャン、型変換、実行 |

### FE の主要コンポーネント {#fe-core-components}

| コンポーネント | 役割 |
|------|------|
| `JdbcResource` | JDBC 接続リソースとパラメータを定義する |
| `JdbcExternalCatalog` | Catalog 全体を管理し、`JdbcClient` を作成・管理する |
| `JdbcExternalDatabase` | データベース単位のメタデータを管理する |
| `JdbcExternalTable` | テーブル単位のメタデータとスキーマを管理する |
| `JdbcClient` | データベース一覧、テーブル一覧、列情報などのメタデータ操作を処理する抽象基底クラス |
| `JdbcScanNode` | クエリ SQL の生成を担当する、クエリプラン内のスキャンノード |
| `JdbcTableSink` | 書き込みプラン内のシンクノード |

### BE の主要コンポーネント {#be-core-components}

| コンポーネント | 役割 |
|------|------|
| `vjdbc_connector.cpp` | JNI を介して Java エグゼキュータを呼び出す C++ コネクタ。**開発者がこのファイルを変更する必要はありません。** |
| `BaseJdbcExecutor` | データの読み書きを処理する Java エグゼキュータの抽象基底クラス |
| `JdbcExecutorFactory` | データソースの種類に応じたエグゼキュータを作成するファクトリクラス |

---

## 2. 開発手順の概要 {#2-development-steps-overview}

<!-- Knowledge type: Operation steps -->

| 手順 | 目的 | 対象ファイル |
|------|------|----------|
| 手順 1 | 新しいデータソースの種類を登録する | `gensrc/thrift/Types.thrift` |
| 手順 2 | FE 側で URL と種類を認識する | `JdbcResource.java`, `JdbcTable.java` |
| 手順 3 | メタデータクライアントを実装する | `JdbcNewDBClient.java`, `JdbcClient.java` (ファクトリへの登録) |
| 手順 4 | クエリプランを調整する | `JdbcScanNode.java` |
| 手順 5 | BE 側のデータエグゼキュータを実装する | `NewDBJdbcExecutor.java`, `JdbcExecutorFactory.java` |
| 手順 6 | 回帰テストを追加する | `regression-test/suites/external_table_p0/jdbc/...` |

---

## 3. 手順 1 - Thrift 定義の更新 {#3-step-1---update-the-thrift-definition}

1. **Thrift ファイルの変更**: `gensrc/thrift/Types.thrift` の `TOdbcTableType` enum に新しい種類を追加します。

2. **コードの生成**: Doris のルートディレクトリでスクリプトを実行し、新しい enum 値を Java と C++ のコードに反映します。

---

## 4. 手順 2 - FE での基本メタデータの定義 {#4-step-2---define-core-metadata-in-fe}

1. **`JdbcResource.java` の変更**: NewDB の URL プレフィックスと種類名の定数を追加し、`parseDbType` メソッドに識別ロジックを追加します。

2. **`JdbcTable.java` の変更**: NewDB の種類を表す文字列を Thrift enum に対応付け、SQL 識別子の引用方法（識別子の引用符など）を定義します。

---

## 5. 手順 3 - FE メタデータクライアント JdbcClient の実装 {#5-step-3---implement-the-fe-metadata-client-jdbcclient}

### 5.1 メタデータ操作の主要ロジック {#51-core-logic-for-metadata-interaction}

この手順では、外部データソースとのメタデータ操作の中心となる部分を実装します。`JdbcNewDBClient.java` を `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/` ディレクトリに作成し、次の主要メソッドをオーバーライドします。

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

### 5.2 ファクトリクラスへの `JdbcNewDBClient` の登録 {#52-register-jdbcnewdbclient-in-the-factory-class}

`doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcClient.java` を変更し、ファクトリメソッドが `JdbcNewDBClient` のインスタンスを `TOdbcTableType` に応じて返すようにします。

---

## 6. 手順 4 - FE クエリプラン JdbcScanNode の調整 {#6-step-4---adapt-the-fe-query-plan-jdbcscannode}

`JdbcScanNode.getJdbcQueryStr()` メソッドに、NewDB 固有の `LIMIT` 句を生成するロジックを追加します。以下の例は、MSSQL (`TOP n`)、標準的な `LIMIT`、`FETCH FIRST n ROWS ONLY` という三つの典型的な分岐を示しています。

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

## 7. 手順 5 - BE データエグゼキュータ JdbcExecutor の実装 {#7-step-5---implement-the-be-data-executor-jdbcexecutor}

### 7.1 データ読み取りの主要ロジック {#71-core-logic-for-data-reading}

この手順では、JNI を介して BE 側で JDBC データの読み書きを実行します。`NewDBJdbcExecutor.java` を `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/` ディレクトリに作成し、次の主要メソッドをオーバーライドします。

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

### 7.2 ファクトリクラスへの `NewDBJdbcExecutor` の登録 {#72-register-newdbjdbcexecutor-in-the-factory-class}

`doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/JdbcExecutorFactory.java` を変更し、ファクトリメソッドがデータソースの種類に応じて `NewDBJdbcExecutor` のインスタンスを返すようにします。

---

## 8. 手順 6 - 回帰テストの追加 {#8-step-6---add-regression-tests}

`doris/regression-test/suites/external_table_p0/jdbc/type_test/select/test_mysql_all_types_select.groovy` を参考に、簡単なテストケースを作成します。

`test_newdb_select.groovy` を作成します。

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

## 9. 開発時の注意事項 {#9-development-notes}

### 9.1 データ型のマッピング {#91-data-type-mapping}

<!-- Knowledge type: Configuration parameters -->

`jdbcTypeToDoris` メソッドでは、次の点に注意してください。

| 項目 | 注意点 |
|------|--------|
| 精度のマッピング | `DECIMAL` 型の精度とスケールを正しく対応付ける |
| 時刻型 | タイムゾーンと精度の扱いに注意する |
| 特殊な型 | 特殊なバイナリ型などに注意する |

### 9.2 データソースごとのデータ読み取り {#92-data-reading-for-specific-data-sources}

`BaseJdbcExecutor` のサブクラスでは、次の二つのメソッドに注目してください。

| メソッド | 役割 |
|------|------|
| `getColumnValue` | JDBC ResultSet からデータを取得する方法を定義する |
| `getOutputConverter` | データを C++ 層に渡す前に最終的な書式変換を行う関数 |

### 9.3 エラー処理 {#93-error-handling}

- **SQL 例外の変換**: データソース固有の例外を `JdbcClientException` に変換します。
- **ドライバーの互換性**: ドライバーのバージョン間で発生する互換性の問題に対処します。

### 9.4 述語と関数のプッシュダウン（任意の最適化） {#94-predicate-and-function-pushdown-optional-optimization}

クエリ性能を高めるため、Doris は可能な限り `WHERE` 条件と一部の関数を外部データソースにプッシュダウンします。

- **述語のプッシュダウン**: ほとんどの場合、Doris が自動的に処理します。ただし、特殊な構文（特殊な日付関数など）については、`conjunctExprToString()` メソッド（`JdbcScanNode.java` 内）を調整する必要がある場合があります。
- **関数のプッシュダウン**: 性能を高めるため、`JdbcFunctionPushDownRule.java` で NewDB がプッシュダウンに対応する関数の一覧と、関数名の置換ルールを定義できます。

---

## 10. デプロイ設定 {#10-deployment-configuration}

<!-- Knowledge type: Operation steps -->

### 10.1 ドライバーの配置 {#101-driver-deployment}

```bash
# Place the NewDB JDBC driver in the specified directory
cp newdb-jdbc-driver.jar $DORIS_HOME/plugins/jdbc_drivers/
```

### 10.2 Catalog の作成 {#102-create-a-catalog}

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

## FAQ とよくあるエラー {#faq-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

**Q: `SHOW DATABASES` で業務用データベースが返らず、システムデータベースだけが表示される場合は？**

A: `getFilterInternalDatabases()` と `filterDatabaseNames()` のフィルター一覧が適切か確認してください。また、`getDatabaseNameList()` が `getCatalogs()` と `getSchemas()` のどちらを呼び出しているかを確認してください。データソースのメタデータの意味付けと一致している必要があります。

**Q: 型のマッピングが不足していて `Type.UNSUPPORTED` が表示される場合は？**

A: `jdbcTypeToDoris` に該当する分岐を追加してください。`DECIMAL` のような複合型では、`fieldSchema.getColumnSize()` と `getDecimalDigits()` の値を読み取ってください。

**Q: クエリ中に OOM が時折発生する場合は？**

A: `stmt.setFetchSize()` を `initializeStatement` で使い、一回に取得する行数を制御してください。MySQL では、`Integer.MIN_VALUE` を指定するとストリーミング読み取りを有効にできます。

**Q: クエリのキャンセル時に接続が速やかに解放されない場合は？**

A: `abortReadConnection` をオーバーライドし、`connection.abort()` またはドライバーが提供する別の中断メソッドを呼び出してください。

**Q: Catalog の作成時に `Test query failed` と表示される場合は？**

A: `getTestQuery()` をオーバーライドし、データソースがサポートする最も簡単なクエリを返してください（たとえば、Oracle では `SELECT 1 FROM DUAL` を使用します）。
