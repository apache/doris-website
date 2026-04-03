---
{
  "title": "AutoMQ Load",
  "language": "ja",
  "description": "AutoMQは、S3のようなオブジェクトストレージにストレージを分離することで実現されたKafkaのクラウドネイティブフォークです。"
}
---
[AutoMQ](https://github.com/AutoMQ/automq)は、S3のようなオブジェクトストレージにストレージを分離することによるKafkaのクラウドネイティブフォークです。Apache Kafka®との100%の互換性を保ちながら、ユーザーに最大10倍のコスト効率と100倍の弾力性を提供します。革新的な共有ストレージアーキテクチャにより、高スループットと低レイテンシを確保しながら、数秒でのパーティション再割り当て、セルフバランシング、自動スケーリングなどの機能を実現します。
![AutoMQ Storage Architecture](/images/automq/automq_storage_architecture.png)

この記事では、Apache Doris Routine Loadを使用してAutoMQからDorisにデータをインポートする方法について説明します。Routine Loadの詳細については、[Routine Load](https://doris.apache.org/docs/data-operate/import/routine-load-manual/)ドキュメントを参照してください。

## 環境準備
### Apache Dorisとテストデータの準備

動作するApache Dorisクラスタがすでにセットアップされていることを確認してください。デモンストレーション目的で、[Quick Started](../gettingStarted/quick-start)ドキュメントに従ってLinux上にテスト用Apache Doris環境をデプロイしました。
データベースとテストテーブルを作成します：

```
create database automq_db;
CREATE TABLE automq_db.users (
                                 id bigint NOT NULL,
                                 name string NOT NULL,
                                 timestamp string NULL,
                                 status string NULL

) DISTRIBUTED BY hash (id) PROPERTIES ('replication_num' = '1');
```
### Kafka Command Line Tools の準備

[AutoMQ Releases](https://github.com/AutoMQ/automq)から最新のTGZパッケージをダウンロードして展開します。展開ディレクトリを$AUTOMQ_HOMEと仮定し、この記事では$AUTOMQ_HOME/bin配下のスクリプトを使用してトピックを作成し、テストデータを生成します。

### AutoMQとテストデータの準備

AutoMQの[公式デプロイメントドキュメント](https://docs.automq.com/docs/automq-opensource/EvqhwAkpriAomHklOUzcUtybn7g)を参照して機能的なクラスターをデプロイし、AutoMQとApache Doris間のネットワーク接続を確保します。
以下の手順に従って、AutoMQでexample_topicという名前のトピックを迅速に作成し、テストJSONデータを書き込みます。

**トピックの作成**

AutoMQのApache Kafka®コマンドラインツールを使用してトピックを作成します。Kafka環境へのアクセスがあり、Kafkaサービスが実行されていることを確認してください。以下はトピックを作成するコマンドの例です：

```
$AUTOMQ_HOME/bin/kafka-topics.sh --create --topic exampleto_topic --bootstrap-server 127.0.0.1:9092  --partitions 1 --replication-factor 1
```
> Tips: コマンドを実行する際は、`topic` と `bootstarp-server` を実際のAutoMQ Bootstrap Serverアドレスに置き換えてください。

トピック作成後、以下のコマンドを使用してトピックが正常に作成されたことを確認できます。

```
$AUTOMQ_HOME/bin/kafka-topics.sh --describe example_topic --bootstrap-server 127.0.0.1:9092
```
**テストデータの生成**

先ほど言及したテーブルに対応する、JSON形式のテストデータエントリを作成します。

```
{
  "id": 1,
  "name": "testuser",
  "timestamp": "2023-11-10T12:00:00",
  "status": "active"
}
```
**テストデータの書き込み**

Kafkaのコマンドラインツールまたはプログラミングアプローチを使用して、`example_topic`という名前のトピックにテストデータを書き込みます。以下は、コマンドラインツールを使用した例です：

```
echo '{"id": 1, "name": "testuser", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | sh kafka-console-producer.sh --broker-list 127.0.0.1:9092 --topic example_topic
```
トピックに書き込まれたデータを表示するには、以下のコマンドを使用します：

```
sh $AUTOMQ_HOME/bin/kafka-console-consumer.sh --bootstrap-server 127.0.0.1:9092 --topic example_topic --from-beginning
```
> Tips: コマンドを実行する際は、`topic` と `bootstarp-server` を実際の AutoMQ Bootstrap Server アドレスに置き換えてください。

## Routine Load インポートジョブの作成

Apache Doris のコマンドラインで、JSON データを受け入れる Routine Load ジョブを作成し、AutoMQ Kafka トピックからデータを継続的にインポートします。Routine Load の詳細なパラメータ情報については、[Doris Routine Load] を参照してください。

```
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
> ヒント: コマンドを実行する際は、kafka_broker_listを実際のAutoMQ Bootstrap Serverアドレスに置き換える必要があります。

## データインポートの確認

まず、Routine Loadインポートジョブのステータスを確認して、タスクが実行されていることを確かめます。

```
show routine load\G;
```
その後、Apache DorisデータベースでAssistant関連するテーブルをクエリすると、データが正常にインポートされたことを確認できます。

```
select * from users;
+------+--------------+---------------------+--------+
| id   | name         | timestamp           | status |
+------+--------------+---------------------+--------+
|    1 | testuser     | 2023-11-10T12:00:00 | active |
|    2 | testuser     | 2023-11-10T12:00:00 | active |
+------+--------------+---------------------+--------+
2 rows in set (0.01 sec)
```
