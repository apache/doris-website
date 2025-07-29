---
{
    "title": "JDBC Catalog 开发指南",
    "language": "zh-CN"
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

## 1. 概述

Apache Doris 的 JdbcCatalog 通过 JDBC 协议为 Doris 提供对外部数据库的访问能力。

本文档详细介绍如何为 JdbcCatalog 新增一个数据源类型的支持，以新增 **NewDB** 数据源为例。

该文档适用于 3.0 以后的版本。

## 2. 架构概览
### 2.1 整体架构

JdbcCatalog 采用 Frontend (FE) 和 Backend (BE) 分离的架构：

* Frontend (FE): 负责元数据管理、SQL 解析、查询规划和优化。
* Backend (BE): 负责数据扫描、类型转换和执行。

### 2.2 核心组件

#### Frontend 核心组件

* `JdbcResource`: 定义 JDBC 连接资源和参数。
* `JdbcExternalCatalog`: 管理整个 Catalog，创建和管理 JdbcClient。
* `JdbcExternalDatabase`: 管理数据库级别的元数据。
* `JdbcExternalTable`: 管理表级别的元数据和 Schema。
* `JdbcClient`: 抽象基类，处理元数据操作（获取数据库列表、表列表、列信息等）。
* `JdbcScanNode`: 查询计划中的扫描节点，负责生成查询 SQL。
* `JdbcTableSink`: 写入计划中的 Sink 节点。

#### Backend 核心组件

* `vjdbc_connector.cpp`: C++ 连接器，通过 JNI 调用 Java 执行器。**（开发者无需修改此文件）**
* `BaseJdbcExecutor`: Java 执行器抽象基类，处理数据读写操作。
* `JdbcExecutorFactory`: 工厂类，根据数据源类型创建对应的执行器。

## 3. 新增数据源开发步骤

### Step 1: 更新 Thrift 定义

1. 修改 Thrift 文件

    在 `gensrc/thrift//Types.thrift` 文件中，为 `TOdbcTableType` 枚举添加新类型：

2. 生成代码

    在 Doris 根目录下执行脚本，使新的枚举值在 Java 和 C++ 代码中生效：

### Step 2: 在 Frontend 定义核心元数据

1. 修改 `JdbcResource.java`

    添加 NewDB 的 URL 前缀和类型名称的常量，并在 `parseDbType` 方法中加入识别逻辑。

2. 修改 `JdbcTable.java`

    将 NewDB 类型字符串映射到 Thrift 枚举，并定义其 SQL 标识符的引用方式。

### Step 3：实现 Frontend 的元数据客户端 (JdbcClient)

#### 元数据交互核心逻辑

这一步是与外部数据源进行元数据交互的核心。您需要在 `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/` 目录下创建 `JdbcNewDBClient.java` 文件，并重写以下关键方法：

```java
// doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcNewDBClient.java

public class JdbcNewDBClient extends JdbcClient {

    public JdbcNewDBClient(JdbcClientConfig jdbcClientConfig) {
        super(jdbcClientConfig);
    }

    /**
     * [必须重写] 获取数据库（或 Schema）列表。
     * 
     * @return 数据库名称列表。
     * @purpose 这是 `SHOW DATABASES` 命令的底层实现。
     * @implementation
     * 1. 从连接池获取一个 JDBC Connection。
     * 2. 使用 `connection.getMetaData().getCatalogs()` 或 `getSchemas()` 获取列表。
     * 3. 遍历 ResultSet，将数据库名添加到 List<String> 中。
     * 4. 调用 `filterDatabaseNames()` 过滤掉系统库和不符合规则的库。
     */
    @Override
    public List<String> getDatabaseNameList() {
        // 实现获取 NewDB 所有数据库名称的逻辑
    }

    /**
     * 这是 `SHOW TABLES` 命令的底层实现。
     * 
     * @param remoteDbName 数据库名。
     * @return 表名列表。
     */
    @Override
    public List<String> getTablesNameList(String remoteDbName) {
        // 通常不需要直接重写此方法，而是重写其内部调用的 processTable()
        return super.getTablesNameList(remoteDbName);
    }

    /**
     * [必须重写] 获取表的元数据。
     * 
     * @purpose 供 getTablesNameList() 和 isTableExist() 等方法调用，
     *          通过 `DatabaseMetaData.getTables()` 执行元数据查找。
     * @implementation
     * 1. 获取 JDBC Connection 和 DatabaseMetaData。
     * 2. 调用 `databaseMetaData.getTables(catalog, schemaPattern, tableNamePattern, types)`。
     * 3. 关键在于为 `catalog` 和 `schemaPattern` 参数传递正确的值，这取决于 NewDB 的 JDBC 驱动实现。
     *    - 如果 NewDB 使用 Catalog，catalog 传 `remoteDbName`，schemaPattern 传 `null`。
     *    - 如果 NewDB 使用 Schema，catalog 传 `null`，schemaPattern 传 `remoteDbName`。
     */
    @Override
    protected void processTable(String remoteDbName, String remoteTableName, String[] tableTypes,
            Consumer<ResultSet> resultSetConsumer) {
        // 实现调用 DatabaseMetaData.getTables() 的逻辑
    }

    /**
     * [必须重写] **核心方法** - 定义从 NewDB 类型到 Doris 类型的映射。
     * 
     * @param fieldSchema 包含了从 JDBC Driver 获取到的列信息，如类型名 (getDataTypeName)、
     *                    精度 (getColumnSize)、标度 (getDecimalDigits) 等。
     * @return 对应的 Doris `Type`。
     */
    @Override
    public Type jdbcTypeToDoris(JdbcFieldSchema fieldSchema) {
        // 根据 fieldSchema 中的信息，返回 Doris 的 Type
        // 例如：
        // String newdbType = fieldSchema.getDataTypeName().toUpperCase();
        // switch (newdbType) {
        //     case "VARCHAR": return ScalarType.createStringType();
        //     case "INTEGER": return Type.INT;
        //     case "DECIMAL":
        //         return ScalarType.createDecimalV3Type(fieldSchema.getColumnSize(), fieldSchema.getDecimalDigits());
        //     // ... 其他类型映射
        //     default: return Type.UNSUPPORTED;
        // }
    }
    
    /**
     * [建议重写] 定义需要从 `getDatabaseNameList` 结果中过滤掉的系统库。
     */
    @Override
    protected Set<String> getFilterInternalDatabases() {
        // return ImmutableSet.of("information_schema", "sys", "performance_schema", "newdb_system_db");
    }

    /**
     * [建议重写] 定义测试连接时使用的查询语句。
     * 默认是 "SELECT 1"，但某些数据库（如 Oracle）需要 "SELECT 1 FROM DUAL"。
     */
    @Override
    public String getTestQuery() {
        // return "SELECT 1"; // 或者 NewDB 支持的简单查询
    }

    /**
     * [可选重写] 定义在调用 `DatabaseMetaData` 相关方法时，catalog 参数应为何值。
     * 默认返回 `connection.getCatalog()`。如果 NewDB 不支持 Catalog，应返回 `null`。
     */
    @Override
    protected String getCatalogName(Connection conn) throws SQLException {
        // return conn.getCatalog(); // 或 return null;
    }

    /**
     * [可选重写] 获取列定义。
     * 默认实现通常够用，但对于某些数据库（如 MySQL），可能需要执行一个 SHOW 或 SELECT 查询
     * 来获取更精确的类型信息（例如区分 `TINYINT(1)` 和 `TINYINT`)。
     */
    @Override
    public List<JdbcFieldSchema> getJdbcColumnsInfo(String remoteDbName, String remoteTableName) {
        return super.getJdbcColumnsInfo(remoteDbName, remoteTableName);
    }
}
```

#### 在工厂类中注册 `JdbcNewDBClient`

修改 `doris/fe/fe-core/src/main/java/org/apache/doris/datasource/jdbc/client/JdbcClient.java`：

### Step 4：适配 Frontend 的查询计划 (JdbcScanNode)

在 `getJdbcQueryStr()` 方法中，为 NewDB 添加特定的 `LIMIT` 子句生成逻辑。

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
            /* 其他使用标准 LIMIT 的数据库 */
            // 如果 NewDB 也是标准 LIMIT，在此添加
            )) {
        sql.append(" LIMIT ").append(limit);
    }
    if (shouldPushDownLimit() && jdbcType == TOdbcTableType.NEWDB) {
        // 示例：如果 NewDB 有特殊的 LIMIT 语法，例如 'FETCH FIRST n ROWS ONLY'
        // 在这里独立处理
        sql.append(" FETCH FIRST ").append(limit).append(" ROWS ONLY");
    }
    return sql.toString();
}
```

### Step 5：实现 Backend 的数据执行器 (JdbcExecutor)

#### 数据读取核心逻辑

这一步是在 BE 端通过 JNI 实际执行 JDBC 数据读写的核心。您需要在 `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/` 目录下创建 `NewDBJdbcExecutor.java` 文件，并重写以下关键方法：

```java
// doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/NewDBJdbcExecutor.java

