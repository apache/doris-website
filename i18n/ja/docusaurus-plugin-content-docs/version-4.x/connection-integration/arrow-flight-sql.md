---
{
    "title": "Arrow Flight SQL による高速データ転送",
    "sidebar_label": "Arrow Flight SQL",
    "language": "ja",
    "description": "Doris から大量のデータを高速に読み取る方法を説明します。Arrow Flight SQL プロトコルを使用すると、Python/Java クライアントは Arrow の列指向形式でデータを直接取得でき、シナリオによっては MySQL/JDBC より数十倍から数百倍高速です。BI ツールとの連携と一般的なエラーの対処方法も紹介します。",
    "keywords": [
        "Arrow Flight SQL",
        "ADBC Driver",
        "Doris の列指向読み取り",
        "pydoris",
        "jdbc:arrow-flight-sql",
        "flight-sql-jdbc-core",
        "Doris の高速データ転送",
        "i/o timeout",
        "invalid bearer token",
        "parameter ordinal 1 out of range"
    ]
}
---

<!-- Knowledge type: Capability definition + Operation steps + Troubleshooting -->
<!-- Applicable scenarios: High-speed read of Doris data / Python/Java integration / BI tool integration / Troubleshooting -->

:::caution 実験的機能
このドキュメントで説明する Arrow Flight SQL による高速データ転送は、現在**実験的機能**です。本番環境での使用は推奨しません。使用中に問題が発生した場合は、メーリングリストまたは [GitHub Issue](https://github.com/apache/doris/issues/65615) で報告してください。
:::

Doris 2.1 以降、Arrow Flight SQL プロトコルを使用した高速データ転送経路が実装され、複数の言語から SQL を使って Doris の大量のデータを高速に読み取れるようになりました。MySQL Client や JDBC/ODBC ドライバーを使用する方法と比べ、一部のシナリオでは性能が数十倍から数百倍向上します。Arrow Flight SQL は、同じプロトコルに対応するデータベースと連携できる汎用 JDBC ドライバーも提供します。

## 適用シナリオ

- Doris から大規模なデータを一括エクスポートして分析する場合（MySQL/JDBC プロトコルと比較して数十倍から数百倍の性能向上）。
- 後続のデータ分析で Apache Arrow や Pandas などの列指向形式を使用し、行指向から列指向への変換コストを避けたい場合。
- DBeaver などの BI ツールから Arrow Flight SQL プロトコルを使用して Doris にアクセスする場合。
- Spark や Flink などのビッグデータコンポーネントから、Doris のデータを Arrow 形式で高速に読み取る場合。

## 実装の仕組み

<!-- Knowledge type: Architecture principle -->

Doris では、クエリ結果は列指向形式の Block として保持されます。2.1 より前のバージョンでは、MySQL Client または JDBC/ODBC ドライバーを介して結果をクライアントに送信する際に、列指向の Block を行指向のバイト列にシリアライズし、クライアント側で再び列指向形式にデシリアライズする必要がありました。

Arrow Flight SQL による高速データ転送では、クライアントも Arrow の列指向形式に対応していれば、転送の全過程でシリアライズとデシリアライズを回避でき、それらに伴う時間と性能上のコストをなくせます。

![Arrow Flight SQL のデータ転送経路](/images/next/connection-integration/arrow-flight.jpg)

参考資料:

- Apache Arrow の公式インストールガイド: [Apache Arrow](https://arrow.apache.org/install/)
- Doris における Arrow Flight プロトコルの実装: [Doris support Arrow Flight SQL protocol](https://github.com/apache/doris/issues/25514)

## サーバー側の設定

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Pre-deployment preparation -->

Arrow Flight SQL を使用する前に、Doris の FE と BE で Arrow Flight SQL サービスを有効にする必要があります。

1. `arrow_flight_sql_port` を `fe/conf/fe.conf` で変更し、`8070` などの使用可能なポートに設定します。
2. `arrow_flight_sql_port` を `be/conf/be.conf` で変更し、`8050` などの使用可能なポートに設定します。
3. クラスターを再起動します。

:::caution
`arrow_flight_sql_port` は、`fe.conf` と `be.conf` で異なる値に設定してください。
:::

正常に起動したことを確認する方法:

| 役割 | ログファイル     | 確認する文字列                        |
| ---- | ---------------- | ------------------------------------- |
| FE   | `fe/log/fe.log`  | `Arrow Flight SQL service is started` |
| BE   | `be/log/be.INFO` | `Arrow Flight Service bind to host`   |

## Python での使用方法

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Python application integration with Doris -->

Python ADBC Driver を使用して Doris に接続すると、データを非常に高速に読み取れます。必要な Python のバージョンは 3.9 以上です。以下では、ADBC Driver を使用した DDL、DML、セッション変数の設定、SHOW 文など、一般的なデータベース操作を示します。

### 1. 依存ライブラリのインストール

ADBC Driver は PyPI で公開されており、`pip` でインストールできます。

```bash
pip install adbc_driver_manager
pip install adbc_driver_flightsql
```

コードでは、次のモジュールをインポートして使用します。

```Python
import adbc_driver_manager
import adbc_driver_flightsql.dbapi as flight_sql

>>> print(adbc_driver_manager.__version__)
1.1.0
>>> print(adbc_driver_flightsql.__version__)
1.1.0
```

### 2. 接続の確立

Doris の Arrow Flight SQL サービスと通信するクライアントを作成するには、FE のホスト、Arrow Flight のポート、ユーザー名、パスワードを指定します。

FE と BE の Arrow Flight SQL サービスがそれぞれポート `8070` と `8050` で動作し、ユーザー名とパスワードが `user` と `pass` であるとします。接続手順は次のとおりです。

```Python
conn = flight_sql.connect(uri="grpc://{FE_HOST}:{fe.conf:arrow_flight_sql_port}", db_kwargs={
            adbc_driver_manager.DatabaseOptions.USERNAME.value: "user",
            adbc_driver_manager.DatabaseOptions.PASSWORD.value: "pass",
        })
cursor = conn.cursor()
```

接続後は、返された Cursor を使用して SQL で Doris を操作し、テーブルの作成、メタデータの取得、データの取り込み、クエリなどを実行できます。

### 3. DDL の実行とメタデータの取得

`cursor.execute()` 関数に SQL を渡して、テーブルの作成やメタデータの取得を実行します。

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

`StatusResult` が `0` を返した場合、クエリは正常に実行されています（この仕様は JDBC との互換性のためです）。

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

### 4. データの取り込み

`INSERT INTO` を実行して、作成したテーブルに少量のテストデータを取り込みます。

```Python
cursor.execute("""INSERT INTO arrow_flight_sql_test VALUES
        ('0', 0.1, "ID", 0.0001, 9999999999, '2023-10-21'),
        ('1', 0.20, "ID_1", 1.00000001, 0, '2023-10-21'),
        ('2', 3.4, "ID_1", 3.1, 123456, '2023-10-22'),
        ('3', 4, "ID", 4, 4, '2023-10-22'),
        ('4', 122345.54321, "ID", 122345.54321, 5, '2023-10-22');""")
print(cursor.fetchallarrow().to_pandas())
```

次の出力は、取り込みが成功したことを示します。

```text
  StatusResult
0            0
```

:::tip
Doris に大量のデータを取り込む場合は、`pydoris` で Stream Load を実行することを推奨します。
:::

### 5. クエリの実行

取り込んだデータを、集計、並べ替え、セッション変数の設定を含めてクエリします。

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

出力:

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
結果を列指向形式のまま取得するには、次のいずれかの方法を使用します。

- `cursor.fetchallarrow()`: Arrow 形式で返します。
- `cursor.fetch_df()`: Pandas DataFrame を直接返します。

`cursor.fetchall()` は使用しないでください。列指向データを行指向形式に戻すため、実質的に mysql-client を使用する場合と同じになります。クライアント側で列から行への変換が増える分、mysql-client より遅くなることもあります。
:::

### 6. 完全なサンプル

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

## Java での使用方法

<!-- Knowledge type: Operation steps + Architecture selection decision -->
<!-- Applicable scenarios: Java application integration with Doris -->

Java では三種類の接続方法を選択できます。それぞれの特徴と選択の目安は次のとおりです。

| 接続方法                            | URL 形式                     | 戻り値の形式         | 推奨するシナリオ                                                    |
| ----------------------------------- | ----------------------------- | ---------------------- | ------------------------------------------------------------------- |
| **JDBC (`jdbc:arrow-flight-sql`)**  | `jdbc:arrow-flight-sql://...` | JDBC ResultSet（行指向） | 後続の分析で**行指向形式**を使用する場合、または BI ツールや既存の JDBC コードとの互換性が必要な場合 |
| **Flight ADBC Driver**              | `grpc://...`                  | Arrow（列指向）      | 後続の分析で **Arrow / 列指向形式**を使用し、性能を重視する場合 |
| **Flight JDBC Driver（ADBC ラッパー）** | `jdbc:arrow-flight-sql://...` | Arrow（列指向）      | Flight ADBC Driver と同じ用途で、プロジェクト内で `jdbc:arrow-flight-sql` 形式の URL を使い続ける必要がある場合 |

接続方法ごとの性能を試すには、[JDBC/Java Arrow Flight SQL Sample](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/README.md) のデモを参照してください。想定される結果は [Add Arrow Flight Sql demo for Java](https://github.com/apache/doris/pull/45306) に記載されています。Java の Arrow Flight SQL 接続方法と従来の `jdbc:mysql` の性能比較については、[GitHub Issue 25514（セクション 6.2）](https://github.com/apache/doris/issues/25514) を参照してください。

**その他の推奨事項:**

- JDBC の `ResultSet` と Arrow データのどちらを解析する場合も、解析時間はデータの読み取り自体にかかる時間より長くなります。Arrow Flight SQL による `jdbc:mysql://` からの性能向上が小さい場合は、まずデータ解析に時間がかかりすぎていないか確認してください。
- どの接続方法でも、JDK 17 のほうが JDK 1.8 より高速にデータを読み取れます。
- データ量が非常に多い場合、Arrow Flight SQL は `jdbc:mysql://` よりメモリ使用量が少なくなります。メモリに制約がある場合は、Arrow Flight SQL を先に試してください。
- 上記の三種類の方法に加え、ネイティブの `FlightClient` を使用して Arrow Flight Server に直接接続することもできます。この方法は柔軟性が高く、複数の Endpoint からの並列読み取りに対応します。Flight ADBC Driver 自体も `FlightClient` に基づいて接続を作成しますが、`FlightClient` を直接使うより簡単です。

:::caution
Java 9 以降を使用する場合は、JDK 内部の一部にアクセスできるように、Java コマンドに `--add-opens=java.base/java.nio=ALL-UNNAMED` を追加する必要があります。追加しないと、次のいずれかのエラーが発生します。

- `module java.base does not "opens java.nio" to unnamed module`
- `module java.base does not "opens java.nio" to org.apache.arrow.memory.core`
- `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

このオプションは次の二通りの方法で追加できます。

```shell
# Option 1: Add via command-line argument directly
$ java --add-opens=java.base/java.nio=ALL-UNNAMED -jar ...

# Option 2: Add via environment variable
$ env _JAVA_OPTIONS="--add-opens=java.base/java.nio=ALL-UNNAMED" java -jar ...
```

IntelliJ IDEA でデバッグする場合は、`Build and run` にこの引数を追加します。この項目は `Run/Debug Configurations` にあります。次の図を参照してください。

![IntelliJ IDEA での Arrow Flight SQL の設定](/images/db-connect/arrow-flight-sql/arrow-flight-sql-IntelliJ.png)
:::

### 方法 1: `jdbc:arrow-flight-sql`

Arrow Flight SQL プロトコル向けのオープンソース JDBC ドライバーは、標準の JDBC API と互換性があります。ほとんどの BI ツールが JDBC 経由で Doris にアクセスでき、Apache Arrow データの高速転送にも対応します。使用方法は MySQL JDBC ドライバーと似ています。接続 URL の `jdbc:mysql` プロトコルを `jdbc:arrow-flight-sql` に置き換えるだけです。クエリ結果は引き続き JDBC の `ResultSet` データ構造で返されます。

POM の依存関係:

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

接続コードの例:

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

### 方法 2: Flight ADBC Driver / Flight JDBC Driver

JDBC のほかに、Java では Driver を作成して Doris から直接データを読み取り、Arrow 形式で返すこともできます。以下の例では、ADBC Driver と JDBC Driver（ADBC ラッパー）を使用して Doris Arrow Flight Server に接続する方法を示します。

POM の依存関係:

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

接続コードの例:

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

#### Flight JDBC Driver（ADBC ラッパー）

接続コードの例:

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

## 型の対応関係

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Parsing Arrow results on the client -->

:::caution 動作の変更（4.1.4）

バージョン 4.1.4 以降、Arrow Flight SQL が返す `DATETIME` / `DATETIMEV2` の値は、**タイムゾーン情報を持たない** Arrow タイムスタンプです。一方、`TIMESTAMPTZ` は引き続きタイムゾーン情報を持つタイムスタンプとして返されます。

4.1.4 より前は、`DATETIME` にタイムゾーン情報があると示されていたため、クライアントがローカルタイムゾーンで解析すると余分なタイムゾーンオフセットが適用されていました。アップグレード後は、`DATETIME` 列をタイムゾーン情報のないローカル時刻の値として解析してください。

同じバージョンでは、次の型メタデータも修正されています。

- `GetTables` メタデータエンドポイントで、`DATEV2` の Arrow 型が `Date(MILLISECOND)` から `Date(DAY)` に修正されました。
- `ARRAY` / `MAP` / `STRUCT` のメタデータは、プレースホルダーの型ではなく、実際の子フィールドの型を返すようになりました。

:::

## サードパーティーコンポーネントとの連携

<!-- Knowledge type: Integration solution -->
<!-- Applicable scenarios: BI tool / Spark / Flink integration -->

### BI ツール（DBeaver など）

Doris v2.1.8 以降、DBeaver などの BI ツールは `arrow-flight-sql` プロトコルを使用して Doris に接続できます。設定方法は、次を参照してください。

- [DBeaver クライアントで JDBC ドライバーを使用する方法](https://www.dremio.com/blog/jdbc-driver-for-arrow-flight-sql/#h-how-to-use-jdbc-driver-with-dbeaver-client)
- [Dremio Sonar - クライアントアプリケーション: DBeaver](https://docs.dremio.com/current/sonar/client-applications/clients/dbeaver/?_gl=1*1epgwh0*_gcl_au*MjUyNjE1ODM0LjE3MzQwMDExNDg)

### Spark and Flink

Arrow Flight には、Spark と Flink を公式にサポートする計画はありません（[GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490) を参照）。ただし、バージョン 24.0.0 以降、以下のコネクターは Arrow Flight SQL を介した Doris へのアクセスに対応しており、読み取り性能が数倍向上することが期待されます。

- [Doris Spark Connector](https://github.com/apache/doris-spark-connector)
- [Doris Flink Connector](https://github.com/apache/doris-flink-connector)

コミュニティでは以前、[Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector) を参考に、Spark から `FlightClient` を介して Doris に接続するテストを行いました。その結果は次のとおりです。

- Arrow と Doris Block 間の変換は、CSV と Doris Block 間の変換より 10 倍高速です。
- Arrow は Map や Array などの複合型への対応が優れています。
- Arrow データは圧縮率が高く、転送時のネットワーク負荷を抑えられます。

ただし、Doris Arrow Flight には、複数ノードからの並列読み取りがまだ実装されていません。クエリ結果は返却前に単一の BE ノードに集約されます。単純な大量データのエクスポートでは、Tablet 単位の並列読み取りに対応する Doris Spark Connector より性能が低い場合があります。

Spark から Arrow Flight SQL を使用して Doris に接続する機能を独自に実装する場合は、次のオープンソースプロジェクトを参考にできます。

- [Spark-Flight-Connector](https://github.com/qwshen/spark-flight-connector)
- [Dremio-Flight-Connector](https://github.com/dremio-hub/dremio-flight-connector)

## 高度な設定

<!-- Knowledge type: Configuration parameters + Deployment solution -->
<!-- Applicable scenarios: Performance tuning / Complex deployment topologies -->

### 複数 BE からの並列結果返却

Doris はデフォルトで、すべての BE ノードからのクエリ結果を単一の BE ノードに集約します。プロトコルごとの動作は次のとおりです。

- **MySQL/JDBC クエリ**: FE が、結果を集約した BE ノードからクエリ結果を取得します。
- **Arrow Flight SQL クエリ**: FE がその BE ノードの IP/ポートを Endpoint に格納し、ADBC Client に返します。ADBC Client は、その Endpoint からデータを取得します。

#### シナリオ 1: 単純な SELECT による取得（Join/Sort/ウィンドウ関数なし）

クエリが、Join、Sort、ウィンドウ関数などのデータの再分配を伴う演算子を使用しない単純な SELECT であれば、Tablet 単位で分割できます。Doris Spark/Flink Connector は、この方法で次の二段階により並列読み取りを実現します。

1. `EXPLAIN SQL` を実行します。FE が返すクエリプランには、ScanOperator 内に Tablet ID の完全なリストが含まれます。
2. その Tablet ID リストに基づき、元の SQL を複数の SQL 文に分割します。それぞれが一部の Tablet だけを読み取るようにします。例:

    ```sql
    SELECT * FROM t1 TABLET(10001,10002) limit 1000;
    ```

    分割した SQL 文は並列に実行できます。詳細は [Support select table sample](https://github.com/apache/doris/pull/10170) を参照してください。

#### シナリオ 2: 最外層で集計するクエリ

`select k1, sum(k2) from xxx group by k1` のようなクエリでは、Doris v3.0.4 以降、次の設定によって各 BE ノードがそれぞれの結果を返せます。

```sql
set enable_parallel_result_sink=true;
```

FE から返された Endpoint のリストを受け取ると、ADBC Client は複数の BE ノードから結果を並列に取得します。実装の詳細は [support parallel result sink](https://github.com/apache/doris/pull/36053) を参照してください。

:::caution
集計結果が小さい場合、複数の BE から結果を返すと RPC の負荷が増加します。
:::

理論上は、最外層で並べ替えを行うクエリ以外なら、BE ノードごとの並列結果返却に対応できます。ただし、これはまだ実装されていません。

### 複数の BE が同じ外部アクセス IP を共有する場合

FE ノードにはクラスター外部からアクセスできるものの、すべての BE ノードにはクラスター内部からしかアクセスできない構成があります。

- MySQL Client または JDBC で Doris に接続してクエリを実行する場合、結果は FE から返されるため動作します。
- Arrow Flight SQL で Doris に接続する場合、ADBC Client が結果の取得のため BE ノードに直接接続する必要があるため、クエリを実行できません。

本番環境では、BE ノードをクラスター外部に公開することが難しい場合が一般的です。すべての BE ノードの前段に Nginx などのリバースプロキシを配置すると、Nginx に接続した外部クライアントを BE ノードのいずれかにランダムに振り分けられます。ただし、Arrow Flight SQL のクエリ結果は、デフォルトで特定の BE ノードにランダムに保存されます。そのノードと Nginx が振り分けたノードが異なる場合、BE 内部でデータを転送する処理が発生します。

Doris v2.1.8 以降、`public_host` と `arrow_flight_sql_proxy_port` を、すべての BE ノードの `be.conf` で複数の BE が共有する外部アクセス用 IP とポートに設定できます。クエリ結果は適切に転送され、ADBC Client に返されます。

```conf
public_host={nginx ip}
arrow_flight_sql_proxy_port={nginx port}
```

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Error diagnosis / Compatibility issues -->

### 1. エラー `i/o timeout`

**Q:** エラーメッセージの全文は `connection error: desc = "transport: Error while dialing: dial tcp <ip:arrow_flight_port>: i/o timeout"` です。

**A:** エラーメッセージ中の `<ip:arrow_flight_port>` が示すノードの役割に応じて、次の二つの場合に分けて調査します。

**ケース 1: `<ip:arrow_flight_port>` が FE ノードの IP と `arrow_flight_port` を示す場合**

1. FE ノードの Arrow Flight Server が正常に起動したか確認します。`Arrow Flight SQL service is started` が `fe/log/fe.log` にあれば、正常に起動しています。
2. FE の Arrow Flight Server が正常に起動している場合は、クライアントマシンからこの IP に `ping` できるか確認します。到達できない場合は、FE ノードに外部からアクセス可能な IP を設定し、クラスターを再デプロイする必要があります。

**ケース 2: `<ip:arrow_flight_port>` が BE ノードの IP と `arrow_flight_port` を示す場合**

1. BE ノードの Arrow Flight Server が正常に起動したか確認します。`Arrow Flight Service bind to host` が `be/log/be.INFO` にあれば、正常に起動しています。
2. BE の Arrow Flight Server が正常に起動している場合は、クライアントマシンからこの IP に `ping` できるか確認します。

BE ノードがクラスターの内部ネットワーク上にあることが分かっている場合は、次のいずれかの方法を使用します。

- 各 BE ノードに外部からアクセス可能な IP を設定します。Doris v2.1.8 以降は、`public_host` をその BE ノードの `be.conf` でこの IP に設定します。同様に、すべての BE ノードの `public_host` を、それぞれクライアントからアクセスできる IP に設定します。
- [複数の BE が同じ外部アクセス IP を共有する場合](#multiple-bes-sharing-the-same-external-access-ip) を参照し、すべての BE ノードの前段にリバースプロキシを配置します。

BE が完全に内部ネットワーク上にあるか不明な場合は、次の手順で確認します。

1. BE ノードのマシンで `ifconfig` を実行し、すべての IP を確認します。そのうちの一つは `<ip:arrow_flight_port>` の IP、および `show backends` に表示される IP と一致するはずです。
2. `ping` を使用して、`ifconfig` で得た他の各 IP への到達性をクライアントから順に確認します。
3. クライアントから到達可能な IP があれば、それを `public_host` に設定します。いずれにも到達できなければ、BE ノードは完全に内部ネットワーク上にあります。

### 2. JDBC または Java で Arrow Flight SQL に接続するときのエラー `module java.base does not "opens java.nio"...`

**Q:** 次のいずれかのエラーが発生する場合があります。

- `module java.base does not "opens java.nio" to unnamed module`
- `module java.base does not "opens java.nio" to org.apache.arrow.memory.core`
- `java.lang.NoClassDefFoundError: Could not initialize class org.apache.arrow.memory.util.MemoryUtil (Internal; Prepare)`

**A:** 次のように対処します。

1. `JAVA_OPTS_FOR_JDK_17` は `fe/conf/fe.conf` にある設定です。この設定に `--add-opens=java.base/java.nio=ALL-UNNAMED` が含まれているか確認し、含まれていなければ追加します。
2. [Java での使用方法](#java-usage) を参照し、Java コマンドに `--add-opens=java.base/java.nio=ALL-UNNAMED` を追加します。
3. IntelliJ IDEA でデバッグする場合は、`--add-opens=java.base/java.nio=ALL-UNNAMED` を `Build and run` に追加します。この項目は `Run/Debug Configurations` にあります。

### 3. ARM 環境でのエラー `arrow flight schema timeout`

**Q:** エラーメッセージの全文は `get flight info statement failed, arrow flight schema timeout, TimeoutException: Waited 5000 milliseconds for io.grpc.stub.Client` です。

**A:** Linux カーネルのバージョンが 4.19.90 以下の場合は、4.19.279 以降にアップグレードするか、古いバージョンの Linux カーネル環境で Doris BE を再コンパイルする必要があります。具体的なコンパイル方法は、`docs/dev/install/source-install/compilation-arm` を参照してください。

**原因:** 古い Linux カーネルには Arrow との互換性の問題があります。`cpp: arrow::RecordBatch::MakeEmpty()` が Arrow Record Batch の構築中に停止するため、BE の Arrow Flight Server は 5000ms 以内に FE の RPC リクエストに応答できず、FE がクライアントに RPC タイムアウトエラーを返します。Spark と Flink も Doris の読み取り時にクエリ結果を Arrow Record Batch に変換して返すため、同じ問題が発生します。

KylinV10 SP2 と SP3 の Linux カーネルは `4.19.90-24.4.v2101.ky10.aarch64` までしか提供されず、それ以降にアップグレードできません。そのため、KylinV10 上で Doris BE を再コンパイルする必要があります。新しい `ldb_toolchain` でコンパイルしても問題が続く場合は、古い `ldb_toolchain v0.17` を試してください。ARM 環境からインターネットに接続できない場合、Huawei Cloud は ARM + KylinV10、Alibaba Cloud は x86 + KylinV10 の環境を提供しています。

### 4. Prepared Statement のパラメーター指定エラー

**Q:** Prepared Statement でパラメーターを指定する場合（例: `select * from xxx where id=?`）、`parameter ordinal 1 out of range` というエラーが発生します。

**A:** 現在、`jdbc:arrow-flight-sql` と Java ADBC/JDBC Driver は、Prepared Statement によるパラメーター指定に対応していません。これは Arrow Flight SQL のバグです。詳細は [GitHub Issue](https://github.com/apache/arrow/issues/40118) を参照してください。

### 5. `jdbc:arrow-flight-sql` のバッチごとの読み取りサイズを変更する方法

**Q:** シナリオによっては、性能を向上させるためにバッチサイズを変更する必要があります。

**A:** `setTargetBatchSize` を、`makeJdbcConfig` メソッド（`org.apache.arrow.adbc.driver.jdbc.JdbcArrowReader` 内）で変更します。デフォルトは `1024` です。その後、変更したファイルを同じパスのローカルディレクトリに保存して元のファイルを上書きすると、変更が反映されます。

### 6. ADBC v0.10 は並列読み取りに非対応

**Q:** ADBC v0.10 の JDBC と Java ADBC/JDBC Driver は並列読み取りに対応していますか。

**A:** いいえ。`stmt.executePartitioned()` メソッドが実装されていないためです。複数の Endpoint から並列に読み取るには、ネイティブの FlightClient を使用して実装する必要があります。呼び出しの流れは次のとおりです。

```text
sqlClient = new FlightSqlClient
execute   = sqlClient.execute(sql)
endpoints = execute.getEndpoints()
for (FlightEndpoint endpoint : endpoints) { ... }
```

また、ADBC v0.10 のデフォルトの `AdbcStatement` は実際には `JdbcStatement` です。`executeQuery` の後、行指向の JDBC `ResultSet` が Arrow の列指向形式に変換されます。Java ADBC の機能は ADBC 1.0.0 でより充実する見込みです。詳細は [GitHub Issue](https://github.com/apache/arrow-adbc/issues/1490) を参照してください。

### 7. URL でのデータベース名の指定

**Q:** URL にデータベース名を指定できますか。

**A:** Arrow v15.0 の時点では、Arrow JDBC Connector は URL でのデータベース名の指定に対応していません。たとえば、`test` データベースを `jdbc:arrow-flight-sql://{FE_HOST}:{fe.conf:arrow_flight_sql_port}/test?useServerPrepStmts=false` で指定しても効果はありません。SQL の `use database` を手動で実行する必要があります。Arrow v18.0 では URL でのデータベース名の指定に対応していますが、実際の使用では依然としてバグがあります。

### 8. Python ADBC で警告 `Cannot disable autocommit` が表示される

**Q:** 警告の全文は `Warning: Cannot disable autocommit; conn will not be DB-API 2.0 compliant` です。

**A:** Python を使用する場合、この警告は無視できます。Python ADBC Client 側の問題であり、クエリには影響しません。

### 9. Python のエラー `grpc: received message larger than max`

**Q:** エラーメッセージの全文は `grpc: received message larger than max (20748753 vs. 16777216)` です。

**A:** [Python: grpc: received message larger than max #2078](https://github.com/apache/arrow-adbc/issues/2078) を参照し、Database Option に `adbc_driver_flightsql.DatabaseOptions.WITH_MAX_MSG_SIZE.value` を追加してください。

### 10. エラー `invalid bearer token`

**Q:** クライアントで `invalid bearer token` というエラーが発生します。

**A:** 次の操作を試してください。

1. 現在のユーザーの最大接続数を変更します。

    ```sql
    SET PROPERTY FOR 'root' 'max_user_connections' = '10000';
    ```

2. `fe.conf` に次の二項目を追加し、FE を再起動します。

    ```conf
    qe_max_connection=30000
    arrow_flight_token_cache_size=8000
    ```

**原因: 長時間維持される接続の保持機構**

ADBC Client と Arrow Flight Server の接続は、基本的に長時間維持される接続です。サーバーは Auth Token、Connection、Session をキャッシュする必要があります。接続は作成後、単一のクエリが終了してもすぐには閉じられません。クリーンアップには、クライアントからの `close()` リクエストが必要です。実際にはクライアントが `close()` を送信しないことが多いため、Auth Token、Connection、Session がサーバーに長期間残ります。デフォルトでは 3 日後にタイムアウトするか、接続数が `arrow_flight_token_cache_size` の上限を超えると LRU によって削除されます。

**原因: デフォルトの接続数上限が小さい**

Doris v2.1.8 の時点では、Arrow Flight 接続と MySQL/JDBC 接続は次の接続数上限を共有します。

- FE 上の全ユーザーの合計接続数: `qe_max_connection`、デフォルトは `1024`。
- ユーザーごとの接続数: `max_user_connections`（`UserProperty` 内）、デフォルトは `100`。

Arrow Flight SQL は JDBC の代わりに使われることが多い一方、JDBC 接続はクエリの終了後すぐに解放されます。そのため、Arrow Flight SQL を使用する場合、Doris のデフォルトの接続数上限では小さすぎることがあり、接続数が `arrow_flight_token_cache_size` を超えて、使用中の接続が削除される場合があります。

### 11. JDBC または Java で Datetime 型を読み取るとタイムスタンプが返される

**Q:** JDBC または Java で Arrow Flight SQL に接続して Datetime 型を読み取ると、タイムスタンプ（例: `1740993808`）が書式付きの時刻（例: `2025-03-03 17:23:28Z`）の代わりに返されます。

**A:** JDBC または Java で Arrow Flight SQL に接続して Datetime 型を読み取る場合は、タイムスタンプを自分で変換する必要があります。[Add java parsing datetime type in arrow flight sql sample #48578](https://github.com/apache/doris/pull/48578) を参照してください。Python Arrow Flight SQL は Datetime 型に対して `2025-03-03 17:23:28Z` を返しますが、JDBC または Java は `1740993808` を返します。

### 12. JDBC または Java JDBC Client で Array のネスト型を読み取るときのエラー

**Q:** エラーメッセージの全文は `Configuration does not provide a mapping for array column 2` です。

**A:** [`sample/arrow-flight-sql`](https://github.com/apache/doris/blob/master/samples/arrow-flight-sql/java/src/main/java/doris/arrowflight/demo/FlightAdbcDriver.java) を参照し、Java ADBC Client に切り替えることを推奨します。

Python ADBC Client、Java ADBC Client、Java JDBC DriverManager はいずれも Array のネスト型を問題なく読み取れます。この問題は、JDBC または Java JDBC Client を使用して Arrow Flight SQL に接続する場合にのみ発生します。Arrow Flight JDBC は Arrow の公式開発ではなく、サードパーティーのデータベース企業 Dremio が開発したもので、互換性が低くなります。過去にもほかの互換性の問題が見つかっているため、Java ADBC Client の使用を推奨します。
