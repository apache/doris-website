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

![Arrow Flight SQL](/images/db-connect/arrow-flight-sql/Arrow_Flight_SQL.png)

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

- Modify arrow_flight_sql_port in fe/conf/fe.conf to an available port, such as 8070.
- Modify arrow_flight_sql_port in be/conf/be.conf to an available port, such as 8050.

`Note: The arrow_flight_sql_port port number configured in fe.conf and be.conf is different`

After modifying the configuration and restarting the cluster, searching for `Arrow Flight SQL service is started` in the fe/log/fe.log file indicates that the Arrow Flight Server of FE has been successfully started; searching for `Arrow Flight Service bind to host` in the be/log/be.INFO file indicates that the Arrow Flight Server of BE has been successfully started.

Assuming that the Arrow Flight SQL services of FE and BE in the Doris instance will run on ports 8070 and 8050 respectively, and the Doris username/password is "user"/"pass", the connection process is as follows:

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
print(cursor.fetch_df())
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

**Note:** To fetch query results, you need to use `cursor.fetchallarrow()` to return the arrow format, or use `cursor.fetch_df()` to directly return the pandas dataframe, which will keep the data in column format. Do not use `cursor.fetchall()`, otherwise the column format data will be converted back to row format, which is essentially the same as using mysql-client. In fact, due to the extra column-to-row conversion operation on the client side, it may be slower than mysql-client.

### Complete code

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

## Jdbc Connector with Arrow Flight SQL

The open source JDBC driver of Arrow Flight SQL protocol is compatible with the standard JDBC API, which can be used by most BI tools to access Doris through JDBC and supports high-speed transmission of Apache Arrow data. The usage is similar to connecting to Doris through the JDBC driver of MySQL protocol. You only need to replace the jdbc:mysql protocol in the link URL with the jdbc:arrow-flight-sql protocol. The query results are still returned in the JDBC ResultSet data structure.

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

**Note:** When using Java 9 or later, you must expose some JDK internal structures by adding `--add-opens=java.base/java.nio=ALL-UNNAMED` to the Java command, otherwise you may see some errors such as `module java.base does not "opens java.nio" to unnamed module` or `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` or `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=ALL-UNNAMED" java -jar ...
```

If debugging in IntelliJ IDEA, you need to add `--add-opens=java.base/java.nio=ALL-UNNAMED` in `Build and run` of `Run/Debug Configurations`, refer to the picture below:

![arrow-flight-sql-IntelliJ](/images/db-connect/arrow-flight-sql/arrow-flight-sql-IntelliJ.png)

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

[JDBC/Java Arrow Flight SQL Sample](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) is a JDBC/Java demo using Arrow FLight SQL. You can use it to test various connection methods for sending queries to Arrow Flight Server, helping you understand how to use Arrow FLight SQL and test performance. For expected execution results, see [Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306).

