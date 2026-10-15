---
{
    "title": "ロードの概要",
    "language": "ja",
    "description": "リアルタイム書き込み、ストリーミング同期、バッチロード、外部データソース連携の四つのシナリオに応じて、Apache Dorisのデータロード方法を選ぶためのガイドです。",
    "keywords": [
        "Dorisのデータロード",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "INSERT INTO",
        "Group Commit",
        "Flink Doris Connector",
        "Kafka Connector",
        "Flink CDC",
        "Streaming Job",
        "継続的なロード",
        "リアルタイム書き込み",
        "バッチロード",
        "Catalogによる外部データソース連携"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Data load method selection / Data integration solution design -->

Apache Dorisには、さまざまなデータソースからデータベースへ書き込むためのロード方法と連携方法があります。このドキュメントでは、代表的な業務シナリオを出発点として、**リアルタイム書き込み**、**ストリーミング同期**、**バッチロード**、**外部データソース連携**の四つの分類から適切な方法を選ぶための指針を説明します。

## クイックナビゲーション

データソースとデータの鮮度要件に応じて、次の表から推奨されるロード方法を確認できます。

| 業務シナリオ | データソース | 推奨されるロード方法 |
| :--- | :--- | :--- |
| アプリケーションからのリアルタイム書き込み（少量、約5分に一度） | JDBCクライアント | [JDBC INSERT](./import-way/insert-into-manual.md) |
| アプリケーションからの高同時実行・高頻度の小規模バッチ書き込み | JDBC / HTTP | [Group Commit](./load-best-practices/group-commit-manual.md)とJDBC INSERTまたはStream Load |
| アプリケーションからの高スループット書き込み | HTTP | [Stream Load](./import-way/stream-load-manual) |
| リアルタイムデータストリームの取り込み | Flink | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md) |
| リアルタイムメッセージキューの取り込み | Kafka | [Routine Load](./import-way/routine-load-manual.md)または[Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) |
| トランザクションデータベースのリアルタイム同期（外部コンポーネント不要） | MySQL / PostgreSQL | [Streaming Jobによる継続的なロード](./import-way/streaming-job/continuous-load-overview.md) |
| トランザクションデータベースのCDC同期 | MySQL / PostgreSQLなど | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md)または[DataX](../../connection-integration/data-integration/datax.md) |
| オブジェクトストレージからの継続的なロード（増分ファイルの自動ロード） | S3 | [Streaming Jobによる継続的なロード](./import-way/streaming-job/continuous-load-overview.md) |
| オブジェクトストレージ / HDFSのファイルのバッチロード | S3 / OSS / HDFS | [Broker Load](./import-way/broker-load-manual.md)または[INSERT INTO SELECT](./import-way/insert-into-manual.md) |
| ローカルファイルのバッチロード | ローカルディスク | [Stream Load](./import-way/stream-load-manual)または[Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) |
| 外部データソース（データレイク / 外部テーブル）のクエリとロード | Hive / Iceberg / JDBCなど | [Catalog](../../lakehouse/lakehouse-overview.md)と[INSERT INTO SELECT](./import-way/insert-into-manual.md) |

> Dorisでは、各ロードはデフォルトで暗黙的なトランザクションとして実行されます。トランザクションの詳細については、[トランザクション](../transaction.md)を参照してください。

## シナリオ別のロード方法の選び方

### リアルタイム書き込み：アプリケーションからの直接書き込み

<!-- Knowledge type: Operation steps -->

アプリケーションがHTTPまたはJDBCを通じてDorisのテーブルに**リアルタイムでデータを書き込む**シナリオに適しています。リアルタイムの分析やクエリが必要な業務でよく使用されます。

- **少量のデータ（約5分に一度）**：[JDBC INSERT](./import-way/insert-into-manual.md)を使用してデータを書き込みます。
- **高い同時実行数または高頻度（同時実行数が20を超える、または1分間に複数回書き込む場合）**：[Group Commit](./load-best-practices/group-commit-manual.md)を有効にし、JDBC INSERTまたはStream Loadと組み合わせて使用します。
- **高スループットの書き込み**：HTTPプロトコル経由で[Stream Load](./import-way/stream-load-manual)を使用してデータを書き込みます。

