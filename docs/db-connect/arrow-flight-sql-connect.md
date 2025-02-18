---
{
    "title": "Connecting by Arrow Flight SQL Protocol",
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

Since Doris 2.1, a high-speed data link based on the Arrow Flight SQL protocol has been implemented, allowing SQL queries to rapidly retrieve large volumes of data from Doris in multiple languages. Arrow Flight SQL also provides a universal JDBC driver, supporting seamless interaction with databases that also follow the Arrow Flight SQL protocol. In some scenarios, performance can improve by up to a hundred times compared to data transfer solutions using MySQL Client or JDBC/ODBC drivers.

## Implementation Principle

In Doris, query results are organized in columnar format as Blocks. In versions prior to 2.1, data could be transferred to the target client via MySQL Client or JDBC/ODBC drivers, but this required deserializing row-based Bytes into columnar format. By building a high-speed data transfer link based on Arrow Flight SQL, if the target client also supports Arrow columnar format, the entire transfer process avoids serialization and deserialization operations, completely eliminating the time and performance overhead associated with them.

![Arrow_Flight_SQL](/images/db-connect/arrow-flight-sql/Arrow_Flight_SQL.png)

To install Apache Arrow, you can find detailed installation instructions in the official documentation [Apache Arrow](https://arrow.apache.org/install/). For more information on how Doris implements the Arrow Flight protocol, you can refer to [Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514).


## Python Usage

Use Python's ADBC ​​Driver to connect to Doris to achieve extremely fast data reading. The following steps use Python (version >= 3.9) ADBC ​​Driver to perform a series of common database syntax operations, including DDL, DML, setting Session variables, and Show statements.

### Install Library

The library is published on PyPI and can be easily installed in the following ways:

```
pip install adbc_driver_manager
pip install adbc_driver_flightsql
```

Import the following modules/libraries in the code to use the installed Library:

```Python
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

>>> print(adbc_driver_manager.__version__)
1.1.0
>>> print(adbc_driver_flightsql.__version__)
1.1.0
```

### Connect to Doris

Create a client to interact with the Doris Arrow Flight SQL service. You need to provide Doris FE's Host, Arrow Flight Port, login username and password, and perform the following configuration.
Modify the configuration parameters of Doris FE and BE:

- Modify arrow_flight_sql_port in fe/conf/fe.conf to an available port, such as 9090.
- Modify arrow_flight_sql_port in be/conf/be.conf to an available port, such as 9091.

`Note: arrow_flight_sql_port configured in fe.conf and be.conf are different`

Assuming that the Arrow Flight SQL services of FE and BE in the Doris instance will run on ports 9090 and 9091 respectively, and the Doris username/password is "user"/"pass", the connection process is as follows:

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```

After the connection is completed, the returned Cursor can be used to interact with Doris through SQL to perform operations such as creating tables, obtaining metadata, importing data, and querying.

### Create a table and get metadata

Pass Query to the cursor.execute() function to execute the table creation and metadata acquisition operations:

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

If StatusResult returns 0, it means that the Query is executed successfully (the reason for this design is to be compatible with JDBC).

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

### Import data

Execute INSERT INTO to import a small amount of test data into the created table:

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```

The following proves that the import was successful:

```
  StatusResult
0            0
```

If you need to import large amounts of data into Doris, you can use pydoris to perform Stream Load.

### Execute a query

Then query the table imported above, including operations such as aggregation, sorting, and Set Session Variable.

```Python
cursor.execute("select * from arrow_flight_sql_test order by k0;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("set exec_mem_limit=2000;")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("show variables like \"%exec_mem_limit%\";")
print(cursor.fetchallarrow().to_pandas())

cursor.execute("select k5, sum(k1), count(1), avg(k3) from arrow_flight_sql_test group by k5;")
print(cursor.fetchallarrow().to_pandas())
```

The result is as follows:

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

### Complete code

```Python
# Doris Arrow Flight SQL Test

# step 1, library is released on PyPI and can be easily installed.
# pip install adbc_driver_manager
# pip install adbc_driver_flightsql
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

# step 2, create a client that interacts with the Doris Arrow Flight SQL service.
# Modify arrow_flight_sql_port in fe/conf/fe.conf to an available port, such as 9090.
# Modify arrow_flight_sql_port in be/conf/be.conf to an available port, such as 9091.
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

## Jdbc Connector with Arrow Flight SQL

The open source JDBC driver of Arrow Flight SQL protocol is compatible with the standard JDBC API, which can be used by most BI tools to access Doris through JDBC and supports high-speed transmission of Apache Arrow data. The usage is similar to connecting to Doris through the JDBC driver of MySQL protocol. You only need to replace the jdbc:mysql protocol in the link URL with the jdbc:arrow-flight-sql protocol. The query results are still returned in the JDBC ResultSet data structure.

POM dependency:
```Java
<properties>
    <arrow.version>15.0.1</arrow.version>
</properties>
<dependencies>
    <dependency>
        <groupId>org.apache.arrow</groupId>
        <artifactId>flight-sql-jdbc-core</artifactId>
        <version>${arrow.version}</version>
    </dependency>
</dependencies>
```

The connection code example is as follows:

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

## Java Usage

In addition to using JDBC, similar to Python, JAVA can also create a Driver to read Doris and return data in Arrow format. The following are how to use AdbcDriver and JdbcDriver to connect to Doris Arrow Flight Server.

POM dependency:
```Java
<properties>
    <adbc.version>0.12.0</adbc.version>
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

The connection code example is as follows:

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

When using Java 9 or later, some JDK internals must be exposed by adding --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED to the java command:

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED" java -jar ...
```

Otherwise, you may see some errors such as `module java.base does not "opens java.nio" to unnamed module` or `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` or `ava.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

If you debug in IntelliJ IDEA, you need to add `--add-opens=java.base/java.nio=ALL-UNNAMED` in `Build and run` of `Run/Debug Configurations`, refer to the picture below:

![IntelliJ IDEA](https://github.com/user-attachments/assets/7439ee6d-9013-40bf-89af-0365925d3fdb)

The connection code example is as follows:

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

### Choice of Jdbc and Java connection methods

Compared with the traditional `jdbc:mysql` connection method, the performance test of the Arrow Flight SQL connection method of Jdbc and Java can be found at [GitHub Issue](https://github.com/apache/doris/issues/25514). Here are some usage suggestions based on the test conclusions.

1. For the above three Java Arrow Flight SQL connection methods, if the subsequent data analysis will be based on the row-based data format, then use jdbc:arrow-flight-sql, which will return data in the JDBC ResultSet format; if the subsequent data analysis can be based on the Arrow format or other column-based data formats, then use Flight AdbcDriver or Flight JdbcDriver to directly return data in the Arrow format, which will avoid row-column conversion and use the characteristics of Arrow to accelerate data parsing.

2. Whether parsing data in JDBC ResultSet or Arrow format, the time spent is longer than the time spent reading data. If the performance of Arrow Flight SQL is not as expected and the improvement is limited compared with `jdbc:mysql://`, you may want to analyze whether it takes too long to parse the data.

3. For all connection methods, JDK 17 reads data faster than JDK 1.8.

4. When reading a large amount of data, Arrow Flight SQL will use less memory than `jdbc:mysql://`, so if you are troubled by insufficient memory, you can also try Arrow Flight SQL.

5. In addition to the above three connection methods, you can also use the native FlightClient to connect to Arrow Flight Server, which can read multiple endpoints in parallel more flexibly. Flight AdbcDriver is also a link created based on FlightClient, which is simpler than using FlightClient directly.

## Interaction with other big data components

### Spark & ​​Flink

Arrow Flight currently has no official plan to support Spark and Flink ([GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)). Since version 24.0.0, Doris' own [Spark Connector](https://github.com/apache/doris-spark-connector) and [Flink Connector](https://github.com/apache/doris-flink-connector) have supported accessing Doris via Arrow Flight SQL, and it is expected that this will improve the reading performance several times.

The community previously referred to the open source [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) and used FlightClient in Spark to connect to Doris for testing. It was found that the data format conversion between Arrow and Doris Block is faster, which is 10 times the conversion speed between CSV format and Doris Block, and it has better support for complex types such as Map and Array. This is because the Arrow data format has a high compression rate and low network overhead during transmission. However, Doris Arrow Flight has not yet implemented multi-node parallel reading. It still aggregates query results to a BE node and returns them. For simple batch export of data, the performance may not be as fast as Doris Spark Connector, which supports Tablet-level parallel reading. If you want to use Arrow Flight SQL to connect to Doris in Spark, you can refer to the open-sourced [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) and [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector) to implement it yourself.

## FAQ

1. ARM environment reports an error `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client`. If the Linux kernel version is <= 4.19.90, you need to upgrade to 4.19.279 or above, or recompile Doris BE in the environment of the lower version of the Linux kernel. For specific compilation methods, refer to the document <docs/dev/install/source-install/compilation-arm>

Problem cause: This is because there is a compatibility issue between the old version of the Linux kernel and Arrow. `cpp: arrow::RecordBatch::MakeEmpty()` will get stuck when constructing Arrow Record Batch, causing Doris BE's Arrow Flight Server to fail to respond to Doris FE's Arrow Flight Server RPC request within 5000ms, causing FE to return rpc timeout failed to Client. When Spark and Flink read Doris, they also convert the query results into Arrow Record Batch and return them, so the same problem exists.

The Linux kernel version of kylinv10 SP2 and SP3 is only up to 4.19.90-24.4.v2101.ky10.aarch64. You cannot continue to upgrade the kernel version. You can only recompile Doris BE on kylinv10. If the problem still exists after compiling Doris BE with the new version of ldb_toolchain, you can try to compile it with the lower version of ldb_toolchain v0.17. If your ARM environment cannot connect to the Internet, Huawei Cloud provides ARM + kylinv10, and Alibaba Cloud provides x86 + kylinv10

2. Currently, `jdbc:arrow-flight-sql` and Java ADBC/JDBCDriver do not support prepared statement passing parameters. For example, `select * from xxx where id=?` will report an error `parameter ordinal 1 out of range`. This is a bug in Arrow Flight SQL ([GitHub Issue](https://github.com/apache/arrow/issues/40118))

3. Modification `jdbc:arrow-flight-sql` The batch size of each read can improve performance in some scenarios. By modifying the `setTargetBatchSize` in the `makeJdbcConfig` method in the `org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader` file, the default is 1024, and then saving the modified file to the local directory with the same name, it will overwrite the original file to take effect.

4. ADBC ​​v0.10, JDBC and Java ADBC/JDBCDriver do not support parallel reading, and the `stmt.executePartitioned()` method is not implemented. You can only use the native FlightClient to implement parallel reading of multiple Endpoints, using the method `sqlClient=new FlightSqlClient, execute=sqlClient.execute(sql), endpoints=execute.getEndpoints(), for(FlightEndpoint endpoint: endpoints)`. In addition, the default AdbcStatement of ADBC ​​V0.10 is actually JdbcStatement. After executeQuery, the row-format JDBC ResultSet is converted back to the Arrow column-format. It is expected that Java ADBC ​​will be fully functional by ADBC ​​1.0.0 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490).

5. As of Arrow v15.0, Arrow JDBC Connector does not support specifying the database name in the URL. For example, `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` specifies that the connection to the `test` database is invalid. You can only execute the SQL `use database` manually.

6. There is a bug in Doris 2.1.4 version. There is a chance of error when reading large amounts of data. This bug is fixed in [Fix arrow flight result sink #36827](https://github.com/apache/doris/pull/36827) PR. Upgrading Doris 2.1.5 version can solve this problem. For details of the problem, see: [Questions](https://ask.selectdb.com/questions/D1Ia1/arrow-flight-sql-shi-yong-python-de-adbc-driver-lian-jie-doris-zhi-xing-cha-xun-sql-du-qu-bu-dao-shu-ju)

7. `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant` Ignore this warning when using Python. This is a problem with the Python ADBC ​​Client and will not affect the query.

8. Python reports an error `grpc: received message larger than max (20748753 vs. 16777216)`. Refer to [Python: grpc: received message larger than max (20748753 vs. 16777216) #2078](https://github.com/apache/arrow-adbc/issues/2078) to add `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value` in Database Option.

9. Before Doris version 2.1.7, the error `Reach limit of connections` is reported. This is because there is no limit on the number of Arrow Flight connections for a single user, which is less than `max_user_connections` in `UserProperty`, which is 100 by default. You can modify the current maximum number of connections for Billie user to 100 by `SET PROPERTY FOR 'Billie' 'max_user_connections' = '1000';`, or add `arrow_flight_token_cache_size=50` in `fe.conf` to limit the overall number of Arrow Flight connections. Before Doris version 2.1.7, Arrow Flight connections are disconnected after a default timeout of 3 days. It only forces the number of connections to be less than `qe_max_connection/2`. If the number of connections exceeds the limit, they will be eliminated according to lru. `qe_max_connection` is the total number of connections for all fe users, which is 1024 by default. For details, see the introduction of the conf `arrow_flight_token_cache_size`. Fixed in [Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127). For details, please see: [Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie- shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)