Compared with the traditional `jdbc:mysql` connection method, the performance test of the Arrow Flight SQL connection method of Jdbc and Java can be found in Section 6.2 of [GitHub Issue](https://github.com/apache/doris/issues/25514). Here are some usage suggestions based on the test conclusions.

1. For the above three Java Arrow Flight SQL connection methods, if the subsequent data analysis will be based on the row-based data format, then use jdbc:arrow-flight-sql, which will return data in the JDBC ResultSet format; if the subsequent data analysis can be based on the Arrow format or other column-based data formats, then use Flight AdbcDriver or Flight JdbcDriver to directly return data in the Arrow format, which will avoid row-column conversion and use the characteristics of Arrow to accelerate data parsing.

2. Whether parsing data in JDBC ResultSet or Arrow format, the time spent is longer than the time spent reading data. If the performance of Arrow Flight SQL is not as expected and the improvement is limited compared with `jdbc:mysql://`, you may want to analyze whether it takes too long to parse the data.

3. For all connection methods, JDK 17 reads data faster than JDK 1.8.

4. When reading a large amount of data, Arrow Flight SQL will use less memory than `jdbc:mysql://`, so if you are troubled by insufficient memory, you can also try Arrow Flight SQL.

5. In addition to the above three connection methods, you can also use the native FlightClient to connect to Arrow Flight Server, which can read multiple endpoints in parallel more flexibly. Flight AdbcDriver is also a link created based on FlightClient, which is simpler than using FlightClient directly.

## Interaction with other big data components

### Spark & ​​Flink

Arrow Flight currently has no official plan to support Spark and Flink ([GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)). Since version 24.0.0, Doris' own [Spark Connector](https://github.com/apache/doris-spark-connector) and [Flink Connector](https://github.com/apache/doris-flink-connector) have supported accessing Doris via Arrow Flight SQL, and it is expected that this will improve the reading performance several times.

The community previously referred to the open source [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) and used FlightClient in Spark to connect to Doris for testing. It was found that the data format conversion between Arrow and Doris Block is faster, which is 10 times the conversion speed between CSV format and Doris Block, and it has better support for complex types such as Map and Array. This is because the Arrow data format has a high compression rate and low network overhead during transmission. However, Doris Arrow Flight has not yet implemented multi-node parallel reading. It still aggregates query results to a BE node and returns them. For simple batch export of data, the performance may not be as fast as Doris Spark Connector, which supports Tablet-level parallel reading. If you want to use Arrow Flight SQL to connect to Doris in Spark, you can refer to the open-sourced [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) and [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector) to implement it yourself.

### Support BI tools

Since Doris v2.1.8, BI tools such as DBeaver are supported to connect to Doris using the `arrow-flight-sql` protocol. For DBeaver's method of connecting to Doris using the `arrow-flight-sql` Driver, refer to: [how-to-use-jdbc-driver-with-dbeaver-client](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client), [client-applications/clients/dbeaver/](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg).

## Extended Application

### Multiple BEs return results in parallel

Doris will aggregate the results of a query on all BE nodes to one BE node by default. In Mysql/JDBC queries, FE will request query results from this aggregated data node. In Arrow Flight SQL queries, FE will wrap the IP/Port of this node in the Endpoint and return it to ADBC ​​Client. ADBC ​​Client will request the BE node corresponding to this Endpoint to pull data.

If the query is just a simple Select to pull data from Doris, without Join, Sort, Window Function and other operators with data Shuffle behavior, the query can be split according to Tablet granularity. Now Doris Spark/Flink Connector uses this method to implement parallel data reading, which is divided into two steps:
1. Execute `explain sql`, and the ScanOperator in the query plan returned by FE contains all Tablet ID Lists of Scan.
2. Split the original SQL into multiple SQLs based on the Tablet ID List above. Each SQL only reads part of the Tablet. The usage is similar to `SELECT * FROM t1 TABLET(10001,10002) limit 1000;`. The multiple SQLs after splitting can be executed in parallel. Refer to [Support select table sample](https://github.com/apache/doris/pull/10170).

If the outermost layer of the query is aggregation, the SQL is similar to `select k1, sum(k2) from xxx group by k1`. After Doris v3.0.4, execute `set enable_parallel_result_sink=true;` to allow each BE node of a query to return query results independently. After receiving the Endpoint list returned by FE, ADBC ​​Client pulls results from multiple BE nodes in parallel. However, please note that when the aggregation result is very small, returning multiple BEs will increase the pressure on RPC. For specific implementation, please refer to [support parallel result sink](https://github.com/apache/doris/pull/36053). In theory, except for the outermost query which is sorted, other queries can support each BE node to return results in parallel, but there is no need for this convenience at present, and no further implementation has been made.

### Multiple BEs share the same IP accessible from outside the cluster

If there is a Doris cluster, its FE nodes can be accessed from outside the cluster, and all its BE nodes can only be accessed from within the cluster. This is fine when using Mysql Client and JDBC to connect to Doris to execute queries, and the query results will be returned by the Doris FE node. However, using Arrow Flight SQL to connect to Doris will not work because the ADBC ​​Client needs to connect to the Doris BE node to pull the query results, but the Doris BE node is not allowed to be accessed from outside the cluster.

In a production environment, it is often inconvenient to expose the Doris BE node outside the cluster. However, you can add a reverse proxy (such as Nginx) to all Doris BE nodes. When the client outside the cluster connects to Nginx, it will be randomly routed to a Doris BE node. By default, the Arrow Flight SQL query results will be randomly saved on a Doris BE node. If it is different from the Doris BE node randomly routed by Nginx, data forwarding is required within the Doris BE node.

Starting from Doris v2.1.8, you can configure `public_host` and `arrow_flight_sql_proxy_port` in `be.conf` of all Doris BE nodes to the IP and port shared by multiple Doris BE nodes and accessible outside the cluster. The query results can be correctly forwarded and returned to the ADBC ​​Client.
```conf
public_host={nginx ip}
arrow_flight_sql_proxy_port={nginx port}
```

## FAQ

1. Q: Error `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"`.

A: If `<ip:arrow_flight_port>` in the error message is the IP and arrow-flight-port of the Doris FE node,

First check whether the arrow-flight-server of the Doris FE node is started normally. Searching for `Arrow Flight SQL service is started` in the fe/log/fe.log file indicates that the Arrow Flight Server of FE is started successfully.

If the arrow-flight-server of the Doris FE node is started normally, check whether the machine where the Client is located can `ping` the IP in the error message `<ip:arrow_flight_port>`. If it cannot be `ping`ed, you need to open an externally accessible IP for the Doris FE node and redeploy the cluster.

A: If the `<ip:arrow_flight_port>` in the error message is the IP and arrow-flight-port of the Doris BE node.

First check whether the arrow-flight-server of the Doris BE node is started normally. Searching for `Arrow Flight Service bind to host` in the be/log/be.INFO file indicates that the Arrow Flight Server of BE is started successfully.

If the arrow-flight-server of the Doris BE node starts normally, check whether the client machine can `ping` the IP in the `<ip:arrow_flight_port>` reported in the error message. If it cannot be `ping`, if it is known that the Doris BE node is in an intranet that cannot be accessed externally, the following two methods are used:

- Consider opening an externally accessible IP for each Doris BE node. Starting from Doris v2.1.8, you can configure `public_host` to this IP in the `be.conf` of this Doris BE node. Similarly, configure the `public_host` of all Doris BE nodes to the IP of the corresponding BE node that can be accessed by the client.

- Refer to the above section [Multiple BEs share the same IP that can be accessed externally by the cluster] to add a layer of reverse proxy for all Doris BE nodes.

If it is not clear whether Doris BE is completely in the intranet, check the connectivity between the client machine and other IPs of the machine where the Doris BE node is located. Execute `ifconfig` on the machine where the Doris BE node is located to return all the IPs of the current machine. One of the IPs should be the same as the IP in `<ip:arrow_flight_port>` and the same as the IP of the Doris BE node printed by `show backends`. `ping` the other IPs returned by `ifconfig` in turn. If the Doris BE node has an IP that can be accessed by the Client, refer to the above to configure this IP as `public_host`. If all IPs of the Doris BE node cannot be accessed by the Client, then the Doris BE node is completely in the intranet.

2. Q: When using JDBC or JAVA to connect to Arrow Flight SQL, an error message appears: `module java.base does not "opens java.nio" to unnamed module` or `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` or `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

A: First check whether `JAVA_OPTS_FOR_JDK_17` in fe/conf/fe.conf contains `--add-opens=java.base/java.nio=ALL-UNNAMED`. If not, add it. Then refer to the notes in [JDBC Connector with Arrow Flight SQL] above and add `--add-opens=java.base/java.nio=ALL-UNNAMED` in the Java command. If debugging in IntelliJ IDEA, you need to add `--add-opens=java.base/java.nio=ALL-UNNAMED` in `Build and run` of `Run/Debug Configurations`.

3. Q: The ARM environment reports an error `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client`.

A: If the Linux kernel version is <= 4.19.90, you need to upgrade to 4.19.279 or above, or recompile Doris BE in the environment of the lower version of the Linux kernel. For specific compilation methods, refer to the document <docs/dev/install/source-install/compilation-arm>

Cause: This is because there is a compatibility issue between the old version of the Linux kernel and Arrow. `cpp: arrow::RecordBatch::MakeEmpty()` will get stuck when constructing Arrow Record Batch, causing Doris BE's Arrow Flight Server to fail to respond to Doris FE's Arrow Flight Server's RPC request within 5000ms, causing FE to return rpc timeout failed to Client. When Spark and Flink read Doris, they also convert the query results into Arrow Record Batch and return them, so the same problem exists.

The Linux kernel version of kylinv10 SP2 and SP3 is only 4.19.90-24.4.v2101.ky10.aarch64 at most. The kernel version cannot be upgraded further. Doris BE can only be recompiled on kylinv10. If the problem still exists after compiling Doris BE with the new version of ldb_toolchain, you can try to compile it with the lower version of ldb_toolchain v0.17. If your ARM environment cannot connect to the external network, Huawei Cloud provides ARM + kylinv10, and Alibaba Cloud provides x86 + kylinv10

4. Q: Prepared statement passes parameters and reports errors.

A: Currently, `jdbc:arrow-flight-sql` and Java ADBC/JDBCDriver do not support prepared statement parameter passing. For example, `select * from xxx where id=?` will report an error `parameter ordinal 1 out of range`. This is a bug in Arrow Flight SQL ([GitHub Issue](https://github.com/apache/arrow/issues/40118)).

5. Q: How to modify the batch size read by `jdbc:arrow-flight-sql` each time to improve performance in some scenarios.

A: By modifying `setTargetBatchSize` in the `makeJdbcConfig` method in the `org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader` file, the default is 1024, and then saving the modified file to the local directory with the same path name, so as to overwrite the original file and take effect.

6. Q: ADBC ​​v0.10, JDBC and Java ADBC/JDBCDriver do not support parallel reading.

A: The `stmt.executePartitioned()` method is not implemented. You can only use the native FlightClient to implement parallel reading of multiple endpoints, using the method `sqlClient=new FlightSqlClient, execute=sqlClient.execute(sql), endpoints=execute.getEndpoints(), for(FlightEndpoint endpoint: endpoints)`. In addition, the default AdbcStatement of ADBC ​​V0.10 is actually JdbcStatement. After executeQuery, the row-format JDBC ResultSet is converted back to the Arrow column format. It is expected that Java ADBC ​​will be fully functional by ADBC ​​1.0.0 [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490).

7. Q: Specify the database name in the URL.

A: As of Arrow v15.0, Arrow JDBC Connector does not support specifying database name in URL. For example, specifying connection to `test` database in `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` is invalid, and you can only execute SQL `use database` manually. Arrow v18.0 supports specifying database name in URL, but there are still bugs in actual testing.

8. Q: Python ADBC ​​prints `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant`.

A: Ignore this Warning when using Python. This is a problem with Python ADBC ​​Client and will not affect queries.

9. Q: Python reports an error `grpc: received message larger than max (20748753 vs. 16777216)`.

A: Refer to [Python: grpc: received message larger than max (20748753 vs. 16777216) #2078](https://github.com/apache/arrow-adbc/issues/2078) and add `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value` in Database Option.

10. Q: Error `invalid bearer token` is reported.

A: Execute `SET PROPERTY FOR 'root' 'max_user_connections' = '10000';` to change the current maximum number of connections for the current user to 10000; add qe_max_connection=30000 and arrow_flight_token_cache_size=8000 in `fe.conf` and restart FE.

The connection between the ADBC ​​Client and the Arrow Flight Server is essentially a long link, which requires Auth Token, Connection, and Session to be cached on the Server. After the connection is created, it will not be disconnected immediately at the end of a single query. The Client needs to send a close() request to clean it up, but in fact, the Client often does not send a close request, so the Auth Token, Connection, and Session will be saved on the Arrow Flight Server for a long time. By default, they will time out and disconnect after 3 days, or be eliminated according to LRU after the number of connections exceeds the limit of `arrow_flight_token_cache_size`.

As of Doris v2.1.8, Arrow Flight connections and Mysql/JDBC connections use the same connection limit, including the total number of connections of all FE users `qe_max_connection` and the number of connections of a single user `max_user_connections` in `UserProperty`. But the default `qe_max_connection` and `max_user_connections` are 1024 and 100 respectively. Arrow Flight SQL is often used to replace JDBC scenarios, but the JDBC connection will be released immediately after the query ends. Therefore, when using Arrow Flight SQL, the default connection limit of Doris is too small, which often causes the connection number to exceed the limit of `arrow_flight_token_cache_size` and the connections still in use to be eliminated.

11. Q: Using JDBC or JAVA to connect Arrow Flight SQL to read Datatime type returns a timestamp instead of a formatted time.

A: Using JDBC or JAVA to connect Arrow Flight SQL to read Datatime type requires converting the timestamp yourself, refer to [Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578). Using Python Arrow Flight SQL to read Datatime type returns the result of `2025-03-03 17:23:28Z`, while JDBC or JAVA returns `1740993808`.

12. Q: Using JDBC or Java JDBC Client to connect Arrow Flight SQL to read Array nested type returns an error `Configuration does not provide a mapping for array column 2`.

A: Refer to [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java) to use JAVA ADBC ​​Client.

Python ADBC ​​Client, JAVA ADBC ​​Client, and Java JDBC DriverManager are all OK for reading Array nested types. Only when JDBC or Java JDBC Client is used to connect to Arrow Flight SQL, there is a problem. In fact, the compatibility of Arrow Flight JDBC is not guaranteed. It is not officially developed by Arrow, but by a third-party database company Dremio. Other compatibility issues have been found before, so it is recommended to use JAVA ADBC ​​Client first.

## 2.1 Release Note

> Doris Arrow Flight is not perfect in versions v2.1.4 and earlier, so it is recommended to upgrade before use.

### v2.1.9

1. Fix the problem of Doris data serialization to Arrow.
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- Failed to read `Decimal256` type;
- Subtle error in reading `DatetimeV2` type;
- Incorrect result in reading `DateV2` type;
- Error when reading `IPV4/IPV6` type result is NULL;

2. Fix the problem that Doris Arrow Flight SQL query fails and returns empty result, without returning real error information.
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v2.1.8

1. Support BI tools such as DBeaver to connect to Doris using the `arrow-flight-sql` protocol, and support the correct display of metadata trees.
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217).

2. When multiple BEs share the same IP that is accessible to the outside of the cluster, the query results can be correctly forwarded and returned to the ADBC ​​Client.
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

3. Support multiple endpoints to read in parallel.
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

4. Fix query error `FE not found arrow flight schema`.
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

5. Fix error `BooleanBuilder::AppendValues` when reading columns that allow NULL.
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

6. Fix `show processlist` displays duplicate Connection IDs.
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

7. Fix the problem that the time zone is lost when reading `Datetime` and `DatetimeV2` types, resulting in a datetime that is 8 hours less than the actual data.
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v2.1.7

1. Fix frequent log printing `Connection wait_timeout`.
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

2. Fix Arrow Flight Bearer Token expiration from Cache.
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

### v2.1.6

1. Fix query error `0.0.0.0:xxx, connection refused`.
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. Fix query error `Reach limit of connections`.
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

In previous versions, execute `SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` to modify the current maximum number of connections for the current user to 1024, which can be temporarily circumvented.

Because the previous version only limits the number of Arrow Flight connections to less than `qe_max_connection/2`, `qe_max_connection` is the total number of connections for all fe users, the default is 1024, and does not limit the number of Arrow Flight connections for a single user to less than `max_user_connections` in `UserProperty`, the default is 100, so when the number of Arrow Flight connections exceeds the upper limit of the current user's connection number, an error `Reach limit of connections` will be reported, so the current user's `max_user_connections` needs to be increased.

For details of the problem, see: [Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. Add Conf `arrow_flight_result_sink_buffer_size_rows` to support modifying the ArrowBatch size of query results returned in a single time, the default is 4096 * 8.
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v2.1.5

1. Fix the problem that Arrow Flight SQL query results are empty.
[Fix arrow flight result sink #36827](https://github.com/apache/doris/pull/36827)

Doris v2.1.4 may report an error when reading large amounts of data. For details, see: [Questions](https://ask.selectdb.com/questions/D1Ia1/arrow-flight-sql-shi-yong-python-de-adbc-driver-lian-jie-doris-zhi-xing-cha-xun-sql-du-qu-bu-dao-shu-ju)

## 3.0 Release Note

### v3.0.5

1. Fix the problem of serializing Doris data to Arrow.
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- Failed to read `Decimal256` type;
- Subtle error in reading `DatetimeV2` type;
- Incorrect result in reading `DateV2` type;
- Error when reading `IPV4/IPV6` type result is NULL;

### v3.0.4

1. Support DBeaver and other BI tools to connect to Doris using `arrow-flight-sql` protocol, and support correct display of metadata tree.
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217).

2. Support multiple endpoints to read in parallel.
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

3. Fix the error `BooleanBuilder::AppendValues` when reading columns that allow NULL.
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

4. Fix `show processlist` to display duplicate Connection IDs.
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

5. Fix Doris Arrow Flight SQL query failed and returned empty results, without returning real error information.
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v3.0.3

1. Fix query error `0.0.0.0:xxx, connection refused`.
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. Fix query error `Reach limit of connections`.
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

In previous versions, execute `SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` to modify the current maximum number of connections for the current user to 1024, which can be temporarily circumvented.

Because the previous version only limits the number of Arrow Flight connections to less than `qe_max_connection/2`, `qe_max_connection` is the total number of connections for all fe users, the default is 1024, and does not limit the number of Arrow Flight connections for a single user to less than `max_user_connections` in `UserProperty`, the default is 100, so when the number of Arrow Flight connections exceeds the upper limit of the current user's connection number, an error `Reach limit of connections` will be reported, so the current user's `max_user_connections` needs to be increased.

For details of the problem, see: [Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. Fix frequent printing of log `Connection wait_timeout`.
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

4. Fix Arrow Flight Bearer Token being eliminated from Cache after expiration.
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

5. When multiple BEs share the same IP address accessible from outside the cluster, the query results can be correctly forwarded and returned to the ADBC ​​Client.
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

6. Fix the query error `FE not found arrow flight schema`.
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

7. Fix the problem that the time zone is lost when reading `Datetime` and `DatetimeV2` types, resulting in a datetime that is 8 hours less than the actual data.
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v3.0.2

1. Added Conf `arrow_flight_result_sink_buffer_size_rows` to support modifying the ArrowBatch size of query results returned in a single transaction, the default is 4096 * 8.
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v3.0.1

1. Query results are missing, query result rows = actual number of rows / number of BEs
[Fix get Schema failed when enable_parallel_result_sink is false #37779](https://github.com/apache/doris/pull/37779)

In Doris 3.0.0, if the outermost layer of the query is an aggregation, the SQL is similar to `select k1, sum(k2) from xxx group by k1`, you may encounter (query result rows = actual number of rows / number of BEs), which is a problem introduced by [support parallel result sink](https://github.com/apache/doris/pull/36053). In [Fix get Schema failed when enable_parallel_result_sink is false](https://github.com/apache/doris/pull/37779) is a temporary fix, which will be officially fixed after [Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286) supports parallel reading of multiple endpoints.
