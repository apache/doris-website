---
{
    "title": "基于 Arrow Flight SQL 的高速数据传输链路",
    "sidebar_label": "Arrow Flight SQL",
    "language": "zh-CN",
    "description": "如何从 Doris 高速读取大批量数据？基于 Arrow Flight SQL 协议，Python/Java 客户端以 Arrow 列存格式直接拉取，相比 MySQL/JDBC 性能提升数十至百倍，附 BI 工具集成与常见报错排查。",
    "keywords": [
        "Arrow Flight SQL",
        "ADBC Driver",
        "Doris 列存读取",
        "pydoris",
        "jdbc:arrow-flight-sql",
        "flight-sql-jdbc-core",
        "Doris 高速数据传输",
        "i/o timeout",
        "invalid bearer token",
        "parameter ordinal 1 out of range"
    ]
}
---

<!-- 知识类型: 能力定义 + 操作步骤 + 故障排查 -->
<!-- 适用场景: 高速读取 Doris 数据 / Python/Java 接入 / BI 工具集成 / 故障排查 -->

自 Doris 2.1 版本起，基于 Arrow Flight SQL 协议实现了高速数据传输链路，支持多种语言使用 SQL 从 Doris 高速读取大批量数据。相比 MySQL Client 或 JDBC/ODBC 驱动方案，部分场景性能提升数十倍至百倍。Arrow Flight SQL 还提供通用 JDBC 驱动，可与同样遵循该协议的数据库无缝交互。

## 适用场景

- 从 Doris 批量导出大规模数据用于分析（相比 MySQL/JDBC 协议性能提升数十至百倍）。
- 数据分析下游使用 Apache Arrow、Pandas 等列存格式，希望避免行列转换开销。
- 通过 BI 工具（如 DBeaver）使用 Arrow Flight SQL 协议访问 Doris。
- 在 Spark、Flink 等大数据组件中以 Arrow 格式高速读取 Doris 数据。

## 实现原理

<!-- 知识类型: 架构原理 -->

Doris 中查询结果以列存格式的 Block 组织。在 2.1 之前的版本，查询结果通过 MySQL Client 或 JDBC/ODBC 驱动传输至客户端时，需要将列存格式的 Block 序列化为行存格式的 Bytes，到达客户端后再反序列化为列存格式。

基于 Arrow Flight SQL 构建的高速数据传输链路，若客户端同样支持 Arrow 列存格式，整体传输过程将完全避免序列化/反序列化操作，彻底消除由此带来的时间及性能损耗。

![Arrow_Flight_SQL](/images/next/connect-dev/arrow-flight.jpg)

延伸阅读：

