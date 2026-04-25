---
{
    "title": "基于 Arrow Flight SQL 的高速数据传输链路",
    "language": "zh-CN",
    "description": "自 Doris 2.1 版本后，基于 Arrow Flight SQL 协议实现了高速数据链路，支持多种语言使用 SQL 从 Doris 高速读取大批量数据。Arrow Flight SQL 还提供了通用的 JDBC 驱动，支持与同样遵循 Arrow Flight SQL 协议的数据库无缝交互。"
}
---

自 Doris 2.1 版本后，基于 Arrow Flight SQL 协议实现了高速数据链路，支持多种语言使用 SQL 从 Doris 高速读取大批量数据。Arrow Flight SQL 还提供了通用的 JDBC 驱动，支持与同样遵循 Arrow Flight SQL 协议的数据库无缝交互。部分场景相比 MySQL Client 或 JDBC/ODBC 驱动数据传输方案，性能提升百倍。

## 实现原理

在 Doris 中查询结果以列存格式的 Block 组织。在 2.1 以前版本，可以通过 MySQL Client 或 JDBC/ODBC 驱动传输至目标客户端，需要将行存格式的 Bytes 再反序列化为列存格式。基于 Arrow Flight SQL 构建高速数据传输链路，若目标客户端同样支持 Arrow 列存格式，整体传输过程将完全避免序列化/反序列化操作，彻底消除因此带来时间及性能损耗。

![Arrow_Flight_SQL](/images/db-connect/arrow-flight-sql/Arrow_Flight_SQL.png)