### ストリーミング同期：リアルタイムデータストリームの取り込み

<!-- Knowledge type: Architecture selection decision -->

リアルタイムデータストリーム（Flink、Kafka、トランザクションデータベースのCDCなど）を通じて、データをDorisのテーブルへ継続的に同期するシナリオに適しています。

1. **Flinkのリアルタイムデータストリーム**

    [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md)を使用して、FlinkのリアルタイムデータストリームをDorisのテーブルに書き込みます。

2. **Kafkaのリアルタイムデータストリーム**

    [Routine Load](./import-way/routine-load-manual.md)と[Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md)から選択します。違いは次のとおりです。

    | 方法 | データの流れ | 対応フォーマット |
    | :--- | :--- | :--- |
    | Routine Load | DorisがKafkaからデータを能動的に取得 | csv、json |
    | Kafka Connector | KafkaがDorisへデータを能動的にプッシュ | avro、json、csv、protobuf |

3. **トランザクションデータベースのCDC同期**

    [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md)または[DataX](../../connection-integration/data-integration/datax.md)を使用して、トランザクションデータベースのCDCデータストリームをDorisに書き込みます。

4. **Streaming Jobによる継続的なロード（外部コンポーネント不要）**

    Dorisに組み込まれた[Streaming Job](./import-way/streaming-job/continuous-load-overview.md)を使用すると、MySQL、PostgreSQL、S3などのデータソースからデータを継続的に読み取り、**FlinkやKafkaなどの外部コンポーネントに依存せずに**Dorisへ書き込めます。次の二つの同期方法に対応しています。

    | 同期方法 | 内部の仕組み | テーブルの自動作成 | セマンティクスの保証 | 代表的なシナリオ |
    | :--- | :--- | :--- | :--- | :--- |
    | SQL Mapping Sync | Job + TVF（INSERT INTO SELECT） | 事前作成が必要 | exactly-once | 列の絞り込み、フィールド名の変更、型変換、条件によるフィルタリングが必要な場合 |
    | Auto Table Creation Sync | Job + ネイティブなデータベース全体のDDL | 初回実行時に自動作成 | at-least-once | データベース全体またはテーブル群をミラーリングし、同期先のテーブルスキーマを同期元に自動追従させる場合 |

### バッチロード：外部ストレージからのファイルのロード

<!-- Knowledge type: Operation steps -->

外部ストレージシステム（オブジェクトストレージ、HDFS、ローカルファイル、NASなど）にあるファイルをDorisのテーブルへ**バッチでロードする**、リアルタイム性を必要としないシナリオに適しています。

- **オブジェクトストレージ / HDFSのファイル**：[Broker Load](./import-way/broker-load-manual.md)を使用してDorisにデータを書き込みます。
- **オブジェクトストレージ / HDFS / NASのファイル（同期または非同期）**：同期書き込みには[INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用します。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler)によるスケジューリングと組み合わせます。
- **ローカルファイル**：[Stream Load](./import-way/stream-load-manual)または[Doris Streamloader](../../connection-integration/data-integration/doris-streamloader)を使用してDorisにデータを書き込みます。

### 外部データソース連携：Catalogを使用したフェデレーテッドクエリとロード

<!-- Knowledge type: Architecture selection decision -->

外部データソース（Hive、JDBC、Icebergなど）と連携して外部データをクエリし、必要に応じてDorisのテーブルへ**ロードする**シナリオに適しています。

- [Catalog](../../lakehouse/lakehouse-overview.md)を作成して、外部データソースからデータを読み取ります。
- [INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用して、外部データソースのデータをDorisへ同期的に書き込みます。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler)によるスケジューリングと組み合わせます。

## ロード時の部分列更新

<!-- Knowledge type: Configuration parameters -->

Dorisは、データのロード時に**部分列更新**をサポートしています。テーブルのすべての列に値を指定しなくても、特定の列だけを更新できます。この機能は、特に次のシナリオで役立ちます。

- 列数の多いテーブルで少数のフィールドを更新する場合
- 増分更新（部分列に対するUpsert）を実行する場合