public class NewDBJdbcExecutor extends BaseJdbcExecutor {

    public NewDBJdbcExecutor(byte[] thriftParams) throws Exception {
        super(thriftParams);
    }

    /**
     * [按需重写] 初始化用于存放一批数据的 Java 端缓存。
     *
     * @purpose 这是一个关键的性能优化。它在开始迭代 ResultSet 之前，为整个批次的数据预先分配好内存。
     *          这避免了在循环中重复创建对象，从而显著提升了数据读取性能。
     * @implementation
     * 1. 遍历每一列。
     * 2. 对于大多数标准类型，最佳实践是调用 `outputTable.getColumn(i).newObjectContainerArray(batchSizeNum)`。
     *    这将根据 Doris 的目标类型创建一个类型安全的数组容器（如 Integer[], BigDecimal[], Long[] 等）。
     * 3. 对于需要特殊处理的类型（例如，一个由 JDBC Driver 返回二进制对象，但我们只想按 String 处理的类型），
     *    可以分配一个更通用的容器，如`Object[]`。
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
     * [必须重写] **核心方法** - 从 JDBC ResultSet 中获取单列数据。
     * 
     * @param columnIndex 列的索引（从 0 开始）。
     * @param type Doris 端期望的列类型。
     * @return 从 ResultSet 中获取并转换好的 Java 对象。
     * @implementation
     * 1. 使用 `resultSet.getObject(columnIndex + 1, TargetClass.class)` 获取值，这是最安全的方式。
     * 2. `TargetClass.class` 应与 Doris 的 `type` 相匹配，例如 `Type.INT` 对应 `Integer.class`。
     * 3. 必须通过 `resultSet.wasNull()` 正确处理 `NULL` 值。
     */
    @Override
    protected Object getColumnValue(int columnIndex, ColumnType type, String[] replaceStringList) throws SQLException {
        switch (type.getType()) {
            case INT:
                return resultSet.getObject(columnIndex + 1, Integer.class);
            case DATETIME:
                return resultSet.getObject(columnIndex + 1, LocalDateTime.class);
            // ... 其他类型
            default:
                 return resultSet.getObject(columnIndex + 1);
        }
    }
    