安装 Apache Arrow 你可以去官方文档 [Apache Arrow](https://arrow.apache.org/install/) 找到详细的安装教程。更多关于 Doris 实现 Arrow Flight 协议的原理可以参考 [Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514)。


## Python 使用方法

使用 Python 的 ADBC Driver 连接 Doris 实现数据的极速读取，下面的步骤使用 Python（版本 >= 3.9）的 ADBC Driver 执行一系列常见的数据库语法操作，包括 DDL、DML、设置 Session 变量以及 Show 语句等。

### 安装 Library

Library 被发布在 PyPI，可通过以下方式简单安装：

```
pip install adbc_driver_manager
pip install adbc_driver_flightsql
```

在代码中 import 以下模块/库来使用已安装的 Library：

```Python
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

>>> print(adbc_driver_manager.__version__)
1.1.0
>>> print(adbc_driver_flightsql.__version__)
1.1.0
```

### 连接 Doris

创建与 Doris Arrow Flight SQL 服务交互的客户端。需提供 Doris FE 的 Host、Arrow Flight Port、登陆用户名以及密码，并进行以下配置。
修改 Doris FE 和 BE 的配置参数：

- 修改 fe/conf/fe.conf 中 arrow_flight_sql_port 为一个可用端口，如 8070。
- 修改 be/conf/be.conf中 arrow_flight_sql_port 为一个可用端口，如 8050。

`注: fe.conf 与 be.conf 中配置的 arrow_flight_sql_port 端口号不相同`

修改配置并重启集群后，在 fe/log/fe.log 文件中搜索到 `Arrow Flight SQL service is started` 表明 FE 的 Arrow Flight Server 启动成功；在 be/log/be.INFO 文件中搜索到 `Arrow Flight Service bind to host` 表明 BE 的 Arrow Flight Server 启动成功。

假设 Doris 实例中 FE 和 BE 的 Arrow Flight SQL 服务将分别在端口 8070 和 8050 上运行，且 Doris 用户名/密码为“user”/“pass”，那么连接过程如下所示：

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```

连接完成后，可以通过 SQL 使返回的 Cursor 与 Doris 交互，执行例如建表、获取元数据、导入数据、查询等操作。

### 建表与获取元数据

将 Query 传递给 cursor.execute（）函数，执行建表与获取元数据操作：

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

如果 StatusResult 返回 0，则说明 Query 执行成功（这样设计的原因是为了兼容 JDBC）。

```
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

### 导入数据

执行 INSERT INTO，向所创建表中导入少量测试数据：

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```

如下所示则证明导入成功：

```
  StatusResult
0            0
```

如果需要导入大批量数据到 Doris，可以使用 pydoris 执行 Stream Load 来实现。

### 执行查询

接着对上面导入的表进行查询查询，包括聚合、排序、Set Session Variable 等操作。

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

结果如下所示：

```
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

**注意：** fetch 查询结果需要使用 `cursor.fetchallarrow()` 返回 arrow 格式，或使用 `cursor.fetch_df()` 直接返回 pandas dataframe，这将保持数据的列存格式。不能使用 `cursor.fetchall()`，否则会将列存格式的数据转回行存，这和使用 mysql-client 没有本质区别，甚至由于在 client 侧多了一次列转行的操作，可能比 mysql-client 还慢。

### 完整代码

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

## JDBC Connector with Arrow Flight SQL

Arrow Flight SQL 协议的开源 JDBC 驱动兼容标准的 JDBC API，可用于大多数 BI 工具通过 JDBC 访问 Doris，并支持高速传输 Apache Arrow 数据。使用方法与通过 MySQL 协议的 JDBC 驱动连接 Doris 类似，只需将链接 URL 中的 jdbc:mysql 协议换成 jdbc:arrow-flight-sql 协议，查询返回的结果依然是 JDBC 的 ResultSet 数据结构。

POM dependency:
```Java
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

**注意：** 使用 Java 9 或更高版本时，必须通过在 Java 命令中添加 `--add-opens=java.base/java.nio=ALL-UNNAMED` 来暴露一些 JDK 内部结构，否则，您可能会看到一些错误，如 `module java.base does not "opens java.nio" to unnamed module` 或者 `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` 或者 `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=ALL-UNNAMED" java -jar ...
```

如果在 IntelliJ IDEA 中调试，需要在 `Run/Debug Configurations` 的 `Build and run` 中增加 `--add-opens=java.base/java.nio=ALL-UNNAMED`，参照下面的图片：

![arrow-flight-sql-IntelliJ](/images/db-connect/arrow-flight-sql/arrow-flight-sql-IntelliJ.png)

连接代码示例如下：

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

## Java 使用方法

除了使用 JDBC，与 Python 类似，Java 也可以创建 Driver 读取 Doris 并返回 Arrow 格式的数据，下面分别是使用 AdbcDriver 和 JdbcDriver 连接 Doris Arrow Flight Server。

POM dependency:
```Java
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

### ADBC Driver

连接代码示例如下：

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

### JDBC Driver

连接代码示例如下：

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

### JDBC 和 Java 连接方式的选择

[JDBC/Java Arrow Flight SQL Sample](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) 是 JDBC/Java 使用 Arrow FLight SQL 的 demo，你可以使用它来测试向 Arrow Flight Server 发送查询的多种连接方法，帮助你了解如何使用 Arrow FLight SQL 并测试性能。预期的执行结果见 [Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306)。

对比传统的 `jdbc:mysql` 连接方式，Jdbc 和 Java 的 Arrow Flight SQL 连接方式的性能测试见 Section 6.2 of [GitHub Issue](https://github.com/apache/doris/issues/25514)，这里基于测试结论给出一些使用建议。

1. 上述三种 Java Arrow Flight SQL 连接方式的选择上，如果后续的数据分析将基于行存的数据格式，那么使用 jdbc:arrow-flight-sql，这将返回 JDBC ResultSet 格式的数据；如果后续的数据分析可以基于 Arrow 格式或其他列存数据格式，那么使用 Flight AdbcDriver 或 Flight JdbcDriver 直接返回 Arrow 格式的数据，这将避免行列转换，并可利用 Arrow 的特性加速数据解析。

2. 无论解析 JDBC ResultSet 还是 Arrow 格式的数据，所耗费的时间都大于读取数据的耗时，如果你那里使用 Arrow Flight SQL 的性能不符合预期，和 `jdbc:mysql://` 相比提升有限，不妨分析下是否解析数据耗时太长。

3. 对所有连接方式而言，JDK 17 都比 JDK 1.8 读取数据的速度更快。

4. 当读取数据量非常大时，使用 Arrow Flight SQL 将比 `jdbc:mysql://` 使用更少的内存，所以如果你受内存不足困扰，同样可以尝试下 Arrow Flight SQL。

5. 除了上述三种连接方式，还可以使用原生的 FlightClient 连接 Arrow Flight Server，可以更加灵活的并行读取多个 Endpoints。Flight AdbcDriver 也是基于 FlightClient 创建的链接，相较于直接使用 FlightClient 更简单。

## 与其他大数据组件交互

### Spark & Flink

Arrow Flight 官方目前没有支持 Spark 和 Flink 的计划（见 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)），[Doris Spark Connector](https://github.com/apache/doris-spark-connector) 和 [Doris Flink Connector](https://github.com/apache/doris-flink-connector) 自 24.0.0 开始支持通过 Arrow Flight SQL 访问 Doris，预期能提升数倍读取性能。

社区之前参考开源的 [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector)，在 Spark 中使用 FlightClient 连接 Doris 测试，发现 Arrow 与 Doris Block 之间数据格式转换的速度更快，是 CSV 格式与 Doris Block 之间转换速度的 10 倍，而且对 Map，Array 等复杂类型的支持更好，这是因为 Arrow 数据格式的压缩率高，传输时网络开销小。不过目前 Doris Arrow Flight 还没有实现多节点并行读取，仍是将查询结果汇总到一台 BE 节点后返回，对简单的批量导出数据而言，性能可能没有 Doris Spark Connector 快，后者支持 Tablet 级别的并行读取。如果你希望在 Spark 使用 Arrow Flight SQL 连接 Doris，可以参考开源的 [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) 和 [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector) 自行实现。

### 支持 BI 工具

自 Doris v2.1.8 开始，支持 DBeaver 等 BI 工具使用 `arrow-flight-sql` 协议连接 Doris。DBeaver 使用 `arrow-flight-sql` Driver 连接 Doris 的方法参考：[how-to-use-jdbc-driver-with-dbeaver-client](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client)，[client-applications/clients/dbeaver/](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg)。

## 扩展应用

### 多 BE 并行返回结果

Doris 默认会将一个查询在所有 BE 节点上的结果汇总聚合到一个 BE 节点上，在 Mysql/JDBC 查询中 FE 会向这个汇总数据的节点请求查询结果，在 Arrow Flight SQL 查询中 FE 会将这个节点的 IP/Port 包装在 Endpoint 中返回给 ADBC Client，ADBC Client 会请求这个 Endpoint 对应的 BE 节点拉取数据。

如果查询只是简单的 Select 从 Doris 拉取数据，没有 Join、Sort、窗口函数等有数据 Shuffle 行为的算子，可以将查询按照 Tablet 粒度拆分，现在 Doris Spark/Flink Connector 就是用的这个方法实现并行读取数据，分为两个步骤：
    1. 执行 `explain sql`，FE 返回的查询计划中 ScanOperator 包含 Scan 的所有 Tablet ID List。
    2. 依据上面的 Tablet ID List 将原始 SQL 拆分为多个 SQL，每个 SQL 只读取部分 Tablet，用法类似 `SELECT * FROM t1 TABLET(10001,10002) limit 1000;`，拆分后的多个 SQL 可以并行执行。参考 [Support select table sample](https://github.com/apache/doris/pull/10170)。

如果查询最外层是聚合，SQL 类似 `select k1, sum(k2) from xxx group by k1`，Doris v3.0.4 版本后，执行 `set enable_parallel_result_sink=true;` 后允许一个查询的每个 BE 节点独立返回查询结果，ADBC Client 收到 FE 返回的 Endpoint 列表后并行从多个 BE 节点拉取结果。不过注意当聚合结果很小时，多 BE 返回会增加 RPC 的压力。具体实现参考 [support parallel result sink](https://github.com/apache/doris/pull/36053)。理论上除了最外层是排序的查询，其他查询都可以支持每个 BE 节点并行返回结果，不过暂时没有这方便的需求，没有更进一步实现。

### 多 BE 共享同一个可供集群外部访问的 IP

如果存在一个 Doris 集群，它的 FE 节点可以被集群外部访问，它的所有 BE 节点只可以被集群内部访问。这在使用 Mysql Client 和 JDBC 连接 Doris 执行查询是没问题的，查询结果将由 Doris FE 节点返回。但使用 Arrow Flight SQL 连接 Doris 无法执行查询，因为 ADBC Client 需要连接 Doris BE 节点拉取查询结果，但 Doris BE 节点不允许被集群外部访问。

在生产环境中，很多时候不方便将 Doris BE 节点暴露到集群外。但可以为所有 Doris BE 节点增加了一层反向代理（比如 Nginx），集群外部的 Client 连接 Nginx 时会随机路由到一台 Doris BE 节点上。默认情况下，Arrow Flight SQL 查询结果会随机保存在一台 Doris BE 节点上，如果和 Nginx 随机路由的 Doris BE 节点不同，需要在 Doris BE 节点内部做一次数据转发。

自 Doris v2.1.8 开始，你可以在所有 Doris BE 节点的 `be.conf` 中将 `public_host` 和 `arrow_flight_sql_proxy_port` 配置成多 Doris BE 节点共享的可供集群外部访问的 IP 和端口，查询结果可以正确转发后返回 ADBC Client。
```conf
    public_host={nginx ip}
    arrow_flight_sql_proxy_port={nginx port}
```

## FAQ

1. Q: 报错 `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"`。
    
    A: 如果报错信息中的 `<ip:arrow_flight_port>` 是 Doris FE 节点的 IP 和 arrow-flight-prot，

        首先检查 Doris FE 节点的 arrow-flight-server 是否正常启动，在 fe/log/fe.log 文件中搜索到 `Arrow Flight SQL service is started` 表明 FE 的 Arrow Flight Server 启动成功。

        若 Doris FE 节点的 arrow-flight-server 正常启动，，检查 Client 所在机器能否 `ping` 通报错信息 `<ip:arrow_flight_port>` 中的 IP，若无法 `ping` 通，需要为 Doris FE 节点开通一个可供外部访问的 IP，并重新部署集群。

    A: 如果报错信息中的 `<ip:arrow_flight_port>` 是 Doris BE 节点的 IP 和 arrow-flight-prot。
    
        首先检查 Doris BE 节点的 arrow-flight-server 是否正常启动，在 be/log/be.INFO 文件中搜索到 `Arrow Flight Service bind to host` 表明 BE 的 Arrow Flight Server 启动成功。
        
        若 Doris BE 节点的 arrow-flight-server 正常启动，检查 Client 所在机器能否 `ping` 通报错信息 `<ip:arrow_flight_port>` 中的 IP，若无法 `ping` 通，若已知 Doris BE 节点处于无法被外部访问的内网，下面两个方法：

            - 考虑为每个 Doris BE 节点开通一个可供外部访问的 IP，自 Doris v2.1.8 开始，你可以在这个 Doris BE 节点的 `be.conf` 中将 `public_host` 配置成这个 IP，同理将所有 Doris BE 节点的 `public_host` 配置成对应 BE 节点可被 Client 访问的 IP。

            - 参考上文 [多 BE 共享同一个可供集群外部访问的 IP] 章节，可以为所有 Doris BE 节点增加了一层反向代理。
        
        若不清楚 Doris BE 是否完全处于内网，检查 Client 所在机器与 Doris BE 节点所在机器的其他 IP 之间的连通性，在 Doris BE 节点所在机器执行 `ifconfig` 返回当前机器所有的 IP，其中一个 IP 应该和 `<ip:arrow_flight_port>` 中的 IP 相同，并且和 `show backends` 打印的这个 Doris BE 节点的 IP 相同，依次 `ping` `ifconfig` 返回的其他 IP，若 Doris BE 节点存在可以被 Client 访问的 IP，参考上文同样将这个 IP 配置为 `public_host`。若 Doris BE 节点所有的 IP 均无法被 Client 访问，那么 Doris BE 节点完全处于内网。

2. Q：使用 JDBC 或 JAVA 连接 Arrow Flight SQL 时报错 `module java.base does not "opens java.nio" to unnamed module` 或者 `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` 或者 `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

    A：首先检查 fe/conf/fe.conf 中 `JAVA_OPTS_FOR_JDK_17` 是否包含 `--add-opens=java.base/java.nio=ALL-UNNAMED`，若没有则添加。然后参考上文 [JDBC Connector with Arrow Flight SQL] 中的注意事项在 Java 命令中添加 `--add-opens=java.base/java.nio=ALL-UNNAMED`，如果在 IntelliJ IDEA 中调试，需要在 `Run/Debug Configurations` 的 `Build and run` 中增加 `--add-opens=java.base/java.nio=ALL-UNNAMED`。

3. Q: ARM 环境报错 `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client`。
   
    A: 如果 Linux 内核版本 <= 4.19.90，需要升级到 4.19.279 及以上，或者在低版本 Linux 内核的环境中重新编译 Doris BE，具体编译方法参考文档<docs/dev/install/source-install/compilation-arm>

    问题原因：这是因为老版本 Linux 内核和 Arrow 存在兼容性问题，`cpp: arrow::RecordBatch::MakeEmpty()` 构造 Arrow Record Batch 时会卡住，导致 Doris BE 的 Arrow Flight Server 在 5000ms 内没有回应 Doris FE 的 Arrow Flight Server 的 RPC 请求，导致 FE 给 Client 返回 rpc timeout failed。Spark 和 Flink 读取 Doris 时也是将查询结果转换成 Arrow Record Batch 后返回，所以也存在同样的问题。

    kylinv10 SP2 和 SP3 的 Linux 内核版本最高只有 4.19.90-24.4.v2101.ky10.aarch64，无法继续升级内核版本，只能在 kylinv10 上重新编译 Doris BE，如果使用新版本 ldb_toolchain 编译 Doris  BE 后问题依然存在，可以尝试使用低版本 ldb_toolchain v0.17 编译，如果你的 ARM 环境无法连外网，华为云提供 ARM + kylinv10，阿里云提供 x86 + kylinv10

4. Q:  prepared statement 传递参数报错。
   
    A: 目前 `jdbc:arrow-flight-sql` 和 Java ADBC/JDBCDriver 不支持 prepared statement 传递参数，类似`select * from xxx where id=?`，将报错 `parameter ordinal 1 out of range`，这是 Arrow Flight SQL 的一个 BUG（[GitHub Issue](https://github.com/apache/arrow/issues/40118)）。

5. Q: 如何修改 `jdbc:arrow-flight-sql` 每次读取的批次大小，在某些场景下提升性能。
   
    A: 通过修改`org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader`文件中`makeJdbcConfig`方法中的 `setTargetBatchSize`，默认是 1024，然后将修改后的文件保存到本地同名路径目录下，从而覆盖原文件生效。

6. Q: ADBC v0.10，JDBC 和 Java ADBC/JDBCDriver 不支持并行读取。
   
    A: 没有实现`stmt.executePartitioned()`这个方法，只能使用原生的 FlightClient 实现并行读取多个 Endpoints, 使用方法`sqlClient=new FlightSqlClient, execute=sqlClient.execute(sql), endpoints=execute.getEndpoints(), for(FlightEndpoint endpoint: endpoints)`，此外，ADBC V0.10 默认的 AdbcStatement 实际是 JdbcStatement，executeQuery 后将行存格式的 JDBC ResultSet 又重新转成的 Arrow 列存格式，预期到 ADBC 1.0.0 时 Java ADBC 将功能完善 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)。

7. Q: 在 URL 中指定 database name。

    A: 截止 Arrow v15.0，Arrow JDBC Connector 不支持在 URL 中指定 database name，比如 `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` 中指定连接`test` database 无效，只能手动执行 SQL `use database`。Arrow v18.0 支持了在 URL 中指定 database name，但实测仍有 BUG。

8. Q: Python ADBC print `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant`。

    A: 使用 Python 时忽略这个 Warning，这是 Python ADBC Client 的问题，不会影响查询。

9. Q: Python 报错 `grpc: received message larger than max (20748753 vs. 16777216)`。

    A: 参考 [Python: grpc: received message larger than max (20748753 vs. 16777216) #2078](https://github.com/apache/arrow-adbc/issues/2078) 在 Database Option 中增加 `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value`.

10. Q: 报错 `invalid bearer token`。

    A: 执行 `SET PROPERTY FOR 'root' 'max_user_connections' = '10000';` 修改当前用户的当前最大连接数到 10000；在 `fe.conf` 增加 qe_max_connection=30000 和 arrow_flight_token_cache_size=8000 并重启 FE。

    ADBC Client 和 Arrow Flight Server 端之间的连接本质上是个长链接，需要在 Server 缓存 Auth Token、Connection、Session，连接创建后不会在单个查询结束时立即断开，需要 Client 发送 close() 请求后清理，但实际上 Client 经常不会发送 close 请求，所以 Auth Token、Connection、Session 会长时间在 Arrow Flight Server 上保存，默认会在 3 天后超时断开，或者在连接数超过 `arrow_flight_token_cache_size` 的限制后依据 LRU 淘汰。
    
    截止 Doris v2.1.8，Arrow Flight 连接和 Mysql/JDBC 连接使用相同的连接数限制，包括 FE 所有用户的总连接数 `qe_max_connection` 和单个用户的连接数 `UserProperty` 中的 `max_user_connections`。但默认的 `qe_max_connection` 和 `max_user_connections` 分别是 1024 和 100。Arrow Flight SQL 常用来取代使用 JDBC 的场景，但 JDBC 连接会在查询结束后立即释放，所以使用 Arrow Flight SQL 时，Doris 默认的连接数限制太小，经常导致连接数超过 `arrow_flight_token_cache_size` 的限制后将仍在被使用的连接淘汰。

11. Q: 使用 JDBC 或 JAVA 连接 Arrow Flight SQL 读取 Datatime 类型返回时间戳，而不是格式化时间。

    A: JDBC 或 JAVA 连接 Arrow Flight SQL 读取 Datatime 类型需要自行转换时间戳，参考 [Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578)。用 Python Arrow Flight SQL 读取 Datatime 类型返回结果为 `2025-03-03 17:23:28Z`，而 JDBC 或 JAVA 返回 `1740993808`。

12. Q: 使用 JDBC 或 Java JDBC Client 连接 Arrow Flight SQL 读取 Array 嵌套类型报错 `Configuration does not provide a mapping for array column 2`。

    A: 参考 [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java) 使用 JAVA ADBC Client。
    
    Python ADBC Client、JAVA ADBC Client、Java JDBC DriverManager 读取 Array 嵌套类型都没问题，只有使用 JDBC 或 Java JDBC Client 连接 Arrow Flight SQL 有问题，实际上 Arrow Flight JDBC 的兼容性不好保证，不是 Arrow 官方开发的，由一个第三方数据库公司 Dremio 开发，之前还发现过其他兼容性问题，所以建议优先用 JAVA ADBC Client。

## 2.1 Release Note

> v2.1.4 及之前的版本 Doris Arrow Flight 不够完善，建议升级后使用。

### v2.1.9

1. 修复 Doris 数据序列化到 Arrow 的问题。
    [Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
    - 读取 `Decimal256` 类型失败;
    - 读取 `DatetimeV2` 类型微妙部分错误;
    - 读取 `DateV2` 类型结果不正确;
    - 读取 `IPV4/IPV6` 类型结果为 NULL 时报错;

2. 修复 Doris Arrow Flight SQL 查询失败返回空结果，没有返回真实的错误信息。
    [Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v2.1.8

1. 支持 DBeaver 等 BI 工具使用 `arrow-flight-sql` 协议连接 Doris，支持正确显示元数据树。
    [Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 支持多 BE 共享同一个可供集群外部访问的 IP 时，查询结果可以正确转发后返回 ADBC Client。
    [Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

3. 支持多个 Endpoint 并行读取。
    [Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286) 

4. 修复查询报错 `FE not found arrow flight schema`。
    [Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

5. 修复读取允许 NULL 的列报错 `BooleanBuilder::AppendValues`。
    [Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

6. 修复 `show processlist` 显示重复的 Connection ID。
    [Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

7. 修复读取 `Datetime` 和 `DatetimeV2` 类型丢失时区，导致比真实数据的 datetime 少 8 小时的问题。
    [Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v2.1.7

1. 修复频繁打印日志 `Connection wait_timeout`。
    [Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

2. 修复 Arrow Flight Bearer Token 过期后从 Cache 中淘汰。
    [Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

### v2.1.6

1. 修复查询报错 `0.0.0.0:xxx, connection refused`。
    [Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. 修复查询报错 `Reach limit of connections`。
    [Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)
    
    之前的版本执行 `SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` 修改当前用户的当前最大连接数到 1024，可临时规避。

    因为之前的版本只限制 Arrow Flight 连接数小于 `qe_max_connection/2`，`qe_max_connection` 是 fe 所有用户的总连接数，默认 1024，没有限制单个用户的 Arrow Flight 连接数小于 `UserProperty` 中的 `max_user_connections`，默认 100，所以当 Arrow Flight 连接数超过当前用户连接数上限时将报错 `Reach limit of connections`，所以需调大当前用户的 `max_user_connections`。
    
    问题详情见：[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. 增加 Conf `arrow_flight_result_sink_buffer_size_rows`，支持修改单次返回的查询结果 ArrowBatch 大小，默认 4096 * 8。
    [Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v2.1.5

1. 修复 Arrow Flight SQL 查询结果为空。
    [Fix arrow flight result sink #36827](https://github.com/apache/doris/pull/36827)

    Doris v2.1.4 读取大数据量时有几率报错，问题详情见：[Questions](https://ask.selectdb.com/questions/D1Ia1/arrow-flight-sql-shi-yong-python-de-adbc-driver-lian-jie-doris-zhi-xing-cha-xun-sql-du-qu-bu-dao-shu-ju)

## 3.0 Release Note

### v3.0.5

1. 修复 Doris 数据序列化到 Arrow 的问题。
    [Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
    - 读取 `Decimal256` 类型失败;
    - 读取 `DatetimeV2` 类型微妙部分错误;
    - 读取 `DateV2` 类型结果不正确;
    - 读取 `IPV4/IPV6` 类型结果为 NULL 时报错;

### v3.0.4

1. 支持 DBeaver 等 BI 工具使用 `arrow-flight-sql` 协议连接 Doris，支持正确显示元数据树。
    [Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 支持多个 Endpoint 并行读取。
    [Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

3. 修复读取允许 NULL 的列报错 `BooleanBuilder::AppendValues`。
    [Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

4. 修复 `show processlist` 显示重复的 Connection ID。
    [Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

5. 修复 Doris Arrow Flight SQL 查询失败返回空结果，没有返回真实的错误信息。
    [Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v3.0.3

1. 修复查询报错 `0.0.0.0:xxx, connection refused`。
    [Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. 修复查询报错 `Reach limit of connections`。
    [Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)
    
    之前的版本执行 `SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` 修改当前用户的当前最大连接数到 1024，可临时规避。

    因为之前的版本只限制 Arrow Flight 连接数小于 `qe_max_connection/2`，`qe_max_connection` 是 fe 所有用户的总连接数，默认 1024，没有限制单个用户的 Arrow Flight 连接数小于 `UserProperty` 中的 `max_user_connections`，默认 100，所以当 Arrow Flight 连接数超过当前用户连接数上限时将报错 `Reach limit of connections`，所以需调大当前用户的 `max_user_connections`。
    
    问题详情见：[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. 修复频繁打印日志 `Connection wait_timeout`。
    [Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

4. 修复 Arrow Flight Bearer Token 过期后从 Cache 中淘汰。
    [Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

5. 支持多 BE 共享同一个可供集群外部访问的 IP 时，查询结果可以正确转发后返回 ADBC Client。
    [Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

6. 修复查询报错 `FE not found arrow flight schema`。
    [Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

7. 修复读取 `Datetime` 和 `DatetimeV2` 类型丢失时区，导致比真实数据的 datetime 少 8 小时的问题。
    [Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v3.0.2

1. 增加 Conf `arrow_flight_result_sink_buffer_size_rows`，支持修改单次返回的查询结果 ArrowBatch 大小，默认 4096 * 8。
    [Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v3.0.1

1. 查询结果缺失，查询结果行数 = 实际行数 / BE 个数
    [Fix get Schema failed when enable_parallel_result_sink is false #37779](https://github.com/apache/doris/pull/37779) 

    在 Doris 3.0.0 版本，如果查询最外层是聚合，SQL 类似 `select k1, sum(k2) from xxx group by k1`，你可能会遇到（查询结果行数 = 实际行数 / BE 个数），这是 [support parallel result sink](https://github.com/apache/doris/pull/36053) 引入的问题，在 [Fix get Schema failed when enable_parallel_result_sink is false](https://github.com/apache/doris/pull/37779) 临时修复，在 [Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286) 支持多个 Endpoint 并行读取后正式修复。
