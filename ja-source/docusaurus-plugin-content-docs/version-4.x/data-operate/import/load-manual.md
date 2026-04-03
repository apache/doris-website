---
{
  "title": "読み込み概要",
  "description": "Apache Dorisは、データのインポートと統合のための様々な方法を提供しており、様々なソースからデータベースにデータをインポートすることができます。",
  "language": "ja"
}
---
Apache Dorisは、データのインポートと統合のための様々な方法を提供しており、様々なソースからデータベースにデータをインポートすることができます。これらの方法は4つのタイプに分類できます：

- **リアルタイム書き込み**: HTTPやJDBCを介してDorisTableにリアルタイムでデータが書き込まれ、即座に分析やクエリが必要なシナリオに適しています。

    - 少量のデータ（5分に1回）の場合、[JDBC INSERT](./import-way/insert-into-manual.md)を使用できます。

    - より高い同時実行数や頻度（20以上の同時書き込みや1分間に複数回の書き込み）の場合、[Group Commit](./group-commit-manual.md)を有効にしてJDBC INSERTまたはStream Loadを使用できます。

    - 高スループットの場合、HTTP経由で[Stream Load](./import-way/stream-load-manual)を使用できます。

- **ストリーミング同期**: リアルタイムデータストリーム（例：Flink、Kafka、トランザクションデータベース）がDorisTableにインポートされ、リアルタイム分析やクエリに最適です。

    - Flink Doris Connectorを使用してFlinkのリアルタイムデータストリームをDorisに書き込むことができます。

    - Kafkaのリアルタイムデータストリームには[Routine Load](./import-way/routine-load-manual.md)またはDoris Kafka Connectorを使用できます。Routine LoadはKafkaからDorisにデータをプルし、CSVとJSON形式をサポートします。一方、Kafka ConnectorはDorisにデータを書き込み、Avro、JSON、CSV、Protobuf形式をサポートします。

    - Flink CDCやDataxを使用してトランザクションデータベースのCDCデータストリームをDorisに書き込むことができます。

- **バッチインポート**: 外部ストレージシステム（例：Object Storage、HDFS、ローカルファイル、NAS）からDorisTableにデータがバッチロードされ、リアルタイムでないデータインポートのニーズに適しています。

    - [Broker Load](./import-way/broker-load-manual.md)を使用してObject StorageやHDFSからのファイルをDorisに書き込むことができます。

    - [INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用してObject Storage、HDFS、NASからのファイルを同期的にDorisにロードでき、JOBを使用して非同期で操作を実行できます。

    - [Stream Load](./import-way/stream-load-manual)またはDoris StreamloaderでローカルファイルをDorisに書き込むことができます。

- **外部データソース統合**: 外部ソース（例：Hive、JDBC、Iceberg）からデータをクエリし、一部をDorisTableにインポートします。

    - [カタログ](../../lakehouse/lakehouse-overview.md)を作成して外部ソースからデータを読み取り、[INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用してこのデータをDorisに同期し、JOBによる非同期実行が可能です。

Dorisの各インポート方法は、デフォルトで暗黙的なトランザクションです。トランザクションに関する詳細については、[Transactions](../transaction.md)を参照してください。

### インポート方法のクイックオーバービュー

Dorisのインポートプロセスは主にデータソース、データ形式、インポート方法、エラーハンドリング、データ変換、トランザクションなどの様々な側面を含みます。以下の表で、各インポート方法に適したシナリオとサポートされるファイル形式を素早く確認できます。

| インポート方法                                      | 使用ケース                                   | サポートするファイル形式 | インポートモード |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | ローカルファイルのインポートまたはHTTP経由でのアプリケーションでのデータプッシュ                             | csv, json, parquet, orc | 同期     |
| [Broker Load](./import-way/broker-load-manual.md)        | オブジェクトストレージ、HDFSなどからのインポート                     | csv, json, parquet, orc | 非同期     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | JDBC経由でのデータ書き込み | SQL                     | 同期     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | カタログ内のtableやObject Storage、HDFS内のファイルなどの外部ソースからのインポート      | SQL                     | 同期、Job経由の非同期     |
| [Routine Load](./import-way/routine-load-manual.md)      | Kafkaからのリアルタイムインポート                            | csv, json               | 非同期     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | ローカルファイルからのインポート                             | csv                     | 同期     |
| [Group Commit](./group-commit-manual.md)          | 高頻度での書き込み                            | 使用するインポート方法に依存 | -     |