    /**
     * [必须重写] 为特定类型提供输出转换器。
     * 
     * @purpose 对 `getColumnValue` 获取到的值进行最终处理，然后再传递给 C++ 层。
     *          常用于需要特定格式化的场景。
     * @implementation
     *   一个常见的例子是 `java.sql.Time` 类型。为了保留其微秒精度，`getColumnValue` 
     *   获取 `Time` 对象，而转换器则负责将其格式化为 Doris 需要的 `HH:mm:ss.SSSSSS` 字符串。
     *   另一个例子是将 `byte[]` 类型转换为十六进制显示的字符串。
     */
    @Override
    protected ColumnValueConverter getOutputConverter(ColumnType columnType, String replaceString) {
        if (columnType.getType() == ColumnType.Type.STRING) {
            // 示例：MySQL Executor 中对 Time 类型的处理
            return createConverter(input -> {
                if (input instanceof java.sql.Time) {
                    return timeToString((java.sql.Time) input); // timeToString 是 BaseJdbcExecutor 中的一个方法
                }
                return input.toString();
            }, String.class);
        }
        return null; // 其他类型通常不需要转换
    }

    /**
     * [可选重写] 初始化 PreparedStatement。
     * 
     * @purpose 如果需要对某些写入读取的 size 和方式优化
     * @implementation
     * 1. 必须为读操作（READ）和写操作（WRITE）分别处理。
     * 2. 对于读操作，通过 `stmt.setFetchSize()` 控制 JDBC Driver 从数据库一次拉取多少行数据。
     *    这可以避免 OOM。不同的 Driver 对此参数的行为不同（例如，MySQL 设置为 `Integer.MIN_VALUE` 会开启流式读取）。
     */
    @Override
    protected void initializeStatement(Connection conn, JdbcDataSourceConfig config, String sql) throws SQLException {
        // if (config.getOp() == TJdbcOperation.READ) {
        //     stmt = conn.prepareStatement(sql, ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY);
        //     stmt.setFetchSize(1024); // 为 NewDB 设置合适的 fetch size
        // } else {
        //     preparedStatement = conn.prepareStatement(sql);
        // }
    }
    
