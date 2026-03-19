---
{
  "title": "Arrow Flight SQLプロトコルによる接続",
  "language": "ja",
  "description": "Doris 2.1以降、Arrow Flight SQLプロトコルに基づく高速データリンクが実装されています。"
}
---
Doris 2.1 以降、Arrow Flight SQL プロトコルに基づく高速データリンクが実装され、複数の言語で Doris から大量のデータを SQL クエリにより迅速に取得することが可能になりました。Arrow Flight SQL は汎用的な JDBC ドライバーも提供し、Arrow Flight SQL プロトコルに従う他のデータベースとのシームレスな連携をサポートしています。一部のシナリオでは、MySQL Client や JDBC/ODBC ドライバーを使用したデータ転送ソリューションと比較して、パフォーマンスが最大百倍向上する可能性があります。

## 実装原理

Doris では、クエリ結果は Block として列形式で構成されています。2.1 より前のバージョンでは、MySQL Client や JDBC/ODBC ドライバーを介してターゲットクライアントにデータを転送できましたが、これには行ベースの Bytes を列形式に逆シリアル化する必要がありました。Arrow Flight SQL に基づく高速データ転送リンクを構築することで、ターゲットクライアントも Arrow 列形式をサポートしている場合、転送プロセス全体でシリアル化と逆シリアル化の操作を回避し、それらに関連する時間とパフォーマンスのオーバーヘッドを完全に排除できます。

![Arrow Flight SQL](/images/db-connect/arrow-flight-sql/Arrow_Flight_SQL.png)

