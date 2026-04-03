---
{
  "title": "読み込み概要",
  "language": "ja",
  "description": "Apache Dorisは、データのインポートと統合のための様々な方法を提供し、様々なソースからデータベースにデータをインポートすることを可能にします。"
}
---
Apache Dorisは、データベースに様々なソースからデータをインポートできる、データのインポートと統合のための様々な方法を提供しています。これらの方法は4つのタイプに分類できます：

- **リアルタイム書き込み**: HTTPまたはJDBC経由でDorisテーブルにリアルタイムでデータが書き込まれ、即座の分析とクエリが必要なシナリオに適しています。

    - 少量のデータ（5分に1回）の場合、[JDBC INSERT](./import-way/insert-into-manual.md)を使用できます。

    - より高い同時実行性や頻度（20以上の同時書き込みまたは1分間に複数回の書き込み）の場合、[Group Commit](./group-commit-manual.md)を有効にして、JDBC INSERTまたはStream Loadを使用できます。

    - 高スループットの場合、HTTP経由で[Stream Load](./import-way/stream-load-manual)を使用できます。

- **ストリーミング同期**: リアルタイムデータストリーム（例：Flink、Kafka、トランザクショナルデータベース）がDorisテーブルにインポートされ、リアルタイム分析とクエリに最適です。

    - [Flink Doris Connector](../../ecosystem/flink-doris-connector.md)を使用して、FlinkのリアルタイムデータストリームをDorisに書き込むことができます。

    - Kafkaのリアルタイムデータストリームには、[Routine Load](./import-way/routine-load-manual.md)または[Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md)を使用できます。Routine LoadはKafkaからDorisにデータをプルし、CSVとJSON形式をサポートします。一方、Kafka ConnectorはDorisにデータを書き込み、Avro、JSON、CSV、Protobuf形式をサポートします。

    - [Flink CDC](../../ecosystem/flink-doris-connector.md)または[Datax](../../ecosystem/datax.md)を使用して、トランザクショナルデータベースのCDCデータストリームをDorisに書き込むことができます。

- **バッチインポート**: 外部ストレージシステム（例：Object Storage、HDFS、ローカルファイル、NAS）からDorisテーブルにデータがバッチロードされ、非リアルタイムデータインポートのニーズに適しています。

    - [Broker Load](./import-way/broker-load-manual.md)を使用して、Object StorageとHDFSからのファイルをDorisに書き込むことができます。

    - [INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用して、Object Storage、HDFS、NASからのファイルをDorisに同期的にロードでき、[JOB](../../admin-manual/workload-management/job-scheduler)を使用して非同期的に操作を実行できます。

    - [Stream Load](./import-way/stream-load-manual)または[Doris Streamloader](../../ecosystem/doris-streamloader.md)を使用して、ローカルファイルをDorisに書き込むことができます。

- **外部データソース統合**: 外部ソース（例：Hive、JDBC、Iceberg）からデータをクエリし、部分的にDorisテーブルにインポートします。

    - [カタログ](../../lakehouse/lakehouse-overview.md)を作成して外部ソースからデータを読み取り、[INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用してこのデータをDorisに同期し、[JOB](../../admin-manual/workload-management/job-scheduler)経由で非同期実行できます。

Dorisの各インポート方法は、デフォルトで暗黙的なトランザクションです。トランザクションの詳細については、[Transactions](../transaction.md)を参照してください。

### インポート時の部分列更新

Dorisは、データインポート時の部分列更新をサポートしており、すべての列の値を提供することなく、テーブル内の特定の列のみを更新できます。これは、ワイドテーブルの更新や増分更新を実行する際に特に有用です。Unique Key ModelおよびAggregate Key Modelテーブルの部分列更新の実行方法に関する詳細については、[Partial Column アップデート](../update/partial-column-update.md)を参照してください。

### インポート方法のクイック概要

Dorisのインポートプロセスは主に、データソース、データ形式、インポート方法、エラー処理、データ変換、トランザクションなどの様々な側面を含みます。下記の表で、各インポート方法に適したシナリオとサポートされているファイル形式を素早く確認できます。

| インポート方法                                      | 使用ケース                                   | サポートされるファイル形式 | インポートモード |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | ローカルファイルのインポートまたはHTTP経由でのアプリケーションでのデータプッシュ。                             | csv, json, parquet, orc | 同期     |
| [Broker Load](./import-way/broker-load-manual.md)        | オブジェクトストレージ、HDFSなどからのインポート。                     | csv, json, parquet, orc | 非同期     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | JDBC経由でのデータ書き込み。 | SQL                     | 同期     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | カタログ内のテーブルやObject Storage、HDFSのファイルなどの外部ソースからのインポート。      | SQL                     | 同期、Job経由での非同期     |
| [Routine Load](./import-way/routine-load-manual.md)      | Kafkaからのリアルタイムインポート                            | csv, json               | 非同期     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | ローカルファイルからのインポート。                             | csv                     | 同期     |
| [Group Commit](./group-commit-manual.md)          | 高頻度での書き込み。                            | 使用されるインポート方法に依存 | -     |