    /**
     * [可选重写] 在查询取消时中断 JDBC 连接。
     * 
     * @purpose 如果某数据源的 Driver 有特殊的中断方式，需要在此重写
     * @implementation 调用 `connection.abort()` 或 Driver 提供的其他中断方法。
     */
    @Override
    protected void abortReadConnection(Connection connection, ResultSet resultSet) throws SQLException {
        // connection.abort(MoreExecutors.directExecutor());
    }

    /**
     * [按需重写] 为 Hikari 连接池设置验证查询，默认为 SELECT 1，如果数据源有特殊的语法，需重写
     * 
     * @purpose 确保从池中获取的连接是有效的。
     */
    @Override
    protected void setValidationQuery(HikariDataSource ds) {
        // ds.setConnectionTestQuery("SELECT 1"); // NewDB 的验证查询
    }

    /**
     * [可选重写] 设置 JDBC Driver 特定的系统属性。
     * 
     * @purpose 有些 Driver 需要通过 `System.setProperty()` 来开启或关闭某些功能。
     */
    @Override
    protected void setJdbcDriverSystemProperties() {
        // System.setProperty("newdb.driver.property", "true");
    }
}
```



#### 在工厂类中注册 `NewDBJdbcExecutor`

修改 `doris/fe/be-java-extensions/jdbc-scanner/src/main/java/org/apache/doris/jdbc/JdbcExecutorFactory.java`：

### Step 6：添加回归测试

参考 `doris/regression-test/suites/external_table_p0/jdbc/type_test/select/test_mysql_all_types_select.groovy` 创建一个简单的测试用例。

* 创建 `test_newdb_select.groovy`

  ```groovy
  suite("test_newdb_select", "p0,external,newdb") {
      String enabled = context.config.otherConfigs.get("enableJdbcTest")
      if (enabled != null && enabled.equalsIgnoreCase("true")) {
          // 1. 定义 NewDB 的连接信息
          def newdb_port = context.config.otherConfigs.get("newdb_port")
          def driver_url = "http://your_repo/newdb-driver.jar"

          // 2. 创建 Catalog
          sql """create catalog newdb_catalog properties(
              "type"="jdbc",
              "user"="root",
              "password"="123456",
              "jdbc_url" = "jdbc:newdb://\${context.config.otherConfigs.get("externalEnvIp")}:\${newdb_port}/your_db",
              "driver_url" = "\${driver_url}",
              "driver_class" = "com.newdb.jdbc.Driver"
          );"""

          // 3. 执行测试
          sql """use newdb_catalog.your_db"""
          qt_select """select * from your_table order by 1 limit 10;"""

          // 4. 清理环境
          sql """drop catalog newdb_catalog"""
      }
  }
  ```

## 4. 开发注意事项

### 4.1 数据类型映射

在 `jdbcTypeToDoris` 方法中，需要仔细处理：

* 精度映射：`DECIMAL` 类型需要正确映射精度和标度。
* 时间类型：注意时区和精度处理。
* 特殊类型：如一些二进制类的特殊类型

### 4.2 特定数据源数据读取

在 `BaseJdbcExecutor` 的子类中，重点关注：

* `getColumnValue`: 获取数据的方式
* `getOutputConverter`: 数据转换函数

### 4.3 错误处理

* SQL 异常转换：将数据源特定异常转换为 `JdbcClientException`。
* 驱动兼容性：处理不同驱动版本的兼容问题。

### 4.4 谓词与函数下推 (可选优化)

为提升查询性能，Doris 会尽可能将 `WHERE` 条件和部分函数下推到外部数据源执行。

* 谓词下推：大部分场景下，Doris 会自动处理。但对于特殊语法（如特殊日期函数），可能需要在 `JdbcScanNode.java` 的 `conjunctExprToString()` 方法中进行适配。
* 函数下推：可以在 `JdbcFunctionPushDownRule.java` 中定义 NewDB 支持下推的函数列表和函数名替换规则，以获得更好的性能。

## 5. 部署配置

### 5.1 驱动部署

```bash
# 将 NewDB JDBC 驱动放到指定目录
cp newdb-jdbc-driver.jar $DORIS_HOME/plugins/jdbc_drivers/
```

### 5.2 创建 Catalog

```sql
CREATE CATALOG newdb_catalog PROPERTIES (
    "type" = "jdbc",
    "user" = "newdb_user",
    "password" = "newdb_password",
    "jdbc_url" = "jdbc:newdb://host:port/database",
    "driver_url" = "newdb-jdbc-driver.jar",
    "driver_class" = "com.newdb.jdbc.Driver"
);

-- 使用 Catalog
USE newdb_catalog.database_name;
SELECT * FROM table_name LIMIT 10;
```

