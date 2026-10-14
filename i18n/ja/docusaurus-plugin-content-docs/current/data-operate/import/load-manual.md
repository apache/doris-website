---
{
    "title": "データロードの概要",
    "language": "ja",
    "description": "Apache Doris のデータロード方法の選び方を、リアルタイム書き込み、ストリーミング同期、バッチロード、外部データソース連携の四つのシナリオに分けて説明します。",
    "keywords": [
        "Doris データロード",
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
        "Catalog 外部データソース"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Data load method selection / Data integration solution design -->

Apache Doris は、さまざまなソースからデータベースにデータを書き込むための複数のロード方法と連携方法を提供します。このドキュメントでは、一般的な業務シナリオを起点に、**リアルタイム書き込み**、**ストリーミング同期**、**バッチロード**、**外部データソース連携**の四つのカテゴリから適切な方法を選ぶ方法を説明します。

## クイックナビゲーション

データソースと即時性の要件に応じて、次の表から推奨されるロード方法を確認できます。

| 業務シナリオ | データソース | 推奨されるロード方法 |
| :--- | :--- | :--- |
| アプリケーションからのリアルタイム書き込み（ごく少量、5 分ごと） | JDBC クライアント | [JDBC INSERT](./import-way/insert-into-manual.md) |
| アプリケーションからの高同時実行または高頻度の少量バッチ書き込み | JDBC / HTTP | [Group Commit](./load-best-practices/group-commit-manual.md) + JDBC INSERT または Stream Load |
| アプリケーションからの高スループット書き込み | HTTP | [Stream Load](./import-way/stream-load-manual) |
| リアルタイムのデータストリームの取り込み | Flink | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/write.md) |
| リアルタイムのメッセージキューの取り込み | Kafka | [Routine Load](./import-way/routine-load-manual.md) または [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) |
| トランザクションデータベースのリアルタイム同期（外部コンポーネントなし） | MySQL / PostgreSQL | [Streaming Job による継続的なロード](./import-way/streaming-job/continuous-load-overview.md) |
| トランザクションデータベースの CDC 同期 | MySQL / PostgreSQL など | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) または [DataX](../../connection-integration/data-integration/datax.md) |
| オブジェクトストレージからの継続的なロード（増分ファイルの自動ロード） | S3 | [Streaming Job による継続的なロード](./import-way/streaming-job/continuous-load-overview.md) |
| オブジェクトストレージ / HDFS のファイルのバッチロード | S3 / OSS / HDFS | [Broker Load](./import-way/broker-load-manual.md) または [INSERT INTO SELECT](./import-way/insert-into-manual.md) |
| ローカルファイルのバッチロード | ローカルディスク | [Stream Load](./import-way/stream-load-manual) または [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) |
| 外部データソース（データレイク / 外部テーブル）のクエリとロード | Hive / Iceberg / JDBC など | [Catalog](../../lakehouse/lakehouse-overview.md) + [INSERT INTO SELECT](./import-way/insert-into-manual.md) |

> Doris の各ロードは、デフォルトで暗黙的なトランザクションとして実行されます。トランザクションの詳細については、[トランザクション](../transaction.md)を参照してください。

## シナリオ別のロード方法の選び方

### リアルタイム書き込み: アプリケーションからの直接書き込み

<!-- Knowledge type: Operation steps -->

アプリケーションが HTTP または JDBC を使って Doris テーブルに**リアルタイムでデータを書き込む**シナリオに適しています。リアルタイムの分析やクエリが必要な業務で一般的に使用されます。

- **ごく少量のデータ（約 5 分ごと）**: [JDBC INSERT](./import-way/insert-into-manual.md) を使ってデータを書き込みます。
- **高い同時実行数または高頻度（同時実行数が 20 を超える、または 1 分以内に複数回書き込む）**: [Group Commit](./load-best-practices/group-commit-manual.md) を有効にし、JDBC INSERT または Stream Load と組み合わせて使用します。
- **高スループットの書き込み**: [Stream Load](./import-way/stream-load-manual) を使い、HTTP プロトコルでデータを書き込みます。

### ストリーミング同期: リアルタイムのデータストリームの取り込み