- Apache Arrow 官方安装教程：[Apache Arrow](https://arrow.apache.org/install/)
- Doris 实现 Arrow Flight 协议的原理：[Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514)

## 服务端配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 部署前准备 -->

使用 Arrow Flight SQL 之前，需要在 Doris FE 和 BE 上启用 Arrow Flight SQL 服务：

1. 修改 `fe/conf/fe.conf` 中的 `arrow_flight_sql_port` 为一个可用端口，如 `8070`。
2. 修改 `be/conf/be.conf` 中的 `arrow_flight_sql_port` 为一个可用端口，如 `8050`。
3. 重启集群。

:::caution
`fe.conf` 与 `be.conf` 中配置的 `arrow_flight_sql_port` 端口号不能相同。
:::

启动成功的验证方式：

| 角色 | 日志文件         | 关键字                                |
| ---- | ---------------- | ------------------------------------- |
| FE   | `fe/log/fe.log`  | `Arrow Flight SQL service is started` |
| BE   | `be/log/be.INFO` | `Arrow Flight Service bind to host`   |

## Python 使用方式

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Python 应用接入 Doris -->

使用 Python ADBC Driver 连接 Doris 可实现数据的极速读取，要求 Python 版本 >= 3.9。下面演示使用 ADBC Driver 执行常见的数据库操作，包括 DDL、DML、设置 Session 变量以及 Show 语句等。

### 1. 安装依赖

ADBC Driver 已发布在 PyPI，可通过 `pip` 安装：

```bash
pip install adbc_driver_manager
pip install adbc_driver_flightsql
```

在代码中导入以下模块即可使用：

```Python
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

>>> print(adbc_driver_manager.__version__)
1.1.0
>>> print(adbc_driver_flightsql.__version__)
1.1.0
```

### 2. 建立连接

创建与 Doris Arrow Flight SQL 服务交互的客户端时，需提供 FE 的 Host、Arrow Flight Port、用户名以及密码。

假设 FE 与 BE 的 Arrow Flight SQL 服务分别运行在端口 `8070` 和 `8050`，用户名/密码为 `user`/`pass`，连接过程如下：

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```

连接完成后，可通过 SQL 使返回的 Cursor 与 Doris 交互，执行建表、获取元数据、导入数据、查询等操作。

### 3. 执行 DDL 与查询元数据

将 SQL 传递给 `cursor.execute()` 函数，执行建表与获取元数据操作：

```Python
cursor.execute("DROP DATABASE IF EXISTS arrow_flight_sql FORCE;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("create database arrow_flight_sql;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("show databases;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("use arrow_flight_sql;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("""CREATE TABLE arrow_flight_sql_test
    (
         k0 INT,
         k1 DOUBLE,
         K2 varchar(32) NULL DEFAULT "" COMMENT "",
         k3 DECIMAL(27,9) DEFAULT "0",
         k4 BIGINT NULL DEFAULT '10',
         k5 DATE,
    )
    DISTRIBUTED BY HASH(k5) BUCKETS 5
    PROPERTIES("replication_num" = "1");""")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("show create table arrow_flight_sql_test;")
print(cursor.fetchallarrow().to_pandas())
```

如果 `StatusResult` 返回 `0`，则说明 Query 执行成功（这样设计的原因是为了兼容 JDBC）：

```text
  StatusResult
0            0

  StatusResult
0            0

                   Database
0         __internal_schema
1          arrow_flight_sql
..                      ...
507             udf_auth_db

[508 rows x 1 columns]

  StatusResult
0            0

  StatusResult
0            0
                   Table                                       Create Table
0  arrow_flight_sql_test  CREATE TABLE `arrow_flight_sql_test` (\n  `k0`...
```

### 4. 导入数据

执行 `INSERT INTO`，向所创建表中导入少量测试数据：

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```

如下输出表示导入成功：

```text
  StatusResult
0            0
```

:::tip
如需向 Doris 导入大批量数据，建议使用 `pydoris` 执行 Stream Load。
:::

### 5. 执行查询

对上面导入的表进行查询，包括聚合、排序、Set Session Variable 等操作：

```Python
cursor.execute("select * from arrow_flight_sql_test order by k0;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("set exec_mem_limit=2000;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("show variables like \"%exec_mem_limit%\";")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("select k5, sum(k1), count(1), avg(k3) from arrow_flight_sql_test group by k5;")
print(cursor.fetch_df())
```

输出结果：

```text
   k0            k1    K2                k3          k4          k5
0   0       0.10000    ID       0.000100000  9999999999  2023-10-21
1   1       0.20000  ID_1       1.000000010           0  2023-10-21
2   2       3.40000  ID_1       3.100000000      123456  2023-10-22
3   3       4.00000    ID       4.000000000           4  2023-10-22
4   4  122345.54321    ID  122345.543210000           5  2023-10-22

[5 rows x 6 columns]

  StatusResult
0            0

    Variable_name Value Default_Value Changed
0  exec_mem_limit  2000    2147483648       1

           k5  Nullable(Float64)_1  Int64_2 Nullable(Decimal(38, 9))_3
0  2023-10-22         122352.94321        3            40784.214403333
1  2023-10-21              0.30000        2                0.500050005

[2 rows x 5 columns]
```

:::caution
获取查询结果应使用以下两种方法之一，以保持数据的列存格式：

- `cursor.fetchallarrow()`：返回 Arrow 格式
- `cursor.fetch_df()`：直接返回 Pandas DataFrame

不能使用 `cursor.fetchall()`，否则会将列存格式的数据转回行存，与使用 mysql-client 没有本质区别；甚至由于在客户端多了一次列转行操作，性能可能比 mysql-client 还慢。
:::

### 6. 完整示例

```Python
# Doris Arrow Flight SQL Test

# step 1, library is released on PyPI and can be easily installed.
# pip install adbc_driver_manager
# pip install adbc_driver_flightsql
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

# step 2, create a client that interacts with the Doris Arrow Flight SQL service.
# Modify arrow_flight_sql_port in fe/conf/fe.conf to an available port, such as 8070.
# Modify arrow_flight_sql_port in be/conf/be.conf to an available port, such as 8050.
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "root",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "",
        })
cursor = conn.cursor()

# interacting with Doris via SQL using Cursor
def execute(sql):
    print("\n### execute query: ###\n " + sql)
    cursor.execute(sql)
    print("### result: ###")
    print(cursor.fetchallarrow().to_pandas())

# step3, execute DDL statements, create database/table, show stmt.
execute("DROP DATABASE IF EXISTS arrow_flight_sql FORCE;")
execute("show databases;")
execute("create database arrow_flight_sql;")
execute("show databases;")
execute("use arrow_flight_sql;")
execute("""CREATE TABLE arrow_flight_sql_test
    (
         k0 INT,
         k1 DOUBLE,
         K2 varchar(32) NULL DEFAULT "" COMMENT "",
         k3 DECIMAL(27,9) DEFAULT "0",
         k4 BIGINT NULL DEFAULT '10',
         k5 DATE,
    )
    DISTRIBUTED BY HASH(k5) BUCKETS 5
    PROPERTIES("replication_num" = "1");""")
execute("show create table arrow_flight_sql_test;")


# step4, insert into
execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")


# step5, execute queries, aggregation, sort, set session variable
execute("select * from arrow_flight_sql_test order by k0;")
execute("set exec_mem_limit=2000;")
execute("show variables like \"%exec_mem_limit%\";")
execute("select k5, sum(k1), count(1), avg(k3) from arrow_flight_sql_test group by k5;")

# step6, close cursor 
cursor.close()
```

## Java 使用方式

<!-- 知识类型: 操作步骤 + 架构选型决策 -->
<!-- 适用场景: Java 应用接入 Doris -->

Java 端共有三种连接方式可选，特点对比如下：

| 连接方式                            | URL 形式                      | 返回格式               | 适用场景                                       |
| ----------------------------------- | ----------------------------- | ---------------------- | ---------------------------------------------- |
| **JDBC（`jdbc:arrow-flight-sql`）** | `jdbc:arrow-flight-sql://...` | JDBC ResultSet（行存） | 兼容 BI 工具及现有 JDBC 代码，下游使用行存格式 |
| **Flight ADBC Driver**              | `grpc://...`                  | Arrow（列存）          | 下游使用 Arrow/列存格式，追求最优性能          |
| **Flight JDBC Driver（ADBC 包装）** | `jdbc:arrow-flight-sql://...` | Arrow（列存）          | 同 ADBC，但希望沿用 JDBC URL 形式              |

**快速选型：**

- 下游分析使用**行存格式**或需兼容现有 JDBC 代码 → 选 **JDBC（`jdbc:arrow-flight-sql`）**
- 下游分析使用 **Arrow/列存格式**，追求最优性能 → 选 **Flight ADBC Driver**
- 与上一项相同，但项目中需沿用 JDBC URL 形式 → 选 **Flight JDBC Driver（ADBC 包装）**

:::caution
使用 Java 9 及以上版本时，必须在 Java 命令中添加 `--add-opens=java.base/java.nio=ALL-UNNAMED` 来暴露部分 JDK 内部结构，否则会出现以下报错之一：

- `module java.base does not "opens java.nio" to unnamed module`
- `module java.base does not "opens java.nio" to org.apache.arrow.memory.core`
- `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

添加方式有两种：

```shell
# 方式 1：直接通过命令行参数添加
$ java --add-opens=java.base/java.nio=ALL-UNNAMED -jar ...

# 方式 2：通过环境变量添加
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=ALL-UNNAMED" java -jar ...
```

在 IntelliJ IDEA 中调试时，需要在 `Run/Debug Configurations` 的 `Build and run` 中增加该参数，参考下图：

![arrow-flight-sql-IntelliJ](/images/db-connect/arrow-flight-sql/arrow-flight-sql-IntelliJ.png)
:::

### 方式一：JDBC（`jdbc:arrow-flight-sql`）

Arrow Flight SQL 协议的开源 JDBC 驱动兼容标准 JDBC API，可用于大多数 BI 工具通过 JDBC 访问 Doris，并支持高速传输 Apache Arrow 数据。使用方式与 MySQL JDBC 驱动类似，只需将连接 URL 中的 `jdbc:mysql` 协议替换为 `jdbc:arrow-flight-sql` 协议，查询返回的结果依然是 JDBC 的 `ResultSet` 数据结构。

POM 依赖：

```xml
<properties>
    <arrow.version>17.0.0</arrow.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.apache.arrow</groupId>
        <artifactId>flight-sql-jdbc-core</artifactId>
        <version>${arrow.version}</version>
    </dependency>
</dependencies>
```

连接代码示例：

```Java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

Class.forName("org.apache.arrow.driver.jdbc.ArrowFlightJdbcDriver");
String DB_URL = "jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}?useServerPrepStmts=false"
        + "&cachePrepStmts=true&useSSL=false&useEncryption=false";
String USER = "root";
String PASS = "";

Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
Statement stmt = conn.createStatement();
ResultSet resultSet = stmt.executeQuery("select * from information_schema.tables;");
while (resultSet.next()) {
    System.out.println(resultSet.toString());
}

resultSet.close();
stmt.close();
conn.close();
```

### 方式二与方式三：Flight ADBC Driver / Flight JDBC Driver

除了使用 JDBC 之外，Java 也可以创建 Driver 直接读取 Doris 并返回 Arrow 格式数据。下面分别给出使用 ADBC Driver 和 JDBC Driver（ADBC 包装）连接 Doris Arrow Flight Server 的示例。

POM 依赖：

```xml
<properties>
    <adbc.version>0.15.0</adbc.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.apache.arrow.adbc</groupId>
        <artifactId>adbc-driver-jdbc</artifactId>
        <version>${adbc.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.arrow.adbc</groupId>
        <artifactId>adbc-core</artifactId>
        <version>${adbc.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.arrow.adbc</groupId>
        <artifactId>adbc-driver-manager</artifactId>
        <version>${adbc.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.arrow.adbc</groupId>
        <artifactId>adbc-sql</artifactId>
        <version>${adbc.version}</version>
    </dependency>
    <dependency>
        <groupId>org.apache.arrow.adbc</groupId>
        <artifactId>adbc-driver-flight-sql</artifactId>
        <version>${adbc.version}</version>
    </dependency>
</dependencies>
```

#### Flight ADBC Driver

连接代码示例：

```Java
// 1. new driver
final BufferAllocator allocator = new RootAllocator();
FlightSqlDriver driver = new FlightSqlDriver(allocator);
Map<String, Object> parameters = new HashMap<>();
AdbcDriver.PARAM_URI.set(parameters, Location.forGrpcInsecure("{FE_HOST}", {fe.conf:arrow_flight_sql_port}).getUri().toString());
AdbcDriver.PARAM_USERNAME.set(parameters, "root");
AdbcDriver.PARAM_PASSWORD.set(parameters, "");
AdbcDatabase adbcDatabase = driver.open(parameters);

// 2. new connection
AdbcConnection connection = adbcDatabase.connect();
AdbcStatement stmt = connection.createStatement();

// 3. execute query
stmt.setSqlQuery("select * from information_schema.tables;");
QueryResult queryResult = stmt.executeQuery();
ArrowReader reader = queryResult.getReader();

// 4. load result
List<String> result = new ArrayList<>();
while (reader.loadNextBatch()) {
    VectorSchemaRoot root = reader.getVectorSchemaRoot();
    String tsvString = root.contentToTSVString();
    result.add(tsvString);
}
System.out.printf("batchs %d\n", result.size());

// 5. close
reader.close();
queryResult.close();
stmt.close();
connection.close();
```

#### Flight JDBC Driver（ADBC 包装）

连接代码示例：

```Java
final Map<String, Object> parameters = new HashMap<>();
AdbcDriver.PARAM_URI.set(
        parameters,"jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}?useServerPrepStmts=false&cachePrepStmts=true&useSSL=false&useEncryption=false");
AdbcDriver.PARAM_USERNAME.set(parameters, "root");
AdbcDriver.PARAM_PASSWORD.set(parameters, "");
try (
        BufferAllocator allocator = new RootAllocator();
        AdbcDatabase db = new JdbcDriver(allocator).open(parameters);
        AdbcConnection connection = db.connect();
        AdbcStatement stmt = connection.createStatement()
) {
    stmt.setSqlQuery("select * from information_schema.tables;");
    AdbcStatement.QueryResult queryResult = stmt.executeQuery();
    ArrowReader reader = queryResult.getReader();
    List<String> result = new ArrayList<>();
    while (reader.loadNextBatch()) {
        VectorSchemaRoot root = reader.getVectorSchemaRoot();
        String tsvString = root.contentToTSVString();
        result.add(tsvString);
    }
    long etime = System.currentTimeMillis();
    System.out.printf("batchs %d\n", result.size());

    reader.close();
    queryResult.close();
    stmt.close();
}  catch (Exception e) {
    e.printStackTrace();
}
```

### Java 连接方式选型建议

可参考 [JDBC/Java Arrow Flight SQL Sample](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) 中的 Demo 测试不同连接方式的性能，预期执行结果见 [Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306)。

与传统 `jdbc:mysql` 相比，Java Arrow Flight SQL 各连接方式的性能测试见 [GitHub Issue 25514（Section 6.2）](https://github.com/apache/doris/issues/25514)。基于测试结论，给出以下建议：

1. 三种 Java Arrow Flight SQL 连接方式的取舍：

    - 若下游分析使用行存格式，推荐 `jdbc:arrow-flight-sql`，返回 JDBC `ResultSet`。
    - 若下游分析使用 Arrow 或其他列存格式，推荐 Flight ADBC Driver 或 Flight JDBC Driver，直接返回 Arrow 数据，避免行列转换并可利用 Arrow 加速解析。

2. 无论解析 JDBC `ResultSet` 还是 Arrow 数据，所耗时间都大于读取数据本身。如果 Arrow Flight SQL 性能与 `jdbc:mysql://` 相比提升有限，可优先排查解析数据耗时是否过长。

3. 对所有连接方式而言，JDK 17 都比 JDK 1.8 读取数据更快。

4. 当数据量非常大时，Arrow Flight SQL 比 `jdbc:mysql://` 内存占用更少。受内存不足困扰时可优先尝试 Arrow Flight SQL。

5. 上述三种方式之外，还可使用原生 `FlightClient` 直接连接 Arrow Flight Server，更加灵活地并行读取多个 Endpoint。Flight ADBC Driver 即基于 `FlightClient` 创建链接，相较直接使用 `FlightClient` 更为简单。

## 与第三方组件集成

<!-- 知识类型: 集成方案 -->
<!-- 适用场景: BI 工具 / Spark / Flink 接入 -->

### BI 工具（DBeaver 等）

自 Doris v2.1.8 开始，支持 DBeaver 等 BI 工具使用 `arrow-flight-sql` 协议连接 Doris。配置方法可参考：

- [How to use JDBC driver with DBeaver client](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client)
- [Dremio Sonar - Client Applications: DBeaver](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg)

### Spark 与 Flink

Arrow Flight 官方目前没有支持 Spark 和 Flink 的计划（见 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)）。但自 24.0.0 版本开始，以下连接器已支持通过 Arrow Flight SQL 访问 Doris，预期能提升数倍读取性能：

- [Doris Spark Connector](https://github.com/apache/doris-spark-connector)
- [Doris Flink Connector](https://github.com/apache/doris-flink-connector)

社区曾参考 [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector)，在 Spark 中使用 `FlightClient` 连接 Doris 进行测试，结论如下：

- Arrow 与 Doris Block 之间的数据格式转换速度，是 CSV 与 Doris Block 之间转换速度的 10 倍。
- Arrow 对 Map、Array 等复杂类型支持更好。
- Arrow 数据格式压缩率高，传输时网络开销更小。

不过目前 Doris Arrow Flight 还未实现多节点并行读取，仍是将查询结果汇总到一台 BE 节点后返回。对于简单的批量导出数据而言，性能可能不及 Doris Spark Connector（其支持 Tablet 级别的并行读取）。

如果你希望在 Spark 中使用 Arrow Flight SQL 连接 Doris，可参考以下开源项目自行实现：

- [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector)
- [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector)

## 进阶配置

<!-- 知识类型: 配置参数 + 部署方案 -->
<!-- 适用场景: 性能调优 / 复杂部署形态 -->

### 多 BE 并行返回结果

Doris 默认会将一个查询在所有 BE 节点上的结果汇总聚合到一台 BE 节点上。不同协议的处理方式如下：

- **MySQL/JDBC 查询**：FE 向汇总数据的 BE 节点请求查询结果。
- **Arrow Flight SQL 查询**：FE 将该 BE 节点的 IP/Port 包装在 Endpoint 中返回给 ADBC Client，由 ADBC Client 再去请求该 Endpoint 拉取数据。

#### 场景一：纯 SELECT 拉取（无 Join/Sort/窗口函数）

如果查询只是简单 SELECT 从 Doris 拉取数据，没有 Join、Sort、窗口函数等导致数据 Shuffle 的算子，可以将查询按 Tablet 粒度拆分。Doris Spark/Flink Connector 即采用此方法实现并行读取，分两步：

1. 执行 `EXPLAIN SQL`，FE 返回的查询计划中 ScanOperator 包含所有 Tablet ID List。
2. 依据上述 Tablet ID List 将原始 SQL 拆分为多个 SQL，每个 SQL 只读取部分 Tablet，例如：

    ```sql
    SELECT * FROM t1 TABLET(10001,10002) limit 1000;
    ```

    拆分后的多个 SQL 可并行执行。具体可参考 [Support select table sample](https://github.com/apache/doris/pull/10170)。

#### 场景二：最外层为聚合的查询

对于形如 `select k1, sum(k2) from xxx group by k1` 的查询，自 Doris v3.0.4 开始，可通过以下设置允许查询的每个 BE 节点独立返回结果：

```sql
set enable_parallel_result_sink=true;
```

ADBC Client 收到 FE 返回的 Endpoint 列表后，会并行从多个 BE 节点拉取结果。具体实现可参考 [support parallel result sink](https://github.com/apache/doris/pull/36053)。

:::caution
当聚合结果很小时，多 BE 返回会增加 RPC 压力。
:::

理论上除了最外层为排序的查询之外，其他查询都可以支持每个 BE 节点并行返回结果，目前暂未进一步实现。

### 多 BE 共享同一个外部访问 IP

存在一种部署形态：FE 节点可被集群外部访问，所有 BE 节点仅可被集群内部访问。

- 使用 MySQL Client 或 JDBC 连接 Doris 执行查询无问题，因为查询结果由 FE 返回。
- 使用 Arrow Flight SQL 连接 Doris 则无法执行查询，因为 ADBC Client 需要直接连接 BE 节点拉取查询结果。

生产环境通常不便将 BE 节点暴露到集群外。可以为所有 BE 节点增加一层反向代理（如 Nginx），集群外部 Client 连接 Nginx 时随机路由到一台 BE 节点。但默认情况下，Arrow Flight SQL 查询结果会随机保存在某台 BE 节点上，若与 Nginx 路由的 BE 节点不一致，需要在 BE 内部做一次数据转发。

自 Doris v2.1.8 开始，可在所有 BE 节点的 `be.conf` 中将 `public_host` 和 `arrow_flight_sql_proxy_port` 配置为多 BE 节点共享的外部访问 IP 和端口，查询结果可正确转发后返回 ADBC Client：

```conf
public_host={nginx ip}
arrow_flight_sql_proxy_port={nginx port}
```

## FAQ

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 报错诊断 / 兼容性问题 -->

### 1. 报错 `i/o timeout`

**Q：** 完整报错为 `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"`。

**A：** 根据报错信息中 `<ip:arrow_flight_port>` 对应的角色，分两种情况排查。

**情况一：`<ip:arrow_flight_port>` 是 FE 节点的 IP 和 `arrow_flight_port`**

1. 检查 FE 节点的 Arrow Flight Server 是否正常启动：在 `fe/log/fe.log` 中搜索到 `Arrow Flight SQL service is started` 表示启动成功。
2. 若 FE Arrow Flight Server 已正常启动，检查 Client 所在机器能否 `ping` 通该 IP；若无法 `ping` 通，需要为 FE 节点开通可供外部访问的 IP，并重新部署集群。

**情况二：`<ip:arrow_flight_port>` 是 BE 节点的 IP 和 `arrow_flight_port`**

1. 检查 BE 节点的 Arrow Flight Server 是否正常启动：在 `be/log/be.INFO` 中搜索到 `Arrow Flight Service bind to host` 表示启动成功。
2. 若 BE Arrow Flight Server 已正常启动，检查 Client 所在机器能否 `ping` 通该 IP。

如果已知 BE 节点处于集群内网，可使用以下两种方法之一：

- 为每个 BE 节点开通一个可供外部访问的 IP；自 Doris v2.1.8 开始，可在该 BE 节点的 `be.conf` 中将 `public_host` 配置为该 IP，同理将所有 BE 节点的 `public_host` 配置为对应可被 Client 访问的 IP。
- 参考 [多 BE 共享同一个外部访问 IP](#多-be-共享同一个外部访问-ip) 章节，为所有 BE 节点增加一层反向代理。

如果不清楚 BE 是否完全处于内网，可执行以下步骤检查：

1. 在 BE 节点机器执行 `ifconfig` 返回所有 IP；其中一个应与 `<ip:arrow_flight_port>` 中的 IP 相同，且与 `show backends` 打印的 IP 相同。
2. 依次 `ping` `ifconfig` 返回的其他 IP。
3. 若存在某个 IP 可被 Client 访问，将该 IP 配置为 `public_host`；若所有 IP 均无法被 Client 访问，则 BE 节点完全处于内网。

### 2. 使用 JDBC 或 Java 连接 Arrow Flight SQL 时报错 `module java.base does not "opens java.nio"...`

**Q：** 完整报错可能是以下之一：

- `module java.base does not "opens java.nio" to unnamed module`
- `module java.base does not "opens java.nio" to org.apache.arrow.memory.core`
- `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

**A：** 解决步骤如下：

1. 检查 `fe/conf/fe.conf` 中 `JAVA_OPTS_FOR_JDK_17` 是否包含 `--add-opens=java.base/java.nio=ALL-UNNAMED`，若没有则添加。
2. 参考 [Java 使用方式](#java-使用方式) 中的注意事项，在 Java 命令中添加 `--add-opens=java.base/java.nio=ALL-UNNAMED`。
3. 在 IntelliJ IDEA 中调试，需在 `Run/Debug Configurations` 的 `Build and run` 中增加 `--add-opens=java.base/java.nio=ALL-UNNAMED`。

### 3. ARM 环境报错 `arrow flight schema timeout`

**Q：** 完整报错为 `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client`。

**A：** 如果 Linux 内核版本 <= 4.19.90，需要升级到 4.19.279 及以上，或在低版本 Linux 内核环境中重新编译 Doris BE。具体编译方法参考文档 `docs/dev/install/source-install/compilation-arm`。

**问题原因：** 老版本 Linux 内核与 Arrow 存在兼容性问题，`cpp: arrow::RecordBatch::MakeEmpty()` 在构造 Arrow Record Batch 时会卡住，导致 BE 的 Arrow Flight Server 在 5000ms 内未响应 FE 的 RPC 请求，FE 进而向 Client 返回 RPC timeout failed。Spark 和 Flink 读取 Doris 时也是将查询结果转换为 Arrow Record Batch 后返回，所以同样存在该问题。

KylinV10 SP2 和 SP3 的 Linux 内核版本最高仅 `4.19.90-24.4.v2101.ky10.aarch64`，无法继续升级，只能在 KylinV10 上重新编译 Doris BE。如果使用新版本 `ldb_toolchain` 编译后问题仍存在，可尝试使用低版本 `ldb_toolchain v0.17` 编译。如果你的 ARM 环境无法连外网，华为云提供 ARM + KylinV10，阿里云提供 x86 + KylinV10。

### 4. Prepared Statement 传递参数报错

**Q：** Prepared Statement 传递参数（如 `select * from xxx where id=?`）时报错 `parameter ordinal 1 out of range`。

**A：** 目前 `jdbc:arrow-flight-sql` 和 Java ADBC/JDBC Driver 不支持 Prepared Statement 传递参数。这是 Arrow Flight SQL 的一个 BUG，详见 [GitHub Issue](https://github.com/apache/arrow/issues/40118)。

### 5. 如何修改 `jdbc:arrow-flight-sql` 每次读取的批次大小

**Q：** 在某些场景下需要修改批次大小以提升性能。

**A：** 通过修改 `org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader` 文件中 `makeJdbcConfig` 方法的 `setTargetBatchSize`（默认 `1024`），然后将修改后的文件保存到本地同名路径目录下，从而覆盖原文件生效。

### 6. ADBC v0.10 不支持并行读取

**Q：** ADBC v0.10 中 JDBC 和 Java ADBC/JDBC Driver 是否支持并行读取？

**A：** 不支持，因为没有实现 `stmt.executePartitioned()` 方法。只能使用原生 FlightClient 实现并行读取多个 Endpoints，调用流程示例：

```text
sqlClient = new FlightSqlClient
execute   = sqlClient.execute(sql)
endpoints = execute.getEndpoints()
for (FlightEndpoint endpoint : endpoints) { ... }
```

此外，ADBC v0.10 默认的 `AdbcStatement` 实际是 `JdbcStatement`，`executeQuery` 后将行存格式的 JDBC `ResultSet` 又重新转为 Arrow 列存格式。预期 ADBC 1.0.0 时 Java ADBC 将功能完善，详见 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)。

### 7. 在 URL 中指定 database name

**Q：** 是否可以在 URL 中指定 database name？

**A：** 截止 Arrow v15.0，Arrow JDBC Connector 不支持在 URL 中指定 database name，例如 `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` 中指定连接 `test` database 无效，只能手动执行 SQL `use database`。Arrow v18.0 已支持 URL 指定 database name，但实测仍存在 BUG。

### 8. Python ADBC 打印 `Cannot disable autocommit` 警告

**Q：** 完整警告为 `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant`。

**A：** 使用 Python 时可忽略此警告，这是 Python ADBC Client 的问题，不会影响查询。

### 9. Python 报错 `grpc: received message larger than max`

**Q：** 完整报错为 `grpc: received message larger than max (20748753 vs. 16777216)`。

**A：** 参考 [Python: grpc: received message larger than max #2078](https://github.com/apache/arrow-adbc/issues/2078)，在 Database Option 中增加 `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value`。

### 10. 报错 `invalid bearer token`

**Q：** 客户端报错 `invalid bearer token`。

**A：** 可执行以下操作：

1. 修改当前用户的最大连接数：

    ```sql
    SET PROPERTY FOR 'root' 'max_user_connections' = '10000';
    ```

2. 在 `fe.conf` 中增加以下两项并重启 FE：

    ```conf
    qe_max_connection=30000
    arrow_flight_token_cache_size=8000
    ```

**问题原因：连接长期保留机制**

ADBC Client 与 Arrow Flight Server 之间的连接本质上是长连接，需要在 Server 缓存 Auth Token、Connection、Session。连接创建后不会在单个查询结束时立即断开，需要 Client 发送 `close()` 请求后清理；但实际 Client 经常不发送 `close()`，因此 Auth Token、Connection、Session 会长时间保留在 Server 上，默认在 3 天后超时断开，或在连接数超过 `arrow_flight_token_cache_size` 限制时按 LRU 淘汰。

**问题原因：默认连接数偏小**

截止 Doris v2.1.8，Arrow Flight 连接和 MySQL/JDBC 连接共用相同的连接数限制，包括：

- FE 所有用户的总连接数 `qe_max_connection`，默认 `1024`。
- 单个用户的连接数 `UserProperty` 中的 `max_user_connections`，默认 `100`。

Arrow Flight SQL 常用来取代使用 JDBC 的场景，但 JDBC 连接会在查询结束后立即释放，因此使用 Arrow Flight SQL 时 Doris 默认的连接数限制偏小，经常导致连接数超过 `arrow_flight_token_cache_size` 后将仍被使用的连接淘汰。

### 11. JDBC 或 Java 读取 Datetime 类型返回时间戳

**Q：** 使用 JDBC 或 Java 连接 Arrow Flight SQL 读取 Datetime 类型时，返回的是时间戳（如 `1740993808`），而非格式化时间（如 `2025-03-03 17:23:28Z`）。

**A：** JDBC 或 Java 连接 Arrow Flight SQL 读取 Datetime 类型需要自行转换时间戳，参考 [Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578)。Python Arrow Flight SQL 读取 Datetime 类型返回 `2025-03-03 17:23:28Z`，而 JDBC 或 Java 返回 `1740993808`。

### 12. JDBC 或 Java JDBC Client 读取 Array 嵌套类型报错

**Q：** 完整报错为 `Configuration does not provide a mapping for array column 2`。

**A：** 建议参考 [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java) 改用 Java ADBC Client。

Python ADBC Client、Java ADBC Client、Java JDBC DriverManager 读取 Array 嵌套类型均无问题，仅使用 JDBC 或 Java JDBC Client 连接 Arrow Flight SQL 时存在该问题。Arrow Flight JDBC 不是 Arrow 官方开发，由第三方数据库公司 Dremio 开发，兼容性较弱，此前也曾发现过其他兼容性问题，因此优先推荐使用 Java ADBC Client。
