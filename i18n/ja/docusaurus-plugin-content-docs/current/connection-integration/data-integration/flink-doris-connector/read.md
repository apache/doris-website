---
{
    "title": "Doris からのデータ読み取り",
    "language": "ja",
    "description": "Flink Doris Connector を使用し、Thrift または Arrow Flight SQL プロトコルと Source オプションを通じて、Doris のデータを並列に読み取ります。"
}
---

# Doris からのデータ読み取り {#reading-data-from-doris}

Flink Doris Connector では、Doris テーブルを Flink ジョブのソースとして使用できます。デフォルトではテーブルの有界スナップショットを読み取ります。行単位の変更を継続的に読み取る方法については、[Doris Binlog を使用した増分読み取り](./incremental-read.md)を参照してください。

## 読み取りの仕組み {#how-it-works}

![Flink Connector と JDBC による Doris データ読み取りの仕組み](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

Flink JDBC Connector と比較すると、Flink Doris Connector はデータ読み取り時の性能が高く、使用を推奨します。

- **Flink JDBC Connector**: Doris は MySQL プロトコルと互換性がありますが、JDBC を介した読み書きでは単一の FE ノード上でデータが直列に読み書きされるため、性能に影響するボトルネックが生じます。使用は推奨しません。
- **Flink Doris Connector**: Doris 2.1 以降、読み取りプロトコルのデフォルトとして ADBC プロトコルを使用します。読み取り処理は次のとおりです。
    1. Flink Doris Connector が FE からクエリプラン内の Tablet ID 情報を取得します。
    2. クエリ文 `SELECT * FROM tbs TABLET(id1, id2, id3)` を生成します。
    3. FE の ADBC ポート経由でクエリを実行します。
    4. BE がデータを直接返すため、データが FE を経由せず、FE の単一ノードによるボトルネックを解消できます。

## 読み取りプロトコル {#protocols}

次の二つの読み取りプロトコルをサポートしています。

| プロトコル | 説明 | 推奨バージョン |
| -------------- | ------------------------------------------------------------ | ------------------- |
| Thrift | BE の Thrift インターフェースを呼び出してデータを読み取ります | すべてのバージョンに対応 |
| ArrowFlightSQL | Doris 2.1 をベースに、Arrow Flight SQL プロトコルを介して大量のデータを高速に読み取ります | Connector 24.0.0+ |

- Thrift の処理フローについては、[Thrift インターフェースを介したデータ読み取り](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)を参照してください。
- ArrowFlightSQL の使用方法については、[Arrow Flight SQL をベースにした高速データ転送](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)を参照してください。Doris 2.1 以降では、ArrowFlightSQL 方式を推奨します。

## Flink SQL での読み取り {#flink-sql}

### Thrift 方式 {#thrift-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

### Arrow Flight SQL 方式 {#arrow-flight-sql-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '{fe.conf:http_port}',
    'table.identifier' = 'test.student',
    'source.use-flight-sql' = 'true',
    'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

## DataStream API での読み取り {#datastream-api-read}

`DorisSource` を使用した読み取りについては、[DataStream API](./datastream-api.md#source)を参照してください。

## オプション {#options}

一般的な接続オプションは[接続オプションと TLS](./connection.md#common-options)を、増分読み取りのオプションは[Doris Binlog を使用した増分読み取り](./incremental-read.md#options)を参照してください。

| キー | デフォルト値 | 必須 | 説明 |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s | N | Doris へのクエリのタイムアウト。デフォルト値は 6 時間です。 |
| doris.request.tablet.size | 1 | N | 一つの Partition に対応する Doris Tablet の数です。値を小さくすると生成される Partition が増え、Flink 側の並列度が上がりますが、Doris への負荷も増えます。 |
| doris.batch.size | 4064 | N | BE から一度に読み取る行の最大数です。値を大きくすると、Flink と Doris 間で確立される接続の数を減らし、ネットワーク遅延による追加の時間的オーバーヘッドを抑えられます。 |
| doris.exec.mem.limit | 8192mb | N | 単一クエリのメモリ上限です。デフォルトは 8GB で、単位はバイトです。 |
| source.use-flight-sql | TRUE | N | 読み取りに Arrow Flight SQL を使用するかどうかを指定します。 |
| source.flight-sql-port | - | N | Arrow Flight SQL で読み取る場合の FE の `arrow_flight_sql_port` です。 |

**DataStream 固有の設定**

| キー | デフォルト値 | 必須 | 説明 |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field | -- | N | Doris テーブルから読み取る列名のリストです。カンマで区切ります。 |
| doris.filter.query | -- | N | 読み取るデータを絞り込む式です。この式は Doris にそのまま渡され、データソース側での絞り込みに使用されます。例: `age=18`。 |