Apache Arrow をインストールするには、公式ドキュメント [Apache Arrow](https://arrow.apache.org/install/) で詳細なインストール手順を参照できます。Doris が Arrow Flight プロトコルを実装する方法の詳細については、[Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514) を参照してください。


## Python での使用

Python の ADBC Driver を使用して Doris に接続し、極めて高速なデータ読み込みを実現します。以下の手順では、Python（バージョン >= 3.9）ADBC Driver を使用して、DDL、DML、Session 変数の設定、Show 文を含む一般的なデータベース構文操作を一連で実行します。

### ライブラリのインストール

このライブラリは PyPI で公開されており、以下の方法で簡単にインストールできます：

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

Doris Arrow Flight SQLサービスとやり取りするクライアントを作成します。Doris FEのHost、Arrow Flight Port、ログインユーザー名とパスワードを提供し、以下の設定を実行する必要があります。
Doris FEとBEの設定パラメータを変更します：

- fe/conf/fe.conf内のarrow_flight_sql_portを8070など利用可能なポートに変更します。
- be/conf/be.conf内のarrow_flight_sql_portを8050など利用可能なポートに変更します。

`注意：fe.confとbe.confで設定するarrow_flight_sql_portのポート番号は異なります`

設定を変更してクラスターを再起動した後、fe/log/fe.logファイル内で`Arrow Flight SQL service is started`を検索すると、FEのArrow Flight Serverが正常に開始されたことがわかります。be/log/be.INFOファイル内で`Arrow Flight Service bind to host`を検索すると、BEのArrow Flight Serverが正常に開始されたことがわかります。

DorisインスタンスのFEとBEのArrow Flight SQLサービスがそれぞれポート8070と8050で実行され、Dorisのユーザー名/パスワードが"user"/"pass"であると仮定すると、接続プロセスは次のとおりです：

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```
接続が完了した後、返されたCursorを使用してSQLを通じてDorisと対話し、テーブルの作成、メタデータの取得、データのインポート、クエリなどの操作を実行できます。

### テーブルの作成とメタデータの取得

cursor.execute()関数にQueryを渡して、テーブルの作成とメタデータの取得操作を実行します：

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
StatusResultが0を返す場合、Queryが正常に実行されたことを意味します（この設計の理由はJDBCとの互換性のためです）。

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

作成したテーブルに少量のテストデータをインポートするため、INSERT INTOを実行します：

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```
以下により、importが成功したことが証明されます：

```
  StatusResult
0            0
```
Dorisに大量のデータをインポートする必要がある場合は、pydorisを使用してStream Loadを実行できます。

### クエリの実行

次に、上記でインポートしたテーブルに対してクエリを実行します。これには集計、ソート、Set Session Variableなどの操作が含まれます。

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
**注意:** クエリ結果を取得するには、`cursor.fetchallarrow()`を使用してarrow形式で返すか、`cursor.fetch_df()`を使用してpandas dataframeを直接返す必要があります。これによりデータが列形式で保持されます。`cursor.fetchall()`は使用しないでください。使用すると列形式データが行形式に変換され戻されるため、本質的にはmysql-clientを使用するのと同じことになります。実際、クライアント側での余分な列から行への変換操作により、mysql-clientより遅くなる可能性があります。

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
## Arrow Flight SQLを使用したJdbcコネクタ

Arrow Flight SQLプロトコルのオープンソースJDBCドライバーは標準JDBC APIと互換性があり、ほとんどのBIツールでJDBCを通じてDorisにアクセスするために使用でき、Apache Arrowデータの高速伝送をサポートします。使用方法はMySQLプロトコルのJDBCドライバーを通じてDorisに接続することと似ています。リンクURL内のjdbc:mysqlプロトコルをjdbc:arrow-flight-sqlプロトコルに置き換えるだけです。クエリ結果は引き続きJDBC ResultSetデータ構造で返されます。

POM依存関係：

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
IntelliJ IDEAでデバッグする場合、`Run/Debug Configurations`の`Build and run`に`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加する必要があります。以下の画像を参照してください：

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
## Java の使用

JDBC の使用に加えて、Python と同様に、JAVA でも Driver を作成して Doris を読み取り、Arrow 形式でデータを返すことができます。以下は AdbcDriver と JdbcDriver を使用して Doris Arrow Flight Server に接続する方法です。

POM 依存関係:

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

Java 9以降を使用する場合、java コマンドに --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED を追加することで、いくつかのJDK内部機能を公開する必要があります：

```shell
# Directly on the command line
$ java --add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED -jar ...
# Indirectly via environment variables
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED" java -jar ...
```
そうでないと、`module java.base does not "opens java.nio" to unnamed module`や`module java.base does not "opens java.nio" to org.apache.arrow.memory.core`、または`ava.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`などのエラーが表示される場合があります。

IntelliJ IDEAでデバッグする場合は、`Run/Debug Configurations`の`Build and run`に`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加する必要があります。以下の画像を参照してください：

![IntelliJ IDEA](https://github.com/user-attachments/assets/7439ee6d-9013-40bf-89af-0365925d3fdb)

接続コードの例は以下の通りです：

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
### Jdbc と Java 接続方法の選択

[JDBC/Java Arrow Flight SQL Sample](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) は、Arrow FLight SQL を使用した JDBC/Java のデモです。これを使用して、Arrow Flight Server にクエリを送信するための様々な接続方法をテストし、Arrow FLight SQL の使用方法を理解し、パフォーマンスをテストすることができます。期待される実行結果については、[Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306) を参照してください。

従来の `jdbc:mysql` 接続方法と比較した Jdbc と Java の Arrow Flight SQL 接続方法のパフォーマンステストは、[GitHub Issue](https://github.com/apache/doris/issues/25514) のセクション 6.2 で確認できます。テスト結論に基づく使用提案を以下に示します。

1. 上記の3つの Java Arrow Flight SQL 接続方法について、後続のデータ分析が行ベースのデータ形式に基づく場合は、JDBC ResultSet 形式でデータを返す jdbc:arrow-flight-sql を使用してください。後続のデータ分析が Arrow 形式または他の列ベースのデータ形式に基づく場合は、Flight AdbcDriver または Flight JdbcDriver を使用して Arrow 形式で直接データを返すことで、行列変換を回避し、Arrow の特性を利用してデータ解析を高速化します。

2. JDBC ResultSet または Arrow 形式でのデータ解析のいずれにおいても、費やされる時間はデータ読み込みに費やされる時間よりも長くなります。Arrow Flight SQL のパフォーマンスが期待通りでなく、`jdbc:mysql://` と比較して改善が限定的な場合は、データ解析に時間がかかりすぎているかどうかを分析することをお勧めします。

3. すべての接続方法において、JDK 17 は JDK 1.8 よりも高速にデータを読み込みます。

4. 大量のデータを読み込む際、Arrow Flight SQL は `jdbc:mysql://` よりも少ないメモリを使用するため、メモリ不足に悩んでいる場合は Arrow Flight SQL を試すこともできます。

5. 上記の3つの接続方法に加えて、ネイティブ FlightClient を使用して Arrow Flight Server に接続することも可能で、これにより複数のエンドポイントをより柔軟に並列で読み込むことができます。Flight AdbcDriver も FlightClient に基づいて作成されたリンクで、FlightClient を直接使用するよりもシンプルです。

## 他のビッグデータコンポーネントとの連携

### Spark & Flink

Arrow Flight は現在、Spark と Flink をサポートする公式計画がありません（[GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)）。バージョン 24.0.0 以降、Doris 独自の [Spark Connector](https://github.com/apache/doris-spark-connector) と [Flink Connector](https://github.com/apache/doris-flink-connector) は Arrow Flight SQL 経由での Doris アクセスをサポートしており、これにより読み込みパフォーマンスが数倍向上することが期待されます。

コミュニティでは以前、オープンソースの [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) を参照し、Spark で FlightClient を使用して Doris に接続してテストを行いました。Arrow と Doris Block 間のデータ形式変換がより高速であることが判明し、CSV 形式と Doris Block 間の変換速度の10倍で、Map や Array などの複雑な型に対するサポートも優れています。これは、Arrow データ形式が高い圧縮率を持ち、伝送中のネットワークオーバーヘッドが低いためです。ただし、Doris Arrow Flight はまだマルチノード並列読み込みを実装しておらず、クエリ結果を BE ノードに集約して返します。単純なデータのバッチエクスポートの場合、Tablet レベルの並列読み込みをサポートする Doris Spark Connector ほど高速でない可能性があります。Spark で Arrow Flight SQL を使用して Doris に接続したい場合は、オープンソースの [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) と [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector) を参照して自分で実装できます。

### BI ツールのサポート

Doris v2.1.8 以降、DBeaver などの BI ツールが `arrow-flight-sql` プロトコルを使用して Doris に接続することがサポートされています。DBeaver で `arrow-flight-sql` Driver を使用して Doris に接続する方法については、[how-to-use-jdbc-driver-with-dbeaver-client](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client)、[client-applications/clients/dbeaver/](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg) を参照してください。

## 拡張アプリケーション

### 複数の BE による並列結果返却

Doris はデフォルトで、すべての BE ノードでのクエリ結果を1つの BE ノードに集約します。Mysql/JDBC クエリでは、FE はこの集約されたデータノードからクエリ結果を要求します。Arrow Flight SQL クエリでは、FE はこのノードの IP/Port を Endpoint にラップして ADBC Client に返します。ADBC Client は、この Endpoint に対応する BE ノードに要求してデータを取得します。

クエリが Join、Sort、Window Function などのデータ Shuffle 動作を伴う演算子を含まない、Doris からデータを取得するだけの単純な Select の場合、クエリは Tablet 粒度で分割できます。現在、Doris Spark/Flink Connector はこの方法を使用して並列データ読み込みを実装しており、2つのステップに分かれています：
1. `explain sql` を実行し、FE が返すクエリプランの ScanOperator には、Scan のすべての Tablet ID Lists が含まれます。
2. 上記の Tablet ID List に基づいて元の SQL を複数の SQL に分割します。各 SQL は Tablet の一部のみを読み込みます。使用方法は `SELECT * FROM t1 TABLET(10001,10002) limit 1000;` と同様です。分割後の複数の SQL は並列実行できます。[Support select table sample](https://github.com/apache/doris/pull/10170) を参照してください。

クエリの最外層が集約の場合、SQL は `select k1, sum(k2) from xxx group by k1` のようになります。Doris v3.0.4 以降、`set enable_parallel_result_sink=true;` を実行することで、クエリの各 BE ノードがクエリ結果を独立して返すことができます。FE が返す Endpoint リストを受信後、ADBC Client は複数の BE ノードから並列で結果を取得します。ただし、集約結果が非常に小さい場合、複数の BE を返すことで RPC への負荷が増加することに注意してください。具体的な実装については、[support parallel result sink](https://github.com/apache/doris/pull/36053) を参照してください。理論的には、最外層のクエリがソートされている場合を除いて、他のクエリは各 BE ノードが並列で結果を返すことをサポートできますが、現在この利便性の必要はなく、さらなる実装は行われていません。

### 複数の BE がクラスタ外部からアクセス可能な同一 IP を共有

Doris クラスタがあり、その FE ノードはクラスタ外部からアクセス可能で、すべての BE ノードはクラスタ内部からのみアクセス可能な場合を考えます。Mysql Client と JDBC を使用して Doris に接続してクエリを実行する場合は問題なく、クエリ結果は Doris FE ノードによって返されます。しかし、Arrow Flight SQL を使用して Doris に接続する場合は動作しません。ADBC Client が Doris BE ノードに接続してクエリ結果を取得する必要がありますが、Doris BE ノードはクラスタ外部からのアクセスが許可されていないためです。

本番環境では、Doris BE ノードをクラスタ外部に公開することは不便な場合が多くあります。しかし、すべての Doris BE ノードにリバースプロキシ（Nginx など）を追加することができます。クラスタ外部のクライアントが Nginx に接続すると、Doris BE ノードにランダムにルーティングされます。デフォルトでは、Arrow Flight SQL のクエリ結果は Doris BE ノード上にランダムに保存されます。Nginx によってランダムにルーティングされた Doris BE ノードと異なる場合、Doris BE ノード内でデータ転送が必要になります。

Doris v2.1.8 以降、すべての Doris BE ノードの `be.conf` で、複数の Doris BE ノードによって共有され、クラスタ外部からアクセス可能な IP とポートに `public_host` と `arrow_flight_sql_proxy_port` を設定できます。クエリ結果は正しく転送され、ADBC Client に返されます。

```conf
public_host={nginx ip}
arrow_flight_sql_proxy_port={nginx port}
```
## FAQ

1. Q: エラー `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"`が発生します。

A: エラーメッセージ内の`<ip:arrow_flight_port>`がDoris FEノードのIPとarrow-flight-portの場合、

まず、Doris FEノードのarrow-flight-serverが正常に起動しているかを確認してください。fe/log/fe.logファイルで`Arrow Flight SQL service is started`を検索すると、FEのArrow Flight Serverが正常に起動していることが確認できます。

Doris FEノードのarrow-flight-serverが正常に起動している場合、Clientが配置されているマシンからエラーメッセージ内のIP`<ip:arrow_flight_port>`に`ping`できるかを確認してください。`ping`できない場合は、Doris FEノードに外部からアクセス可能なIPを開放し、クラスタを再デプロイする必要があります。

A: エラーメッセージ内の`<ip:arrow_flight_port>`がDoris BEノードのIPとarrow-flight-portの場合。

まず、Doris BEノードのarrow-flight-serverが正常に起動しているかを確認してください。be/log/be.INFOファイルで`Arrow Flight Service bind to host`を検索すると、BEのArrow Flight Serverが正常に起動していることが確認できます。

Doris BEノードのarrow-flight-serverが正常に起動している場合、クライアントマシンからエラーメッセージに報告されている`<ip:arrow_flight_port>`のIPに`ping`できるかを確認してください。`ping`できない場合、Doris BEノードが外部からアクセスできないイントラネット内にあることが分かっている場合は、以下の2つの方法を使用します：

- 各Doris BEノードに外部からアクセス可能なIPを開放することを検討してください。Doris v2.1.8以降では、このDoris BEノードの`be.conf`でこのIPを`public_host`に設定できます。同様に、すべてのDoris BEノードの`public_host`をクライアントがアクセス可能な対応するBEノードのIPに設定してください。

- 上記セクション「複数のBEがクラスタで外部からアクセス可能な同じIPを共有する」を参照して、すべてのDoris BEノードにリバースプロキシレイヤーを追加してください。

Doris BEが完全にイントラネット内にあるかが不明な場合は、クライアントマシンとDoris BEノードが配置されているマシンの他のIPとの接続性を確認してください。Doris BEノードが配置されているマシンで`ifconfig`を実行すると、現在のマシンのすべてのIPが返されます。そのうちの1つのIPは`<ip:arrow_flight_port>`内のIPと同じで、`show backends`で表示されるDoris BEノードのIPと同じになるはずです。`ifconfig`で返される他のIPを順番に`ping`してください。Doris BEノードにClientからアクセス可能なIPがある場合は、上記を参照してこのIPを`public_host`として設定してください。Doris BEノードのすべてのIPがClientからアクセスできない場合、Doris BEノードは完全にイントラネット内にあります。

2. Q: JDBCやJAVAを使用してArrow Flight SQLに接続する際に、エラーメッセージ`module java.base does not "opens java.nio" to unnamed module`または`module java.base does not "opens java.nio" to org.apache.arrow.memory.core`または`java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`が表示されます。

A: まず、fe/conf/fe.conf内の`JAVA_OPTS_FOR_JDK_17`に`--add-opens=java.base/java.nio=ALL-UNNAMED`が含まれているかを確認してください。含まれていない場合は追加してください。その後、上記の「JDBC Connector with Arrow Flight SQL」の注意事項を参照し、Javaコマンドに`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加してください。IntelliJ IDEAでデバッグする場合は、`Run/Debug Configurations`の`Build and run`に`--add-opens=java.base/java.nio=ALL-UNNAMED`を追加する必要があります。

3. Q: ARM環境でエラー`get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client`が報告されます。

A: Linuxカーネルバージョンが<= 4.19.90の場合、4.19.279以上にアップグレードするか、より低いバージョンのLinuxカーネル環境でDoris BEを再コンパイルする必要があります。具体的なコンパイル方法については、ドキュメント<docs/dev/install/source-install/compilation-arm>を参照してください。

原因：これは、古いバージョンのLinuxカーネルとArrowの間に互換性の問題があるためです。`cpp: arrow::RecordBatch::MakeEmpty()`がArrow Record Batchを構築する際にスタックし、Doris BEのArrow Flight ServerがDoris FEのArrow Flight ServerのRPCリクエストに5000ms以内に応答できなくなり、FEがクライアントにrpc timeout failedを返す原因となります。SparkやFlinkがDorisを読み取る際も、クエリ結果をArrow Record Batchに変換して返すため、同じ問題が存在します。

kylinv10 SP2とSP3のLinuxカーネルバージョンは最大でも4.19.90-24.4.v2101.ky10.aarch64のみです。カーネルバージョンをさらにアップグレードすることはできません。kylinv10でDoris BEを再コンパイルするしかありません。新しいバージョンのldb_toolchainでDoris BEをコンパイルしても問題が解決しない場合は、より低いバージョンのldb_toolchain v0.17でコンパイルしてみてください。ARM環境が外部ネットワークに接続できない場合、Huawei CloudはARM + kylinv10を、Alibaba CloudはX86 + kylinv10を提供しています。

4. Q: Prepared statementでパラメータを渡すとエラーが報告されます。

A: 現在、`jdbc:arrow-flight-sql`とJava ADBC/JDBCDriverはprepared statementのパラメータ渡しをサポートしていません。例えば、`select * from xxx where id=?`は`parameter ordinal 1 out of range`エラーを報告します。これはArrow Flight SQLのバグです（[GitHub Issue](https://github.com/apache/arrow/issues/40118)）。

5. Q: 一部のシナリオでパフォーマンスを向上させるために、`jdbc:arrow-flight-sql`が毎回読み取るバッチサイズを変更する方法は？

A: `org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader`ファイルの`makeJdbcConfig`メソッド内の`setTargetBatchSize`を変更することで、デフォルトは1024です。その後、変更したファイルを同じパス名でローカルディレクトリに保存し、元のファイルを上書きして有効にします。

6. Q: ADBC v0.10、JDBCとJava ADBC/JDBCDriverは並列読み取りをサポートしていません。

A: `stmt.executePartitioned()`メソッドが実装されていません。ネイティブFlightClientを使用して複数のエンドポイントの並列読み取りを実装するしかありません。方法は`sqlClient=new FlightSqlClient, execute=sqlClient.execute(sql), endpoints=execute.getEndpoints(), for(FlightEndpoint endpoint: endpoints)`です。さらに、ADBC V0.10のデフォルトAdbcStatementは実際にはJdbcStatementです。executeQuery後、行形式のJDBC ResultSetがArrow列形式に変換されます。Java ADBCがADBC 1.0.0で完全に機能することが期待されています [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490)。

7. Q: URLでデータベース名を指定する。

A: Arrow v15.0の時点で、Arrow JDBC ConnectorはURLでのデータベース名指定をサポートしていません。例えば、`jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false`で`test`データベースへの接続を指定するのは無効で、SQL `use database`を手動で実行するしかありません。Arrow v18.0はURLでのデータベース名指定をサポートしていますが、実際のテストではまだバグがあります。

8. Q: Python ADBCが`Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant`を出力します。

A: Pythonを使用する際はこの警告を無視してください。これはPython ADBC Clientの問題で、クエリには影響しません。

9. Q: Pythonでエラー`grpc: received message larger than max (20748753 vs. 16777216)`が報告されます。

A: [Python: grpc: received message larger than max (20748753 vs. 16777216) #2078](https://github.com/apache/arrow-adbc/issues/2078)を参照し、Database Optionに`adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value`を追加してください。

10. Q: エラー`invalid bearer token`が報告されます。

A: `SET PROPERTY FOR 'root' 'max_user_connections' = '10000';`を実行して現在のユーザーの現在の最大接続数を10000に変更し、`fe.conf`にqe_max_connection=30000とarrow_flight_token_cache_size=8000を追加してFEを再起動してください。

ADBC ClientとArrow Flight Server間の接続は本質的に長期接続で、Auth Token、Connection、SessionをServer上でキャッシュする必要があります。接続が作成された後、単一クエリの終了時にすぐに切断されることはありません。ClientがCloseリクエストを送信してクリーンアップする必要がありますが、実際にはClientがCloseリクエストを送信しないことが多いため、Auth Token、Connection、SessionはArrow Flight Server上に長期間保存されます。デフォルトでは3日後にタイムアウトして切断されるか、接続数が`arrow_flight_token_cache_size`の制限を超えた後にLRUに従って除去されます。

Doris v2.1.8の時点で、Arrow Flight接続とMysql/JDBC接続は同じ接続制限を使用し、すべてのFEユーザーの総接続数`qe_max_connection`と`UserProperty`の単一ユーザーの接続数`max_user_connections`が含まれます。しかし、デフォルトの`qe_max_connection`と`max_user_connections`はそれぞれ1024と100です。Arrow Flight SQLはJDBCシナリオの代替として使用されることが多いですが、JDBC接続はクエリ終了後すぐに解放されます。そのため、Arrow Flight SQLを使用する際、DorisのデフォルトJDBC制限が小さすぎて、接続数が`arrow_flight_token_cache_size`の制限を超え、使用中の接続が除去されることがよくあります。

11. Q: JDBCやJAVAを使用してArrow Flight SQLに接続してDatatime型を読み取ると、フォーマットされた時間ではなくタイムスタンプが返されます。

A: JDBCやJAVAを使用してArrow Flight SQLに接続してDatatime型を読み取る場合、タイムスタンプを自分で変換する必要があります。[Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578)を参照してください。Python Arrow Flight SQLを使用してDatatime型を読み取ると`2025-03-03 17:23:28Z`の結果が返されますが、JDBCやJAVAは`1740993808`を返します。

12. Q: JDBCやJava JDBC ClientでArrow Flight SQLに接続してArrayネスト型を読み取ると、エラー`Configuration does not provide a mapping for array column 2`が返されます。

A: [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java)を参照してJAVA ADBC Clientを使用してください。

Python ADBC Client、JAVA ADBC Client、Java JDBC DriverManagerはすべてArrayネスト型の読み取りに対応しています。JDBCやJava JDBC ClientでArrow Flight SQLに接続する場合のみ問題があります。実際、Arrow Flight JDBCの互換性は保証されていません。これはArrowの公式開発ではなく、第三者データベース会社Dremioによるものです。以前にも他の互換性問題が発見されているため、まずJAVA ADBC Clientの使用を推奨します。

## 2.1 Release Note

> Doris Arrow Flightはv2.1.4以前のバージョンでは完全ではないため、使用前のアップグレードを推奨します。

### v2.1.9

1. DorisデータのArrowへのシリアライゼーション問題を修正。
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- `Decimal256`型の読み取り失敗；
- `DatetimeV2`型読み取りの軽微なエラー；
- `DateV2`型読み取り結果の不正確さ；
- `IPV4/IPV6`型読み取り時、結果がNULLの場合のエラー；

2. Doris Arrow Flight SQLクエリ失敗時に空の結果を返し、実際のエラー情報を返さない問題を修正。
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v2.1.8

1. DBeaverなどのBIツールが`arrow-flight-sql`プロトコルを使用してDorisに接続し、メタデータツリーの正しい表示をサポート。
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 複数のBEがクラスタの外部からアクセス可能な同じIPを共有する場合、クエリ結果を正しく転送してADBC Clientに返すことができる。
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

3. 複数エンドポイントの並列読み取りをサポート。
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

4. クエリエラー`FE not found arrow flight schema`を修正。
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

5. NULLを許可するカラムを読み取る際のエラー`BooleanBuilder::AppendValues`を修正。
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

6. `show processlist`で重複したConnection IDが表示される問題を修正。
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

7. `Datetime`と`DatetimeV2`型読み取り時にタイムゾーンが失われ、実際のデータより8時間少ないdatetimeになる問題を修正。
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v2.1.7

1. 頻繁なログ出力`Connection wait_timeout`を修正。
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

2. Arrow Flight Bearer TokenがCacheから期限切れで除去される問題を修正。
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

### v2.1.6

1. クエリエラー`0.0.0.0:xxx, connection refused`を修正。
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. クエリエラー`Reach limit of connections`を修正。
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

以前のバージョンでは、`SET PROPERTY FOR 'root' 'max_user_connections' = '1024';`を実行して現在のユーザーの現在の最大接続数を1024に変更することで、一時的に回避できます。

以前のバージョンはArrow Flight接続数を`qe_max_connection/2`未満に制限するのみで、`qe_max_connection`は全feユーザーの総接続数でデフォルトは1024ですが、単一ユーザーのArrow Flight接続数を`UserProperty`の`max_user_connections`未満（デフォルト100）に制限していないため、Arrow Flight接続数が現在のユーザーの接続数上限を超えるとエラー`Reach limit of connections`が報告されるため、現在のユーザーの`max_user_connections`を増加させる必要があります。

問題の詳細については以下を参照：[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. 1回で返されるクエリ結果のArrowBatchサイズを変更することをサポートするConf `arrow_flight_result_sink_buffer_size_rows`を追加、デフォルトは4096 * 8。
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v2.1.5

1. Arrow Flight SQLクエリ結果が空になる問題を修正。
[Fix arrow flight result sink #36827](https://github.com/apache/doris/pull/36827)

Doris v2.1.4は大量のデータを読み取る際にエラーが報告される可能性があります。詳細については以下を参照：[Questions](https://ask.selectdb.com/questions/D1Ia1/arrow-flight-sql-shi-yong-python-de-adbc-driver-lian-jie-doris-zhi-xing-cha-xun-sql-du-qu-bu-dao-shu-ju)

## 3.0 Release Note

### v3.0.5

1. DorisデータのArrowへのシリアライゼーション問題を修正。
[Fix UT DataTypeSerDeArrowTest of Array/Map/Struct/Bitmap/HLL/Decimal256 types](https://github.com/apache/doris/pull/48944)
- `Decimal256`型の読み取り失敗；
- `DatetimeV2`型読み取りの軽微なエラー；
- `DateV2`型読み取り結果の不正確さ；
- `IPV4/IPV6`型読み取り時、結果がNULLの場合のエラー；

### v3.0.4

1. DBeaverなどのBIツールが`arrow-flight-sql`プロトコルを使用してDorisに接続し、メタデータツリーの正しい表示をサポート。
[Support arrow-flight-sql protocol getStreamCatalogs, getStreamSchemas, getStreamTables #46217](https://github.com/apache/doris/pull/46217)。

2. 複数エンドポイントの並列読み取りをサポート。
[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)

3. NULLを許可するカラムを読み取る際のエラー`BooleanBuilder::AppendValues`を修正。
[Fix Doris NULL column conversion to arrow batch](https://github.com/apache/doris/pull/43929)

4. `show processlist`で重複したConnection IDが表示される問題を修正。
[Fix arrow-flight-sql ConnectContext to use a unified ID #46284](https://github.com/apache/doris/pull/46284)

5. Doris Arrow Flight SQLクエリ失敗時に空の結果を返し、実際のエラー情報を返さない問題を修正。
[Fix query result is empty and not return query error message](https://github.com/apache/doris/pull/45023)

### v3.0.3

1. クエリエラー`0.0.0.0:xxx, connection refused`を修正。
[Fix return result from FE Arrow Flight server error 0.0.0.0:xxx, connection refused](https://github.com/apache/doris/pull/40002)

2. クエリエラー`Reach limit of connections`を修正。
[Fix exceed user property max connection cause Reach limit of connections #39127](https://github.com/apache/doris/pull/39127)

以前のバージョンでは、`SET PROPERTY FOR 'root' 'max_user_connections' = '1024';`を実行して現在のユーザーの現在の最大接続数を1024に変更することで、一時的に回避できます。

以前のバージョンはArrow Flight接続数を`qe_max_connection/2`未満に制限するのみで、`qe_max_connection`は全feユーザーの総接続数でデフォルトは1024ですが、単一ユーザーのArrow Flight接続数を`UserProperty`の`max_user_connections`未満（デフォルト100）に制限していないため、Arrow Flight接続数が現在のユーザーの接続数上限を超えるとエラー`Reach limit of connections`が報告されるため、現在のユーザーの`max_user_connections`を増加させる必要があります。

問題の詳細については以下を参照：[Questions](https://ask.selectdb.com/questions/D18b1/2-1-4-ban-ben-python-shi-yong-arrow-flight-sql-lian-jie-bu-hui-duan-kai-lian-jie-shu-zhan-man-da-dao-100/E1ic1?commentId=10070000000005324)

3. 頻繁なログ出力`Connection wait_timeout`を修正。
[Fix kill timeout FlightSqlConnection and FlightSqlConnectProcessor close](https://github.com/apache/doris/pull/41770)

4. Arrow Flight Bearer TokenがCacheから期限切れで除去される問題を修正。
[Fix Arrow Flight bearer token cache evict after expired](https://github.com/apache/doris/pull/41754)

5. 複数のBEがクラスタの外部からアクセス可能な同じIPアドレスを共有する場合、クエリ結果を正しく転送してADBC Clientに返すことができる。
[Arrow flight server supports data forwarding when BE uses public vip](https://github.com/apache/doris/pull/43281)

6. クエリエラー`FE not found arrow flight schema`を修正。
[Fix FE not found arrow flight schema](https://github.com/apache/doris/pull/43960)

7. `Datetime`と`DatetimeV2`型読み取り時にタイムゾーンが失われ、実際のデータより8時間少ないdatetimeになる問題を修正。
[Fix time zone issues and accuracy issues #38215](https://github.com/apache/doris/pull/38215)

### v3.0.2

1. 1回のトランザクションで返されるクエリ結果のArrowBatchサイズを変更することをサポートするConf `arrow_flight_result_sink_buffer_size_rows`を追加、デフォルトは4096 * 8。
[Add config arrow_flight_result_sink_buffer_size_rows](https://github.com/apache/doris/pull/38221)

### v3.0.1

1. クエリ結果の欠落、クエリ結果行数 = 実際の行数 / BE数
[Fix get Schema failed when enable_parallel_result_sink is false #37779](https://github.com/apache/doris/pull/37779)

Doris 3.0.0では、クエリの最外層が集約で、SQLが`select k1, sum(k2) from xxx group by k1`のような場合、（クエリ結果行数 = 実際の行数 / BE数）という問題に遭遇する可能性があります。これは[support parallel result sink](https://github.com/apache/doris/pull/36053)によって導入された問題です。[Fix get Schema failed when enable_parallel_result_sink is false](https://github.com/apache/doris/pull/37779)は一時的な修正で、[Arrow Flight support multiple endpoints](https://github.com/apache/doris/pull/44286)が複数エンドポイントの並列読み取りをサポートした後に正式に修正されます。