Unique KeyテーブルとAggregateテーブルで部分列更新を行う方法については、[列の更新](../update/partial-column-update.md)を参照してください。

## ロード方法の概要

Dorisへのロードには、データソース、データフォーマット、ロード方法、エラーデータの処理、データ変換、トランザクションなど、さまざまな側面があります。次の表は、各方法に適したシナリオ、対応するファイルフォーマット、ロードモードをまとめたものです。

| ロード方法 | 用途 | 対応するファイルフォーマット | ロードモード |
| :--- | :--- | :--- | :--- |
| [Stream Load](./import-way/stream-load-manual) | ローカルファイルのロードまたはアプリケーションからの書き込み | csv、json、parquet、orc | 同期 |
| [Broker Load](./import-way/broker-load-manual.md) | オブジェクトストレージやHDFSなどからのロード | csv、json、parquet、orc | 非同期 |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | JDBCなどのインターフェースを通じたロード | SQL | 同期 |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | 外部テーブル、オブジェクトストレージ、HDFSからのロード | SQL | 同期 |
| [Routine Load](./import-way/routine-load-manual.md) | Kafkaからのリアルタイムロード | csv、json | 非同期 |
| [MySQL Load](./import-way/mysql-load-manual.md) | ローカルデータからのロード | csv | 同期 |
| [Group Commit](./load-best-practices/group-commit-manual.md) | 高頻度の小規模バッチロード | 使用するロード方法による | - |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | MySQL、PostgreSQL、S3などのデータソースからの継続的なロード | データソースによる | 非同期 |

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Q1：同時実行数が多い小規模バッチ書き込みには、どのロード方法を選べばよいですか？**

[Group Commit](./load-best-practices/group-commit-manual.md)を有効にし、JDBC INSERTまたはStream Loadと組み合わせて使用します。同時実行数が20を超える場合や、1分間に複数回書き込む場合、Group Commitによってロードの負荷を大幅に軽減できます。

**Q2：Routine LoadとDoris Kafka Connectorの違いは何ですか？**

- Routine Load：Dorisがタスクをスケジュールし、Kafkaからデータを**能動的に取得**します。csvとjsonのフォーマットに対応しています。
- Doris Kafka Connector：KafkaがDorisへデータを**能動的にプッシュ**します。avro、json、csv、protobufのフォーマットに対応しています。

**Q3：ローカルファイルをDorisにロードするには、どうすればよいですか？**

[Stream Load](./import-way/stream-load-manual)（小規模・中規模のファイルに適しています）または[Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md)（大きなファイルをバッチでロードする場合に適しています）を使用できます。

**Q4：HiveやIcebergなどの外部データソースからDorisにデータをロードできますか？**

はい。まず[Catalog](../../lakehouse/lakehouse-overview.md)を通じて外部データソースに接続し、次に[INSERT INTO SELECT](./import-way/insert-into-manual.md)を使用してデータをDorisへ同期的に書き込みます。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler)によるスケジューリングと組み合わせます。

**Q5：ロードにはトランザクションの保証がありますか？**

はい。Dorisでは、各ロードはデフォルトで暗黙的なトランザクションとして実行されます。詳細については、[トランザクション](../transaction.md)を参照してください。

**Q6：Streaming JobとFlink CDCはどのように使い分ければよいですか？**

- **Streaming Job**：**FlinkやKafkaなどの外部コンポーネントに依存しない**Dorisの組み込み機能です。MySQLとPostgreSQLに対するSQL Mapping SyncとAuto Table Creation Syncに加え、S3からの継続的なロードに対応しています。Auto Table Creation Syncは同期先のテーブルを自動的に作成し、SQL Mapping Syncはexactly-onceセマンティクスを提供し、SQL処理に対応しています。
- **Flink CDC**：Flinkクラスターのデプロイが必要です。すでにFlinkによるストリーム処理基盤がある場合、複雑なETL処理が必要な場合、または複数の同期先が必要な場合に適しています。

MySQLまたはPostgreSQLのデータをDorisへ継続的に同期するだけで、外部のストリーム処理を必要としない場合は、**Streaming Jobを優先してください**。詳細については、[継続的なロードの概要](./import-way/streaming-job/continuous-load-overview.md)を参照してください。
