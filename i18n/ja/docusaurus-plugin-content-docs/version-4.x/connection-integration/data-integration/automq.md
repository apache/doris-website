---
{
    "title": "AutoMQ",
    "language": "ja",
    "description": "Apache Doris の Routine Load を使用して、Kafka と互換性のある AutoMQ のトピックから JSON データを消費し、リアルタイムでデータを取り込みます。"
}
---

[AutoMQ](https://github.com/AutoMQ/automq) は、クラウド向けに再設計されたクラウドネイティブの Kafka です。ストレージをオブジェクトストレージに移すことで、Apache Kafka との 100% の互換性を維持しながら、最大 10 倍のコスト優位性と 100 倍の伸縮性を実現します。革新的な共有ストレージアーキテクチャにより、高スループットと低レイテンシーを維持しながら、秒単位のパーティション移行、トラフィックの自動分散、秒単位の自動スケーリングを実現します。

このドキュメントでは、Apache Doris の Routine Load を使用して、Kafka と互換性のある AutoMQ のトピックから JSON データを消費し、Doris テーブルへ継続的に取り込む方法を説明します。

![AutoMQ のストレージアーキテクチャ](/images/next/connection-integration/data-integration/automq-arch.jpg)

## ユースケース

ビジネスデータがすでに AutoMQ に書き込まれており、そのリアルタイムデータを Apache Doris で継続的に分析したい場合は、Routine Load を使用して AutoMQ のトピックからデータを消費できます。このドキュメントでは、JSON 形式のトピックと Doris のテストテーブルを使用し、データの準備から取り込み結果の確認までの一連の手順を示します。

全体の手順は次のとおりです。

1. Apache Doris のテスト用データベースとテストテーブルを準備します。
2. AutoMQ クラスター、Kafka のコマンドラインツール、テスト用トピックを準備します。
3. AutoMQ のトピックに JSON 形式のテストデータを書き込みます。
4. Doris で Routine Load の取り込みジョブを作成します。
5. Doris テーブルをクエリし、データが正常に取り込まれたことを確認します。

## 前提条件

開始する前に、次の環境が整っていることを確認してください。

| 項目 | 説明 |
| --- | --- |
| Apache Doris クラスター | Apache Doris クラスターが利用可能であることを確認してください。このドキュメントでは、デモ用のテスト環境を Linux 上にデプロイする方法として、[クイックスタート](../../getting-started/quick-start)を参照します。 |
| AutoMQ クラスター | AutoMQ の[公式デプロイドキュメント](https://docs.automq.com/automq/deployment/deploy-multi-nodes-cluster-on-linux)を参照して利用可能なクラスターをデプロイし、AutoMQ と Apache Doris の間でネットワーク接続が確立されていることを確認してください。 |
| Kafka のコマンドラインツール | [AutoMQ Releases](https://github.com/AutoMQ/automq/releases) から最新の TGZ パッケージをダウンロードして展開します。このドキュメントでは、展開先ディレクトリを `$AUTOMQ_HOME` とし、`$AUTOMQ_HOME/bin` 以下のツールを使用してトピックの作成とテストデータの生成を行います。 |

## Doris のテストテーブルを準備する

Doris にデータベースとテストテーブルを作成します。以降の例は、デフォルトで `automq_db` 内で実行します。

```sql
CREATE DATABASE automq_db;
USE automq_db;

CREATE TABLE automq_db.users (
    id BIGINT NOT NULL,
    name STRING NOT NULL,
    timestamp STRING NULL,
    status STRING NULL
) DISTRIBUTED BY HASH(id) PROPERTIES ("replication_num" = "1");
```

## AutoMQ のトピックとテストデータを準備する

このドキュメントでは、次のサンプルパラメータを使用します。コマンドを実行するときは、サンプルのアドレスを実際の AutoMQ Bootstrap Server のアドレスに置き換えてください。

| パラメータ | サンプル値 | 説明 |
| --- | --- | --- |
| AutoMQ Bootstrap Server | `127.0.0.1:9092` | AutoMQ クラスターへの接続アドレス。 |
| トピック | `example_topic` | JSON 形式のテストデータを保存するトピック。 |
| AutoMQ の展開先ディレクトリ | `$AUTOMQ_HOME` | AutoMQ の TGZ パッケージを展開したディレクトリ。 |

### トピックを作成する

Apache Kafka のコマンドラインツールを使用して `example_topic` を作成します。

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --create \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092 \
    --partitions 1 \
    --replication-factor 1
```

作成後、次のコマンドでトピックが正常に作成されたことを確認します。

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --describe \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092
```

### テストデータを準備する

テストデータには JSON 形式を使用します。フィールドは、Doris テーブルおよび後述する Routine Load の `jsonpaths` に対応している必要があります。

```json
{
    "id": 1,
    "name": "Test User",
    "timestamp": "2023-11-10T12:00:00",
    "status": "active"
}
```

### テストデータを書き込む

Kafka のコマンドラインツールまたはプログラムを使用して、テストデータを `example_topic` に書き込みます。次の例では、コマンドラインツールを使用します。

```shell
echo '{"id": 1, "name": "Test User", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | $AUTOMQ_HOME/bin/kafka-console-producer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic
```

次のコマンドで、書き込んだトピックのデータを確認します。

```shell
$AUTOMQ_HOME/bin/kafka-console-consumer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic \
    --from-beginning
```

## Routine Load の取り込みジョブを作成する

Apache Doris のコマンドラインで Routine Load ジョブを作成し、AutoMQ のトピックから JSON データを継続的に消費します。Routine Load のパラメータの詳細については、[Doris Routine Load](../../data-operate/import/import-way/routine-load-manual)を参照してください。

```sql
CREATE ROUTINE LOAD automq_example_load ON users
COLUMNS(id, name, timestamp, status)
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\",\"$.name\",\"$.timestamp\",\"$.status\"]"
)
FROM KAFKA
(
    "kafka_broker_list" = "127.0.0.1:9092",
    "kafka_topic" = "example_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

主な設定は次のとおりです。

| 設定 | サンプル値 | 説明 |
| --- | --- | --- |
| `format` | `json` | 取り込むデータの形式に JSON を指定します。 |
| `jsonpaths` | `["$.id","$.name","$.timestamp","$.status"]` | JSON フィールドと Doris テーブルのフィールドとの対応を指定します。 |
| `kafka_broker_list` | `127.0.0.1:9092` | AutoMQ Bootstrap Server のアドレス。実行時に実際のアドレスに置き換えてください。 |
| `kafka_topic` | `example_topic` | Routine Load がデータを消費する AutoMQ のトピック。 |
| `property.kafka_default_offsets` | `OFFSET_BEGINNING` | トピックの先頭からデータを消費します。 |

## データの取り込みを確認する

まず、Routine Load の取り込みジョブのステータスを確認し、ジョブが実行中であることを確かめます。

```sql
SHOW ROUTINE LOAD\G;
```

次に Doris テーブルをクエリし、テストデータが取り込まれたことを確認します。

```sql
SELECT * FROM users;
```

```text
+------+-----------+---------------------+--------+
| id   | name      | timestamp           | status |
+------+-----------+---------------------+--------+
|    1 | Test User | 2023-11-10T12:00:00 | active |
+------+-----------+---------------------+--------+
1 row in set (0.01 sec)
```

## 注意事項

- サンプルコマンドを実行するときは、`127.0.0.1:9092` を実際の AutoMQ Bootstrap Server のアドレスに置き換えてください。
- テスト用 JSON データのフィールドは、Doris テーブルのフィールドと Routine Load の `jsonpaths` 設定に一致させる必要があります。
- Routine Load ジョブを作成する前に、Doris から AutoMQ クラスターにアクセスできることを確認してください。
