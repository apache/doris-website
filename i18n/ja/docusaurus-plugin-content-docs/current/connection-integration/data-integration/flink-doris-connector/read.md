---
{
    "title": "Doris からのデータの読み取り",
    "language": "ja",
    "description": "Flink Doris Connector の Source オプションを使用し、Thrift または Arrow Flight SQL プロトコルを通じて Doris のデータを並列に読み取ります。"
}
---

# Doris からのデータの読み取り {#reading-data-from-doris}

Flink Doris Connector では、Doris テーブルを Flink ジョブのソースとして使用できます。デフォルトではテーブルのある時点のデータを読み取ります。行単位の変更を継続的に読み取る方法については、[Doris Changelog を使用した増分読み取り](./incremental-read.md)を参照してください。

## 読み取りの仕組み {#how-it-works}

![Flink Connector の JDBC と Doris による読み取りの仕組み](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

Flink Doris Connector は、データの読み取り時に Flink JDBC Connector より高い性能を発揮するため、使用を推奨します。

- **Flink JDBC Connector**: Doris は MySQL プロトコルと互換性がありますが、JDBC を介した読み書きでは、単一の FE ノードでデータが逐次的に読み書きされます。このため性能上のボトルネックが生じるので、使用は推奨しません。
- **Flink Doris Connector**: Doris 2.1 以降では、読み取りプロトコルとして ADBC プロトコルがデフォルトで使用されます。読み取り処理の流れは次のとおりです。
    1. Flink Doris Connector が FE からクエリプラン内の Tablet ID 情報を取得します。
    2. クエリ文 `SELECT * FROM tbs TABLET(id1, id2, id3)` を生成します。
    3. FE の ADBC ポートを介してクエリを実行します。
    4. BE がデータを直接返します。これにより、データが FE を経由せず、FE の単一ノードによるボトルネックが解消されます。

## 読み取りプロトコル {#protocols}

次の読み取りプロトコルに対応しています。

| プロトコル | 説明 | 推奨バージョン |
| ---------- | ---- | ------------------- |
| Thrift | BE の thrift インターフェースを呼び出してデータを読み取ります | すべてのバージョンに対応 |
| ArrowFlightSQL | Doris 2.1 を基盤とする Arrow Flight SQL プロトコルを介して、大量のデータを高速に読み取ります | Connector 24.0.0+ |

- Thrift を使用した処理の詳細については、[Thrift インターフェースを介したデータの読み取り](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)を参照してください。
- ArrowFlightSQL の使用方法については、[Arrow Flight SQL に基づく高速データ転送](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)を参照してください。Doris 2.1 以降では、ArrowFlightSQL の使用を推奨します。

## FlinkSQL での読み取り {#flink-sql}

### Thrift を使用する方法 {#thrift-method}

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

### Arrow Flight SQL を使用する方法 {#arrow-flight-sql-method}

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

共通の接続オプションは[接続オプションと TLS](./connection.md#common-options)に、増分読み取りのオプションは[Doris Changelog を使用した増分読み取り](./incremental-read.md#options)に記載されています。

| キー | デフォルト値 | 必須 | 説明 |
| ---- | ------------ | ---- | ---- |
| doris.request.query.timeout | 21600s | N | Doris へのクエリのタイムアウト。デフォルト値は 6 時間です。 |
| doris.request.tablet.size | 1 | N | つの Partition に対応する Doris Tablet の数。この値を小さくすると、生成される Partition が増えて Flink 側の並列度が上がりますが、Doris への負荷も増加します。 |
| doris.batch.size | 4064 | N | BE から一度に読み取る行の最大数。この値を大きくすると、Flink と Doris の間で確立する接続の数が減り、ネットワーク遅延による追加の時間的負荷を軽減できます。 |
| doris.exec.mem.limit | 8192mb | N | 単一のクエリに対するメモリ制限。デフォルトは 8GB で、単位はバイトです。 |
| source.use-flight-sql | TRUE | N | 読み取りに Arrow Flight SQL を使用するかどうか |
| source.flight-sql-port | - | N | Arrow Flight SQL を使用して読み取る場合の FE の `arrow_flight_sql_port` |

**DataStream 固有の設定**

| キー | デフォルト値 | 必須 | 説明 |
| ---- | ------------ | ---- | ---- |
| doris.read.field | -- | N | Doris テーブルから読み取る列名のリスト。カンマで区切ります。 |
| doris.filter.query | -- | N | 読み取るデータを絞り込む式。この式は Doris にそのまま渡され、データの読み取り元での絞り込みに使用されます。例: `age=18`。 |