<!-- Knowledge type: Architecture selection decision -->

リアルタイムのデータストリーム（Flink、Kafka、トランザクションデータベースの CDC など）を通じて、Doris テーブルへデータを継続的に同期するシナリオに適しています。

1. **Flink のリアルタイムデータストリーム**

    [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/write.md) を使って、Flink のリアルタイムデータストリームを Doris テーブルに書き込みます。

2. **Kafka のリアルタイムデータストリーム**

    [Routine Load](./import-way/routine-load-manual.md) と [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) のいずれかを選びます。違いは次のとおりです。

    | 方法 | データフローの方向 | 対応フォーマット |
    | :--- | :--- | :--- |
    | Routine Load | Doris が Kafka からデータを能動的に取得 | csv、json |
    | Kafka Connector | Kafka が Doris にデータを能動的に送信 | avro、json、csv、protobuf |

3. **トランザクションデータベースの CDC 同期**

    [Flink CDC](../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) または [DataX](../../connection-integration/data-integration/datax.md) を使って、トランザクションデータベースからの CDC データストリームを Doris に書き込みます。

4. **Streaming Job による継続的なロード（外部コンポーネントなし）**

    Doris に組み込まれた [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) を使うと、MySQL、PostgreSQL、S3 などのソースからデータを継続的に読み取り、**Flink や Kafka などの外部コンポーネントに依存せずに** Doris に書き込めます。次の二つの同期方法に対応しています。

    | 同期方法 | 基盤となる仕組み | テーブルの自動作成 | セマンティクスの保証 | 代表的なシナリオ |
    | :--- | :--- | :--- | :--- | :--- |
    | SQL Mapping Sync | Job + TVF (INSERT INTO SELECT) | 事前作成が必要 | exactly-once | 列の選択、フィールド名の変更、型変換、条件によるフィルタリングが必要な場合 |
    | Auto Table Creation Sync | Job + ネイティブのデータベース全体に対する DDL | 初回実行時に自動作成 | at-least-once | データベース全体またはテーブル群をミラーリングし、下流テーブルのスキーマを上流に自動追従させる場合 |

### バッチロード: 外部ストレージからのファイルのロード

<!-- Knowledge type: Operation steps -->

外部ストレージシステム（オブジェクトストレージ、HDFS、ローカルファイル、NAS など）にあるファイルを Doris テーブルに**バッチでロードする**、リアルタイム性を必要としないシナリオに適しています。

- **オブジェクトストレージ / HDFS のファイル**: [Broker Load](./import-way/broker-load-manual.md) を使って Doris にデータを書き込みます。
- **オブジェクトストレージ / HDFS / NAS のファイル（同期または非同期）**: 同期書き込みには [INSERT INTO SELECT](./import-way/insert-into-manual.md) を使います。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler) のスケジューリングと組み合わせます。
- **ローカルファイル**: [Stream Load](./import-way/stream-load-manual) または [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader) を使って Doris にデータを書き込みます。

### 外部データソース連携: Catalog を使ったフェデレーションクエリとロード

<!-- Knowledge type: Architecture selection decision -->

外部データソース（Hive、JDBC、Iceberg など）と連携し、外部データにクエリを実行して、**必要に応じて** Doris テーブルにロードするシナリオに適しています。

- [Catalog](../../lakehouse/lakehouse-overview.md) を作成し、外部データソースからデータを読み取ります。
- [INSERT INTO SELECT](./import-way/insert-into-manual.md) を使って、外部データソースから Doris にデータを同期的に書き込みます。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler) のスケジューリングと組み合わせます。

## ロード時の列の部分更新

<!-- Knowledge type: Configuration parameters -->

Doris はデータロード時の**列の部分更新**に対応しています。テーブルのすべての列に値を指定せず、特定の列だけを更新できます。この機能は、特に次のシナリオで役立ちます。

- 列数の多いテーブルで少数のフィールドを更新する
- 増分更新を行う（一部の列を対象とする Upsert）

Unique Key テーブルと Aggregate テーブルで列の部分更新を行う方法については、[列の更新](../update/partial-column-update.md)を参照してください。

