---
{
  "title": "Arrow Flight SQL プロトコルによる接続",
  "description": "Doris 2.1以降、Arrow Flight SQLプロトコルに基づく高速データリンクが実装されています。",
  "language": "ja"
}
---
Doris 2.1以降、Arrow Flight SQLプロトコルに基づく高速データリンクが実装され、複数の言語でDorisから大量のデータを迅速に取得するSQLクエリが可能になりました。Arrow Flight SQLは汎用JDBCドライバも提供し、Arrow Flight SQLプロトコルに準拠した他のデータベースとのシームレスな連携をサポートします。一部のシナリオでは、MySQL ClientやJDBC/ODBCドライバを使用するデータ転送ソリューションと比較して、パフォーマンスが最大100倍向上することがあります。

## 実装原理

Dorisでは、クエリ結果はBlocksとして列形式で整理されます。バージョン2.1以前では、MySQL ClientやJDBC/ODBCドライバを介してターゲットクライアントにデータを転送できましたが、これには行ベースのBytesを列形式に逆シリアル化する必要がありました。Arrow Flight SQLに基づく高速データ転送リンクを構築することで、ターゲットクライアントもArrow列形式をサポートしている場合、転送プロセス全体でシリアル化および逆シリアル化操作を回避し、それらに関連する時間とパフォーマンスのオーバーヘッドを完全に排除できます。

![Arrow_Flight_SQL](/images/db-connect/arrow-flight-sql/Arrow_Flight_SQL.png)

