---
{
    "title": "SeaTunnel",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "SeaTunnel Doris Sink を使用して Apache Doris にデータを同期する方法と、Connector-V2、Flink、Spark、Stream Load のパラメータ設定について説明します。",
    "keywords": [
        "SeaTunnel Doris Sink",
        "SeaTunnel から Doris への書き込み",
        "Doris Stream Load",
        "Doris のデータ同期",
        "Connector-V2"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / SeaTunnel writes to Doris -->

SeaTunnel は、使いやすく、非常に高い性能を持つ分散データ統合プラットフォームです。大量のデータのリアルタイム同期に対応し、毎日数百億件のレコードを安定的かつ効率的に同期できます。

このドキュメントは、SeaTunnel から Doris にデータを同期するユーザーを対象としています。ユースケースに応じた Doris Sink の選び方、パラメータの設定方法、使用方法を説明します。

## コネクタの選び方

| ユースケース | 推奨する方法 | 対象バージョンまたはエンジン | 説明 |
| --- | --- | --- | --- |
| Exactly-once の書き込み、または CDC データ同期が必要な場合 | Connector-V2 Doris Sink | SeaTunnel 2.3.1 以降 | Doris Sink、Exactly-once の書き込み、CDC データ同期に対応します。 |
| Flink エンジン経由で Doris にデータを同期する場合 | Connector-V1 Flink Doris Sink | SeaTunnel 2.1.0、Flink エンジン | すでに Flink エンジンで実行している SeaTunnel ジョブに適しています。 |
| Spark エンジン経由で Doris にデータを同期する場合 | Connector-V1 Spark Sink Doris | SeaTunnel 2.1.0、Spark エンジン | すでに Spark エンジンで実行しているジョブに適しています。たとえば、Hive から Doris へのデータ移行に使用できます。 |

## シナリオ 1: Connector-V2 を使用して Doris に書き込む

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Real-time synchronization / exactly-once writes / CDC data synchronization -->

SeaTunnel 2.3.1 の [Apache SeaTunnel Connector-V2](https://seatunnel.apache.org/docs/2.3.1/category/sink-v2) は、Doris Sink、Exactly-once の書き込み、CDC データ同期に対応しています。

プラグインのソースコードについては、[SeaTunnel Doris Sink プラグインのコード](https://github.com/apache/seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris)を参照してください。

### パラメータ設定

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| `fenodes` | string | はい | - | Doris クラスターの FE ノードのアドレス。形式は `fe_ip:fe_http_port,...` です。 |
| `username` | string | はい | - | Doris のユーザー名。 |
| `password` | string | はい | - | Doris ユーザーのパスワード。 |
| `table.identifier` | string | はい | - | Doris のテーブル名。形式は `DBName.TableName` です。 |
| `sink.label-prefix` | string | はい | - | Stream Load で使用するラベルのプレフィックス。2PC を使用する場合、SeaTunnel の EOS セマンティクスを保証するために、このプレフィックスはグローバルに一意である必要があります。 |
| `sink.enable-2pc` | bool | いいえ | `true` | 二段階コミット（2PC）を有効にするかどうか。デフォルトは `true` で、Exactly-once セマンティクスを保証します。二段階コミットについては、[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |
| `sink.enable-delete` | bool | いいえ | `false` | 削除を有効にするかどうか。このオプションを使用するには、Doris テーブルでバッチ削除が有効になっている必要があります。Doris 0.15+ ではこの機能がデフォルトで有効で、Unique テーブルモデルのみがサポートされます。詳細については、[バッチ削除](../../data-operate/delete/batch-delete-manual.md)を参照してください。 |
| `doris.config` | map | はい | - | Stream Load の `data_desc` パラメータ。その他のパラメータについては、[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |

### JSON 形式でデータをインポートする

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format = "json"
            read_json_by_line = "true"
        }
    }
}
```

### CSV 形式でデータをインポートする

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_csv"
        doris.config = {
            format = "csv"
            column_separator = ","
            line_delimiter = "\n"
        }
    }
}
```

## シナリオ 2: Connector-V1 を使用して Doris に書き込む

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: SeaTunnel 2.1.0 / Flink engine / Spark engine -->

Apache SeaTunnel 2.1.0 は Doris コネクタに対応しており、Flink エンジンまたは Spark エンジンを使用して Doris にデータを同期できます。

### Flink エンジンを使用して Doris に書き込む

プラグインのソースコードについては、[SeaTunnel Flink Sink Doris プラグインのコード](https://github.com/apache/seatunnel)を参照してください。

#### パラメータ設定

| パラメータ | 型 | 必須 | デフォルト値 | 対応エンジン | 説明 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | はい | - | Flink | Doris FE の HTTP アドレス。例: `127.0.0.1:8030`。 |
| `database` | string | はい | - | Flink | Doris で書き込み先となるデータベースの名前。 |
| `table` | string | はい | - | Flink | Doris で書き込み先となるテーブルの名前。 |
| `user` | string | はい | - | Flink | Doris へのアクセスに使用するユーザー。 |
| `password` | string | はい | - | Flink | Doris へのアクセスに使用するユーザーのパスワード。 |
| `batch_size` | int | いいえ | `100` | Flink | 単一バッチで Doris に書き込む行数の上限。 |
| `interval` | int | いいえ | `1000` | Flink | フラッシュ間隔（ミリ秒）。この間隔が経過すると、非同期スレッドがバッファ内のデータを Doris に書き込みます。定期的な書き込みを無効にするには `0` を設定します。 |
| `max_retries` | int | いいえ | `1` | Flink | Doris への書き込みが失敗した後の再試行回数。 |
| `doris.*` | string | いいえ | - | Flink | Stream Load のインポートパラメータ。例: `doris.column_separator = ','`。その他のパラメータについては、[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |

#### 例: Socket のデータを Doris に書き込む

```text
env {
    execution.parallelism = 1
}

source {
    SocketStream {
        host = 127.0.0.1
        port = 9999
        result_table_name = "socket"
        field_name = "info"
    }
}

transform {
}

sink {
    DorisSink {
        fenodes = "127.0.0.1:8030"
        user = root
        password = 123456
        database = test
        table = test_tbl
        batch_size = 5
        max_retries = 1
        interval = 5000
    }
}
```

ジョブを開始します。

```shell
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```

### Spark エンジンを使用して Doris に書き込む

プラグインのソースコードについては、[SeaTunnel Spark Sink Doris プラグインのコード](https://github.com/apache/seatunnel)を参照してください。

#### パラメータ設定

| パラメータ | 型 | 必須 | デフォルト値 | 対応エンジン | 説明 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | はい | - | Spark | Doris FE ノードのアドレス。例: `127.0.0.1:8030`。 |
| `database` | string | はい | - | Spark | Doris で書き込み先となるデータベースの名前。 |
| `table` | string | はい | - | Spark | Doris で書き込み先となるテーブルの名前。 |
| `user` | string | はい | - | Spark | Doris へのアクセスに使用するユーザー。 |
| `password` | string | はい | - | Spark | Doris へのアクセスに使用するユーザーのパスワード。 |
| `batch_size` | int | はい | `100` | Spark | Spark が Stream Load 経由で Doris に書き込むときに、バッチごとに送信する行数。 |
| `doris.*` | string | いいえ | - | Spark | Stream Load の HTTP パラメータ。Stream Load のパラメータを使用するには、`doris.` プレフィックスを付けます。例: `doris.column_separator`。その他のパラメータについては、[Stream Load マニュアル](../../data-operate/import/import-way/stream-load-manual.md)を参照してください。 |

#### 例: Hive から Doris にデータを移行する

```text
env {
    spark.app.name = "hive2doris-template"
}

spark {
    spark.sql.catalogImplementation = "hive"
}

source {
    hive {
        preSql = "select * from tmp.test"
        result_table_name = "test"
    }
}

transform {
}

sink {
    Console {
    }

    Doris {
        fenodes = "xxxx:8030"
        database = "tmp"
        table = "test"
        user = "root"
        password = "root"
        batch_size = 1000
        doris.column_separator = "\t"
        doris.columns = "date_key,date_value,day_in_year,day_in_month"
    }
}
```

ジョブを開始します。

```shell
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
