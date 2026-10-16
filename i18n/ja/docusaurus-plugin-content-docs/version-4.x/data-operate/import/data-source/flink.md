---
{
    "title": "Flink",
    "language": "ja",
    "description": "Flink Doris Connectorを使用して、Flinkのリアルタイムデータ（KafkaやMySQLなど）をDorisに取り込む方法を説明します。テーブルの作成、同期、確認までの手順を含みます。",
    "keywords": [
        "FlinkからDorisへのデータ取り込み",
        "Flink Doris Connector",
        "Flink CDCによるDorisへの同期",
        "FlinkSQLからDorisへの書き込み",
        "Dorisへのリアルタイムデータ取り込み",
        "KafkaとMySQLからDorisへの同期"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

**Flink Doris Connector**を使用すると、Flinkが生成したデータ（FlinkがKafkaやMySQLから読み取ったデータなど）をリアルタイムでDorisに取り込めます。リアルタイムのデータ取り込みやストリーミングETLに適しています。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| リアルタイムのデータ取り込み | KafkaやPulsarなどのメッセージキューからDorisにデータをリアルタイムで書き込む |
| データベースの同期 | Flink CDCを使用して、MySQLやOracleなどのデータベースからDorisにデータを同期する |
| ストリーミングETL | Flinkでリアルタイム処理を行い、結果をDorisに書き込む |

## 制限事項

- デプロイ済みの**Flinkクラスター**が必要です。
- 対応するバージョンの**Flink Doris Connector**をFlinkにデプロイする必要があります。

## 手順

Flinkを使用したデータ取り込みの詳細な手順については、[Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)を参照してください。以下の最小構成の例では、Flinkによるデータ取り込みの手順を示します。

全体の手順は次のとおりです。

1. Dorisにターゲットテーブルを作成する
2. FlinkでFlinkSQLを使用してデータを書き込む
3. Dorisでデータが正常に取り込まれたことを確認する

### ステップ1：Dorisにテーブルを作成する

Flinkからのデータを受け取るターゲットテーブル`students`をDorisに作成します。

```sql
CREATE TABLE `students` (
    `id` INT NULL,
    `name` VARCHAR(256) NULL,
    `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### ステップ2：Flinkでデータを取り込む

`bin/sql-client.sh`を実行してFlinkSQLコンソールを開き、次のステートメントを実行してシンクテーブルを作成し、データを書き込みます。

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```

主なパラメーターは次のとおりです。

| パラメーター | 説明 |
| --- | --- |
| `connector` | `doris`に固定します。Flink Doris Connectorを使用することを示します |
| `fenodes` | Doris FEのHTTPアドレス。形式は`host:http_port`です |
| `table.identifier` | ターゲットテーブルの識別子。形式は`database.table`です |
| `username` | Dorisのログインユーザー名 |
| `password` | Dorisのログインパスワード |
| `sink.label-prefix` | Stream Loadの取り込みタスクに使用するLabelのプレフィックス。グローバルに一意である必要があります |

### ステップ3：取り込んだデータを確認する

Dorisでターゲットテーブルをクエリし、データが正常に取り込まれたことを確認します。

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## よくある質問

**Q1：Flink Doris Connectorはどのデータソースに対応していますか？**

理論上、Flinkが対応するすべてのデータソース（Kafka、MySQL CDC、ファイルシステム、メッセージキューなど）を上流のソースとして使用できます。Flinkでデータを処理してから、Dorisに書き込めます。

**Q2：`sink.label-prefix`を一意にする必要があるのはなぜですか？**

Flink Doris Connectorは、DorisのStream Loadを使用してデータを取り込みます。Exactly-Onceセマンティクスを保証するには、各トランザクションに一意のLabelが必要です。Labelが重複すると、データ取り込み時に競合が発生します。

**Q3：`fenodes`にはどのポートを指定しますか？**

`fenodes`には、Doris FEの**HTTPポート**（デフォルトは`8030`）を指定します。MySQLプロトコルのポート（デフォルトは`9030`）ではありません。

**Q4：MySQLやOracleなどのデータベースからDorisにデータを同期するにはどうすればよいですか？**

Flink CDCと組み合わせて使用できます。詳細については、[Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)のドキュメントを参照してください。

## 関連ドキュメント

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)