Apache Arrowをインストールするには、公式ドキュメント[Apache Arrow](https://arrow.apache.org/install/)で詳細なインストール手順を確認できます。DorisがArrow Flightプロトコルを実装する方法の詳細については、[Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514)を参照してください。

## Python使用方法

PythonのADBC DriverでDorisに接続し、極めて高速なデータ読み取りを実現します。以下の手順では、Python（バージョン >= 3.9）ADBC Driverを使用して、DDL、DML、Session変数の設定、Show文を含む一般的なデータベース構文操作を実行します。

### ライブラリのインストール

このライブラリはPyPI上で公開されており、以下の方法で簡単にインストールできます：

```
pip install adbc_driver_manager
pip install adbc_driver_flightsql
```
インストールされたライブラリを使用するために、コード内で以下のモジュール/ライブラリをインポートしてください：

```Python
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

>>> print(adbc_driver_manager.__version__)
1.1.0
>>> print(adbc_driver_flightsql.__version__)
1.1.0
```
### Dorisに接続する

Doris Arrow Flight SQLサービスと通信するクライアントを作成します。Doris FEのHost、Arrow Flight Port、ログインユーザー名とパスワードを提供し、以下の設定を行う必要があります。
Doris FEとBEの設定パラメータを変更します：

- fe/conf/fe.confのarrow_flight_sql_portを8070など、利用可能なポートに変更します。
- be/conf/be.confのarrow_flight_sql_portを8050など、利用可能なポートに変更します。

`注意：fe.confとbe.confで設定するarrow_flight_sql_portのポート番号は異なります`

設定を変更してクラスターを再起動した後、fe/log/fe.logファイルで`Arrow Flight SQL service is started`を検索すると、FEのArrow Flight Serverが正常に開始されたことを示します。be/log/be.INFOファイルで`Arrow Flight Service bind to host`を検索すると、BEのArrow Flight Serverが正常に開始されたことを示します。

DorisインスタンスのFEとBEのArrow Flight SQLサービスがそれぞれポート8070と8050で実行され、Dorisのユーザー名/パスワードが"user"/"pass"であると仮定した場合、接続プロセスは以下の通りです：

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```
接続が完了した後、返されたCursorを使用してSQLを通じてDorisとやり取りし、Table作成、メタデータ取得、データインポート、クエリなどの操作を実行できます。

### Table作成とメタデータ取得

cursor.execute()関数にQueryを渡して、Table作成とメタデータ取得操作を実行します：

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
StatusResultが0を返す場合、Queryが正常に実行されたことを意味します（この設計の理由はJDBCとの互換性を保つためです）。

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
### データのインポート

作成されたTableに少量のテストデータをインポートするためにINSERT INTOを実行します：

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```
以下により、インポートが成功したことが証明されます：

```
  StatusResult
0            0
```
大量のデータをDorisにインポートする必要がある場合は、pydorisを使用してStream Loadを実行できます。

### クエリを実行する

次に、上記でインポートしたTableをクエリします。これには集約、ソート、Set Session Variableなどの操作が含まれます。

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
結果は以下の通りです：

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
**注意:** クエリ結果を取得するには、`cursor.fetchallarrow()`を使用してarrow形式で返すか、`cursor.fetch_df()`を使用してpandas dataframeを直接返す必要があります。これによりデータは列形式で保持されます。`cursor.fetchall()`は使用しないでください。使用すると列形式のデータが行形式に変換され、本質的にはmysql-clientを使用するのと同じになります。実際、クライアント側で列から行への変換処理が追加で発生するため、mysql-clientよりも遅くなる可能性があります。

### 完全なコード

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

Arrow Flight SQLプロトコルのオープンソースJDBCドライバーは標準のJDBC APIと互換性があり、ほとんどのBIツールがJDBCを通じてDorisにアクセスするために使用でき、Apache Arrowデータの高速転送をサポートします。使用方法は、MySQLプロトコルのJDBCドライバーを通じてDorisに接続する場合と同様です。リンクURL内のjdbc:mysqlプロトコルをjdbc:arrow-flight-sqlプロトコルに置き換えるだけです。クエリ結果は引き続きJDBC ResultSetデータ構造で返されます。

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
**注意:** Java 9以降を使用する場合、Javaコマンドに`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加してJDKの内部構造を公開する必要があります。そうしないと、`module java.base does not "opens java.nio" to unnamed module`や`module java.base does not "opens java.nio" to org.apache.arrow.memory.core`、`java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`などのエラーが発生する可能性があります。

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=ALL-UNNAMED" java -jar ...
```
IntelliJ IDEAでデバッグする場合、`Run/Debug Configurations`の`Build and run`に`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加する必要があります。下記の画像を参照してください：

![arrow-flight-sql-IntelliJ](/images/db-connect/arrow-flight-sql/arrow-flight-sql-IntelliJ.png)

接続コードの例は以下の通りです：

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
## Java使用方法

JDBCの使用に加えて、Pythonと同様に、JAVAでもDriverを作成してDorisを読み取り、Arrow形式でデータを返すことができます。以下は、AdbcDriverとJdbcDriverを使用してDoris Arrow Flight Serverに接続する方法です。

POM依存関係：

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

接続コードの例は以下の通りです：

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

Java 9以降を使用する場合、java コマンドに --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED を追加して、一部のJDK内部を公開する必要があります：

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED" java -jar ...
```
そうでない場合、`module java.base does not "opens java.nio" to unnamed module`や`module java.base does not "opens java.nio" to org.apache.arrow.memory.core`、`ava.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`などのエラーが表示される可能性があります。

IntelliJ IDEAでデバッグする場合、`Run/Debug Configurations`の`Build and run`に`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加する必要があります。下記の図を参照してください：

![IntelliJ IDEA](https://github.com/user-attachments/assets/7439ee6d-9013-40bf-89af-0365925d3fdb)

接続コードの例は次のとおりです：

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
### Jdbc と Java 接続方式の選択

[JDBC/Java Arrow Flight SQL サンプル](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) は、Arrow FLight SQL を使用した JDBC/Java デモです。これを使用して Arrow Flight サーバー にクエリを送信するための様々な接続方式をテストでき、Arrow FLight SQL の使用方法を理解し、パフォーマンスをテストするのに役立ちます。期待される実行結果については、[Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306) を参照してください。

従来の `jdbc:mysql` 接続方式と比較した Jdbc と Java の Arrow Flight SQL 接続方式のパフォーマンステストは、[GitHub Issue](https://github.com/apache/doris/issues/25514) のセクション 6.2 で確認できます。テスト結果に基づく使用提案は以下のとおりです。

1. 上記の 3 つの Java Arrow Flight SQL 接続方式について、後続のデータ分析が行ベースのデータ形式に基づく場合は jdbc:arrow-flight-sql を使用してください。これは JDBC ResultSet 形式でデータを返します。後続のデータ分析が Arrow 形式またはその他の列ベースのデータ形式に基づく場合は、Flight AdbcDriver または Flight JdbcDriver を使用して Arrow 形式でデータを直接返してください。これにより行-列変換を回避し、Arrow の特性を利用してデータ解析を高速化できます。

2. JDBC ResultSet または Arrow 形式でデータを解析する場合、どちらでも費やす時間はデータを読み取る時間よりも長くなります。Arrow Flight SQL のパフォーマンスが期待通りでなく、`jdbc:mysql://` と比較して改善が限定的である場合は、データ解析に時間がかかりすぎているかどうかを分析することをお勧めします。

3. すべての接続方式において、JDK 17 は JDK 1.8 よりもデータ読み取りが高速です。

4. 大量のデータを読み取る場合、Arrow Flight SQL は `jdbc:mysql://` よりもメモリ使用量が少なくなるため、メモリ不足に悩まされている場合は Arrow Flight SQL を試すこともできます。

5. 上記の 3 つの接続方式に加えて、ネイティブの FlightClient を使用して Arrow Flight サーバー に接続することも可能です。これにより複数のエンドポイントを並列でより柔軟に読み取ることができます。Flight AdbcDriver も FlightClient に基づいて作成されたリンクで、FlightClient を直接使用するよりも簡単です。

## 他のビッグデータコンポーネントとの連携

### Spark & Flink

Arrow Flight は現在、Spark と Flink をサポートする公式計画がありません（[GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)）。バージョン 24.0.0 以降、Doris 独自の [Spark Connector](https://github.com/apache/doris-spark-connector) と [Flink Connector](https://github.com/apache/doris-flink-connector) が Arrow Flight SQL 経由での Doris アクセスをサポートしており、これにより読み取りパフォーマンスが数倍向上することが期待されます。

コミュニティでは以前、オープンソースの [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) を参照し、Spark で FlightClient を使用して Doris に接続してテストを行いました。Arrow と Doris Block 間のデータ形式変換の方が高速であることが判明し、CSV 形式と Doris Block 間の変換速度の 10 倍で、Map や Array などの複雑な型により良いサポートを提供します。これは Arrow データ形式が高い圧縮率を持ち、転送中のネットワークオーバーヘッドが少ないためです。ただし、Doris Arrow Flight はまだマルチノード並列読み取りを実装しておらず、クエリ結果を BE ノードに集約して返します。データの単純なバッチエクスポートの場合、Tablet レベルの並列読み取りをサポートする Doris Spark Connector ほど高速でない可能性があります。Spark で Arrow Flight SQL を使用して Doris に接続したい場合は、オープンソースの [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) と [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector) を参照して自分で実装できます。

### BI ツールのサポート

Doris v2.1.8 以降、DBeaver などの BI ツールが `arrow-flight-sql` プロトコルを使用して Doris に接続することをサポートしています。DBeaver で `arrow-flight-sql` Driver を使用して Doris に接続する方法については、[how-to-use-jdbc-driver-with-dbeaver-client](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client)、[client-applications/clients/dbeaver/](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg) を参照してください。

## 拡張アプリケーション

### 複数の BE が並列で結果を返す

Doris はデフォルトで、すべての BE ノードでのクエリ結果を 1 つの BE ノードに集約します。Mysql/JDBC クエリでは、FE はこの集約されたデータノードからクエリ結果を要求します。Arrow Flight SQL クエリでは、FE はこのノードの IP/Port を Endpoint にラップして ADBC クライアント に返します。ADBC クライアント はこの Endpoint に対応する BE ノードに要求してデータを取得します。

クエリが Doris からデータを取得する単純な Select で、Join、Sort、Window ファンクション などのデータ Shuffle 動作を伴うオペレータがない場合、クエリは Tablet の粒度に従って分割できます。現在 Doris Spark/Flink Connector はこの方法を使用して並列データ読み取りを実装しており、2 つのステップに分かれています：
1. `explain sql` を実行し、FE が返すクエリプランの ScanOperator には Scan のすべての Tablet ID List が含まれます。
2. 上記の Tablet ID List に基づいて元の SQL を複数の SQL に分割します。各 SQL は一部の Tablet のみを読み取ります。使用方法は `SELECT * FROM t1 TABLET(10001,10002) limit 1000;` のようになります。分割後の複数の SQL は並列で実行できます。[Support select table sample](https://github.com/apache/doris/pull/10170) を参照してください。

クエリの最外層が集約の場合、SQL は `select k1, sum(k2) from xxx group by k1` のようになります。Doris v3.0.4 以降、`set enable_parallel_result_sink=true;` を実行して、クエリの各 BE ノードが独立してクエリ結果を返すことを許可します。FE が返す Endpoint リストを受信後、ADBC クライアント は複数の BE ノードから並列で結果を取得します。ただし、集約結果が非常に小さい場合、複数の BE を返すことで RPC への負荷が増加することに注意してください。具体的な実装については、[support parallel result sink](https://github.com/apache/doris/pull/36053) を参照してください。理論的には、最外層のクエリがソートされている場合を除いて、他のクエリは各 BE ノードが並列で結果を返すことをサポートできますが、現在この利便性の必要がなく、さらなる実装は行われていません。

### 複数の BE がクラスタ外からアクセス可能な同一の IP を共有

Doris クラスタがあり、その FE ノードはクラスタ外からアクセス可能で、すべての BE ノードはクラスタ内からのみアクセス可能な場合があります。Mysql クライアント と JDBC を使用して Doris に接続してクエリを実行する場合はこれで問題なく、クエリ結果は Doris FE ノードによって返されます。しかし、Arrow Flight SQL を使用して Doris に接続する場合は動作しません。ADBC クライアント が Doris BE ノードに接続してクエリ結果を取得する必要がありますが、Doris BE ノードはクラスタ外からのアクセスが許可されていないためです。

本番環境では、Doris BE ノードをクラスタ外に公開することは不便な場合が多くあります。ただし、すべての Doris BE ノードにリバースプロキシ（Nginx など）を追加することができます。クラスタ外のクライアントが Nginx に接続すると、Doris BE ノードにランダムにルーティングされます。デフォルトでは、Arrow Flight SQL クエリ結果は Doris BE ノードにランダムに保存されます。Nginx によってランダムにルーティングされる Doris BE ノードと異なる場合、Doris BE ノード内でのデータ転送が必要になります。

Doris v2.1.8 以降、すべての Doris BE ノードの `be.conf` で `public_host` と `arrow_flight_sql_proxy_port` を、複数の Doris BE ノードで共有され、クラスタ外からアクセス可能な IP とポートに設定できます。クエリ結果は正しく転送され、ADBC クライアント に返されます。

```conf
public_host={nginx ip}
arrow_flight_sql_proxy_port={nginx port}
```
## FAQ

1. Q: エラー `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"`

A: エラーメッセージ内の `<ip:arrow_flight_port>` が Doris FE ノードの IP と arrow-flight-port である場合、

まず Doris FE ノードの arrow-flight-server が正常に起動しているかを確認してください。fe/log/fe.log ファイル内で `Arrow Flight SQL service is started` を検索することで、FE の Arrow Flight サーバー が正常に起動したことを示します。

Doris FE ノードの arrow-flight-server が正常に起動している場合、クライアント が配置されているマシンからエラーメッセージ内の IP `<ip:arrow_flight_port>` に対して `ping` できるかを確認してください。`ping` できない場合、Doris FE ノード用に外部からアクセス可能な IP を開放し、クラスターを再デプロイする必要があります。

A: エラーメッセージ内の `<ip:arrow_flight_port>` が Doris BE ノードの IP と arrow-flight-port である場合。

まず Doris BE ノードの arrow-flight-server が正常に起動しているかを確認してください。be/log/be.INFO ファイル内で `Arrow Flight Service bind to host` を検索することで、BE の Arrow Flight サーバー が正常に起動したことを示します。

Doris BE ノードの arrow-flight-server が正常に起動している場合、クライアントマシンがエラーメッセージで報告された `<ip:arrow_flight_port>` 内の IP に対して `ping` できるかを確認してください。`ping` できない場合、Doris BE ノードが外部からアクセスできないイントラネットにあることが分かっている場合は、以下の 2 つの方法を使用してください：

- 各 Doris BE ノードに対して外部からアクセス可能な IP を開放することを検討してください。Doris v2.1.8 以降では、この Doris BE ノードの `be.conf` でこの IP に `public_host` を設定できます。同様に、すべての Doris BE ノードの `public_host` を、クライアントがアクセスできる対応する BE ノードの IP に設定してください。

- 上記のセクション [Multiple BEs share the same IP that can be accessed externally by the cluster] を参照して、すべての Doris BE ノードにリバースプロキシの層を追加してください。

Doris BE が完全にイントラネットにあるかどうかが不明な場合は、クライアントマシンと Doris BE ノードが配置されているマシンの他の IP との接続性を確認してください。Doris BE ノードが配置されているマシンで `ifconfig` を実行して、現在のマシンのすべての IP を返してください。そのうちの 1 つの IP は、`<ip:arrow_flight_port>` 内の IP と同じであり、`show backends` で出力された Doris BE ノードの IP と同じであるはずです。`ifconfig` によって返された他の IP を順番に `ping` してください。Doris BE ノードに クライアント がアクセスできる IP がある場合は、上記を参照してこの IP を `public_host` として設定してください。Doris BE ノードのすべての IP が クライアント からアクセスできない場合、その Doris BE ノードは完全にイントラネットにあります。

2. Q: JDBC または JAVA を使用して Arrow Flight SQL に接続する際に、エラーメッセージが表示される：`module java.base does not "opens java.nio" to unnamed module` または `module java.base does not "opens java.nio" to org.apache.arrow.memory.core` または `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

A: まず fe/conf/fe.conf 内の `JAVA_OPTS_FOR_JDK_17` に `--add-opens=java.base/java.nio=ALL-UNNAMED` が含まれているかを確認してください。含まれていない場合は、追加してください。次に、上記の [JDBC Connector with Arrow Flight SQL] の注釈を参照し、Java コマンドに `--add-opens=java.base/java.nio=ALL-UNNAMED` を追加してください。IntelliJ IDEA でデバッグする場合は、`Run/Debug Configurations` の `Build and run` に `--add-opens=java.base/java.nio=ALL-UNNAMED` を追加する必要があります。

3. Q: ARM 環境でエラー `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.クライアント` が報告される。

A: Linux カーネルバージョンが <= 4.19.90 の場合、4.19.279 以上にアップグレードするか、より低いバージョンの Linux カーネル環境で Doris BE を再コンパイルする必要があります。具体的なコンパイル方法については、ドキュメント <docs/dev/install/source-install/compilation-arm> を参照してください。

原因：これは古いバージョンの Linux カーネルと Arrow の間に互換性の問題があるためです。`cpp: arrow::RecordBatch::MakeEmpty()` が Arrow Record Batch を構築する際にスタックし、Doris BE の Arrow Flight サーバー が 5000ms 以内に Doris FE の Arrow Flight サーバー の RPC リクエストに応答できなくなり、FE が クライアント に rpc timeout failed を返すことになります。Spark や Flink が Doris を読み取る場合も、クエリ結果を Arrow Record Batch に変換して返すため、同じ問題が存在します。

kylinv10 SP2 と SP3 の Linux カーネルバージョンは最大でも 4.19.90-24.4.v2101.ky10.aarch64 です。カーネルバージョンをさらにアップグレードすることはできません。Doris BE を kylinv10 上で再コンパイルするしかありません。新しいバージョンの ldb_toolchain で Doris BE をコンパイルしても問題が残る場合は、より低いバージョンの ldb_toolchain v0.17 でコンパイルを試してください。ARM 環境が外部ネットワークに接続できない場合、Huawei Cloud が ARM + kylinv10、Alibaba Cloud が x86 + kylinv10 を提供しています。

4. Q: Prepared statement でパラメータを渡すとエラーが報告される。

A: 現在、`jdbc:arrow-flight-sql` と Java ADBC/JDBCDriver は prepared statement のパラメータ渡しをサポートしていません。例えば `select * from xxx where id=?` は `parameter ordinal 1 out of range` エラーを報告します。これは Arrow Flight SQL のバグです（[GitHub Issue](https://github.com/apache/arrow/issues/40118)）。

5. Q: 一部のシナリオでパフォーマンスを向上させるために、`jdbc:arrow-flight-sql` が毎回読み取るバッチサイズを変更する方法。

A: `org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader` ファイル内の `makeJdbcConfig` メソッドで `setTargetBatchSize` を変更してください。デフォルトは 1024 です。変更したファイルを同じパス名でローカルディレクトリに保存して、元のファイルを上書きして有効にしてください。

6. Q: ADBC v0.10、JDBC、Java ADBC/JDBCDriver は並列読み取りをサポートしていません。

A: `stmt.executePartitioned()` メソッドが実装されていません。ネイティブの FlightClient を使用して複数エンドポイントの並列読み取りを実装するしかありません。方法は `sqlClient=new FlightSqlClient, execute=sqlClient.execute(sql), endpoints=execute.getEndpoints(), for(FlightEndpoint endpoint: endpoints)` です。また、ADBC V0.10 のデフォルトの AdbcStatement は実際には JdbcStatement です。executeQuery 後、行形式の JDBC ResultSet が Arrow カラム形式に変換されます。Java ADBC が完全に機能するのは ADBC 1.0.0 になる予定です [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)。

7. Q: URL でデータベース名を指定する。

A: Arrow v15.0 現在、Arrow JDBC Connector は URL でのデータベース名の指定をサポートしていません。例えば `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` で `test` データベースへの接続を指定することは無効で、手動で SQL `use database` を実行するしかありません。Arrow v18.0 では URL でのデータベース名指定をサポートしていますが、実際のテストではまだバグがあります。

8. Q: Python ADBC で `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant` が出力される。

A: Python を使用する際はこの Warning を無視してください。これは Python ADBC クライアント の問題で、クエリには影響しません。

9. Q: Python でエラー `grpc: received message larger than max (20748753 vs. 16777216)` が報告される。

A: [Python: grpc: received message larger than max (20748753 vs. 16777216) #2078](https://github.com/apache/arrow-adbc/issues/2078) を参照して、Database Option に `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value` を追加してください。

10. Q: エラー `invalid bearer token` が報告される。

A: `SET PROPERTY FOR 'root' 'max_user_connections' = '10000';` を実行して現在のユーザーの最大接続数を 10000 に変更し、`fe.conf` に qe_max_connection=30000 と arrow_flight_token_cache_size=8000 を追加して FE を再起動してください。

ADBC クライアント と Arrow Flight サーバー の間の接続は本質的に長期接続で、Auth Token、Connection、Session を サーバー 側でキャッシュする必要があります。接続が作成された後、単一のクエリの終了時にすぐに切断されることはありません。クライアント が close() リクエストを送信してクリーンアップする必要がありますが、実際には クライアント が close リクエストを送信しないことが多いため、Auth Token、Connection、Session が Arrow Flight サーバー 上に長時間保存されます。デフォルトでは 3 日後にタイムアウトして切断されるか、接続数が `arrow_flight_token_cache_size` の制限を超えた後に LRU に従って排除されます。

Doris v2.1.8 現在、Arrow Flight 接続と Mysql/JDBC 接続は同じ接続制限を使用しており、すべての FE ユーザーの総接続数 `qe_max_connection` と `UserProperty` 内の単一ユーザーの接続数 `max_user_connections` が含まれます。しかし、デフォルトの `qe_max_connection` と `max_user_connections` はそれぞれ 1024 と 100 です。Arrow Flight SQL は JDBC シナリオを置き換えるためによく使用されますが、JDBC 接続はクエリ終了後すぐに解放されます。そのため、Arrow Flight SQL を使用する際は、Doris のデフォルト接続制限が小さすぎるため、接続数が `arrow_flight_token_cache_size` の制限を超えて使用中の接続が排除されることがよく発生します。

11. Q: JDBC または JAVA を使用して Arrow Flight SQL に接続して Datatime 型を読み取ると、フォーマットされた時刻ではなくタイムスタンプが返される。

A: JDBC または JAVA を使用して Arrow Flight SQL に接続して Datatime 型を読み取る場合は、タイムスタンプを自分で変換する必要があります。[Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578) を参照してください。Python Arrow Flight SQL を使用して Datatime 型を読み取ると `2025-03-03 17:23:28Z` の結果が返されますが、JDBC または JAVA は `1740993808` を返します。

12. Q: JDBC または Java JDBC クライアント を使用して Arrow Flight SQL に接続して Array ネスト型を読み取るとエラー `構成 does not provide a mapping for array column 2` が返される。

A: [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java) を参照して JAVA ADBC クライアント を使用してください。

Python ADBC クライアント、JAVA ADBC クライアント、Java JDBC DriverManager はすべて Array ネスト型の読み取りに問題ありません。JDBC または Java JDBC クライアント を使用して Arrow Flight SQL に接続する場合のみ問題があります。実際、Arrow Flight JDBC の互換性は保証されていません。これは Arrow が公式に開発したものではなく、サードパーティのデータベース会社 Dremio によるものです。以前にも他の互換性の問題が見つかっているため、まず JAVA ADBC クライアント の使用を推奨します。

## 2.1 リリースノート

> Doris Arrow Flight は v2.1.4 以前のバージョンでは完璧ではないため、使用前にアップグレードすることを推奨します。

### v2.1.9

1. Doris データの Arrow へのシリアライゼーション問題を修正。
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- `Decimal256` 型の読み取り失敗
- `DatetimeV2` 型読み取りの微細なエラー
- `DateV2` 型読み取り結果の不正確
- `IPV4/IPV6` 型の読み取りで結果が NULL の場合のエラー

2. Doris Arrow Flight SQL クエリ失敗時に空の結果を返し、実際のエラー情報を返さない問題を修正。
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v2.1.8

1. DBeaver などの BI ツールが `arrow-flight-sql` プロトコルを使用して Doris に接続し、メタデータツリーを正しく表示することをサポート。
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 複数の BE がクラスター外部からアクセス可能な同じ IP を共有している場合、クエリ結果を正しく転送して ADBC クライアント に返すことができる。
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

3. 複数エンドポイントでの並列読み取りをサポート。
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

4. クエリエラー `FE not found arrow flight schema` を修正。
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

5. NULL を許可するカラムを読み取る際のエラー `BooleanBuilder::AppendValues` を修正。
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

6. `show processlist` で重複する Connection ID が表示される問題を修正。
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

7. `Datetime` と `DatetimeV2` 型を読み取る際にタイムゾーンが失われ、実際のデータより 8 時間少ない datetime になる問題を修正。
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v2.1.7

1. 頻繁なログ出力 `Connection wait_timeout` を修正。
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

2. Arrow Flight Bearer Token の Cache からの期限切れ排除を修正。
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

### v2.1.6

1. クエリエラー `0.0.0.0:xxx, connection refused` を修正。
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. クエリエラー `Reach limit of connections` を修正。
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

以前のバージョンでは、`SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` を実行して現在のユーザーの最大接続数を 1024 に変更することで一時的に回避できます。

以前のバージョンでは Arrow Flight 接続数を `qe_max_connection/2` 未満に制限するだけで、`qe_max_connection` はすべての fe ユーザーの総接続数で、デフォルトは 1024 です。単一ユーザーの Arrow Flight 接続数を `UserProperty` の `max_user_connections` 未満（デフォルトは 100）に制限していないため、Arrow Flight 接続数が現在のユーザーの接続数上限を超えると、エラー `Reach limit of connections` が報告されるため、現在のユーザーの `max_user_connections` を増やす必要があります。

問題の詳細については、[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324) を参照してください。

3. 単一回で返されるクエリ結果の ArrowBatch サイズの変更をサポートする Conf `arrow_flight_result_sink_buffer_size_rows` を追加、デフォルトは 4096 * 8。
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v2.1.5

1. Arrow Flight SQL クエリ結果が空になる問題を修正。
[Fix arrow flight result sink #36827](https://github.com/apache/doris/pull/36827)

Doris v2.1.4 は大量のデータを読み取る際にエラーが発生する可能性があります。詳細については、[Questions](https://ask.selectdb.com/questions/D1Ia1/arrow-flight-sql-shi-yong-python-de-adbc-driver-lian-jie-doris-zhi-xing-cha-xun-sql-du-qu-bu-dao-shu-ju) を参照してください。

## 3.0 リリースノート

### v3.0.5

1. Doris データの Arrow へのシリアライゼーション問題を修正。
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- `Decimal256` 型の読み取り失敗
- `DatetimeV2` 型読み取りの微細なエラー
- `DateV2` 型読み取り結果の不正確
- `IPV4/IPV6` 型の読み取りで結果が NULL の場合のエラー

### v3.0.4

1. DBeaver などの BI ツールが `arrow-flight-sql` プロトコルを使用して Doris に接続し、メタデータツリーを正しく表示することをサポート。
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 複数エンドポイントでの並列読み取りをサポート。
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

3. NULL を許可するカラムを読み取る際のエラー `BooleanBuilder::AppendValues` を修正。
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

4. `show processlist` で重複する Connection ID が表示される問題を修正。
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

5. Doris Arrow Flight SQL クエリ失敗時に空の結果を返し、実際のエラー情報を返さない問題を修正。
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v3.0.3

1. クエリエラー `0.0.0.0:xxx, connection refused` を修正。
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. クエリエラー `Reach limit of connections` を修正。
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

以前のバージョンでは、`SET PROPERTY FOR 'root' 'max_user_connections' = '1024';` を実行して現在のユーザーの最大接続数を 1024 に変更することで一時的に回避できます。

以前のバージョンでは Arrow Flight 接続数を `qe_max_connection/2` 未満に制限するだけで、`qe_max_connection` はすべての fe ユーザーの総接続数で、デフォルトは 1024 です。単一ユーザーの Arrow Flight 接続数を `UserProperty` の `max_user_connections` 未満（デフォルトは 100）に制限していないため、Arrow Flight 接続数が現在のユーザーの接続数上限を超えると、エラー `Reach limit of connections` が報告されるため、現在のユーザーの `max_user_connections` を増やす必要があります。

問題の詳細については、[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324) を参照してください。

3. 頻繁なログ出力 `Connection wait_timeout` を修正。
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

4. Arrow Flight Bearer Token の期限切れ後の Cache からの排除を修正。
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

5. 複数の BE がクラスター外部からアクセス可能な同じ IP アドレスを共有している場合、クエリ結果を正しく転送して ADBC クライアント に返すことができる。
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

6. クエリエラー `FE not found arrow flight schema` を修正。
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

7. `Datetime` と `DatetimeV2` 型を読み取る際にタイムゾーンが失われ、実際のデータより 8 時間少ない datetime になる問題を修正。
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v3.0.2

1. 単一トランザクションで返されるクエリ結果の ArrowBatch サイズの変更をサポートする Conf `arrow_flight_result_sink_buffer_size_rows` を追加、デフォルトは 4096 * 8。
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v3.0.1

1. クエリ結果の欠落、クエリ結果行数 = 実際の行数 / BE 数
[Fix get Schema failed when enable_parallel_result_sink is false #37779](https://github.com/apache/doris/pull/37779)

Doris 3.0.0 では、クエリの最外層が集約の場合、SQL が `select k1, sum(k2) from xxx group by k1` のようになると、（クエリ結果行数 = 実際の行数 / BE 数）に遭遇する可能性があります。これは [support parallel result sink](https://github.com/apache/doris/pull/36053) によって導入された問題です。[Fix get Schema failed when enable_parallel_result_sink is false](https://github.com/apache/doris/pull/37779) は一時的な修正で、[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286) が複数エンドポイントの並列読み取りをサポートした後に正式に修正される予定です。