## ロード方法の概要

Doris へのロードには、データソース、データフォーマット、ロード方法、エラーデータの処理、データ変換、トランザクションなど、さまざまな側面があります。次の表は、各方法に適したシナリオ、対応するファイルフォーマット、ロードモードをまとめたものです。

| ロード方法 | ユースケース | 対応するファイルフォーマット | ロードモード |
| :--- | :--- | :--- | :--- |
| [Stream Load](./import-way/stream-load-manual) | ローカルファイルのロード、またはアプリケーションからの書き込み | csv、json、parquet、orc | 同期 |
| [Broker Load](./import-way/broker-load-manual.md) | オブジェクトストレージ、HDFS などからのロード | csv、json、parquet、orc | 非同期 |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | JDBC などのインターフェースを介したロード | SQL | 同期 |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | 外部テーブル、オブジェクトストレージ、HDFS からのロード | SQL | 同期 |
| [Routine Load](./import-way/routine-load-manual.md) | Kafka からのリアルタイムロード | csv、json | 非同期 |
| [MySQL Load](./import-way/mysql-load-manual.md) | ローカルデータからのロード | csv | 同期 |
| [Group Commit](./load-best-practices/group-commit-manual.md) | 高頻度の少量バッチロード | 使用するロード方法による | - |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | MySQL、PostgreSQL、S3 などからの継続的なロード | データソースによる | 非同期 |

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Q1: 同時実行数が多く、少量のデータをバッチで書き込む場合は、どのロード方法を選べばよいですか？**

[Group Commit](./load-best-practices/group-commit-manual.md) を有効にし、JDBC INSERT または Stream Load と組み合わせて使用します。同時実行数が 20 を超える場合、または 1 分以内に複数回書き込む場合、Group Commit によってロードの負荷を大幅に軽減できます。

**Q2: Routine Load と Doris Kafka Connector の違いは何ですか？**

- Routine Load: Doris がタスクをスケジュールし、Kafka からデータを**能動的に取得**します。csv と json フォーマットに対応しています。
- Doris Kafka Connector: Kafka が Doris にデータを**能動的に送信**します。avro、json、csv、protobuf フォーマットに対応しています。

**Q3: ローカルファイルを Doris にロードするにはどうすればよいですか？**

[Stream Load](./import-way/stream-load-manual)（小規模から中規模のファイルに適しています）または [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md)（大きなファイルをバッチでロードする場合に適しています）を使用できます。

**Q4: Hive や Iceberg などの外部データソースから Doris にデータをロードできますか？**

はい。まず [Catalog](../../lakehouse/lakehouse-overview.md) を使って外部データソースに接続し、次に [INSERT INTO SELECT](./import-way/insert-into-manual.md) を使って Doris にデータを同期的に書き込みます。非同期で実行する場合は、[JOB](../../admin-manual/workload-management/job-scheduler) のスケジューリングと組み合わせます。

**Q5: ロードにトランザクション保証はありますか？**

はい。Doris の各ロードは、デフォルトで暗黙的なトランザクションとして実行されます。詳しくは、[トランザクション](../transaction.md)を参照してください。

**Q6: Streaming Job と Flink CDC はどう選べばよいですか？**

- **Streaming Job**: Doris に組み込まれた機能で、**Flink や Kafka などの外部コンポーネントに依存しません**。MySQL と PostgreSQL に対する SQL Mapping Sync と Auto Table Creation Sync、および S3 からの継続的なロードに対応しています。Auto Table Creation Sync は下流テーブルを自動作成し、SQL Mapping Sync は exactly-once セマンティクスを提供して SQL 処理に対応します。
- **Flink CDC**: Flink クラスターのデプロイが必要です。すでに Flink のストリーム処理システムを利用している場合、複雑な ETL 処理が必要な場合、または複数のターゲットへの同期が必要な場合に適しています。

MySQL または PostgreSQL のデータを Doris に継続的に同期するだけで、外部のストリーム処理は必要ない場合は、**Streaming Job を優先してください**。詳しくは、[継続的なロードの概要](./import-way/streaming-job/continuous-load-overview.md)を参照してください。
