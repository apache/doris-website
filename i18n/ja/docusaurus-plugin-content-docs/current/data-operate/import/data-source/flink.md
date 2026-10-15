---
{
    "title": "Flink",
    "language": "ja",
    "description": "Flink Doris Connector を使用して、Flink が扱うリアルタイムデータ（Kafka、MySQL など）を Doris にインポートする方法。テーブルの作成、同期、確認までの手順を説明します。",
    "keywords": [
        "Flink から Doris へのインポート",
        "Flink Doris Connector",
        "Flink CDC による Doris への同期",
        "FlinkSQL から Doris への書き込み",
        "Doris へのリアルタイムデータインポート",
        "Kafka MySQL から Doris への同期"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

**Flink Doris Connector** を使用すると、Flink が生成したデータ（Flink が Kafka や MySQL から読み取ったデータなど）をリアルタイムで Doris にインポートできます。リアルタイムのデータ取り込みやストリーミング ETL に適しています。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| リアルタイムのデータ取り込み | Kafka や Pulsar などのメッセージキューからのデータをリアルタイムで Doris に書き込む |
| データベースの同期 | Flink CDC を使用して、MySQL や Oracle などのデータベースから Doris にデータを同期する |
| ストリーミング ETL | Flink でリアルタイム処理を行い、その結果を Doris に書き込む |

## 制限事項

- デプロイ済みの **Flink クラスター**が必要です。
- 対応するバージョンの **Flink Doris Connector** を Flink にデプロイする必要があります。

## 手順

Flink を使用したデータのインポート手順については、[Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/overview.md) を参照してください。以下の最小構成の例では、Flink を使用してすばやくインポートする方法を示します。

全体の作業は、次の三つのステップです。

1. Doris にインポート先のテーブルを作成する
2. Flink で FlinkSQL を使用してデータを書き込む
3. Doris でデータが正常にインポートされたことを確認する

### ステップ 1: Doris にテーブルを作成する

Flink からのデータを受け取るために、Doris にインポート先の `students` テーブルを作成します。

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

### ステップ 2: Flink でデータをインポートする

`bin/sql-client.sh` を実行して FlinkSQL コンソールを開き、次の文を実行して書き込み先テーブルを作成し、データを書き込みます。

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
| `connector` | `doris` に固定します。Flink Doris Connector を使用することを示します |
| `fenodes` | Doris FE の HTTP アドレス。形式は `host:http_port` です |
| `table.identifier` | インポート先テーブルの識別子。形式は `database.table` です |
| `username` | Doris へのログインユーザー名 |
| `password` | Doris へのログインパスワード |
| `sink.label-prefix` | Stream Load インポートタスクの Label プレフィックス。グローバルに一意である必要があります |

### ステップ 3: インポートしたデータを確認する

Doris でインポート先テーブルをクエリし、データが正常にインポートされたことを確認します。

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## よくある質問

**Q1: Flink Doris Connector で使用できるデータソースは何ですか？**

理論上、Flink がサポートするすべてのデータソース（Kafka、MySQL CDC、ファイルシステム、メッセージキューなど）を上流のデータソースとして使用できます。Flink で処理した後、Doris に書き込めます。

**Q2: `sink.label-prefix` を一意にする必要があるのはなぜですか？**

Flink Doris Connector は、Doris Stream Load を基にインポートを実装しています。Exactly-Once セマンティクスを保証するため、各トランザクションには一意の Label が必要です。Label が重複すると、インポートが競合します。

**Q3: `fenodes` にはどのポートを指定すればよいですか？**

`fenodes` には、Doris FE の **HTTP ポート**（デフォルトは `8030`）を指定します。MySQL プロトコルのポート（デフォルトは `9030`）ではありません。

**Q4: MySQL や Oracle などのデータベースから Doris にデータを同期するにはどうすればよいですか？**

Flink CDC と組み合わせて使用できます。詳しくは、[Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md) のドキュメントを参照してください。

## 関連ドキュメント

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector/overview.md)
