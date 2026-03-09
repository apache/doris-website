---
{
  "title": "Seatunnel Doris Sink",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "SeaTunnelは、大量データのリアルタイム同期をサポートする、非常に使いやすい超高性能分散データ統合プラットフォームです。"
}
---
## SeaTunnelについて

SeaTunnelは非常に使いやすい超高性能分散データ統合プラットフォームで、大量データのリアルタイム同期をサポートしています。毎日数百億のデータを安定的かつ効率的に同期できます。

## Connector-V2

SeaTunnel用のconnector-v2は、バージョン2.3.1以降でDoris Sinkをサポートし、exactly-onceライトとCDCデータ同期をサポートします

### Plugin Code

SeaTunnel Doris Sink [Plugin Code](https://github.com/apache/incubator-seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris)

### Options

|        name        |  type  | required | default value |
|--------------------|--------|----------|---------------|
| fenodes            | string | yes      | -             |
| username           | string | yes      | -             |
| password           | string | yes      | -             |
| table.identifier   | string | yes      | -             |
| sink.label-prefix  | string | yes      | -             |
| sink.enable-2pc    | bool   | no       | true          |
| sink.enable-delete | bool   | no       | false         |
| doris.config       | map    | yes      | -             |

`fenodes [string]`

DorisクラスターのFEノードアドレス、フォーマットは`"fe_ip:fe_http_port, ..."`です

`username [string]`

Dorisユーザーのユーザー名

`password [string]`

Dorisユーザーのパスワード

`table.identifier [string]`

DorisテーブルのName、フォーマットはDBName.TableNameです

`sink.label-prefix [string]`

stream loadインポートで使用されるラベルプレフィックス。2pcシナリオでは、SeaTunnelのEOSセマンティクスを保証するためにグローバルな一意性が必要です。

`sink.enable-2pc [bool]`

2フェーズコミット（2pc）を有効にするかどうか、デフォルトはtrue、Exactly-Onceセマンティクスを保証します。2フェーズコミットについては、[ここ](../data-operate/import/import-way/stream-load-manual)を参照してください。

`sink.enable-delete [bool]`

削除を有効にするかどうか。このオプションはDorisテーブルでバッチ削除機能を有効にする必要があり（0.15+バージョンではデフォルトで有効）、Uniqueモデルのみサポートします。詳細はこちらのリンクで確認できます：

[batch delete](../data-operate/delete/batch-delete-manual.md)

`doris.config [map]`

stream loadの`data_desc`パラメータ、詳細はこちらのリンクで確認できます：

[More Stream Load parameters](../data-operate/import/import-way/stream-load-manual)

### Example

JSON形式を使用してデータをインポートする

```
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format="json"
            read_json_by_line="true"
        }
    }
}

```
CSVフォーマットを使用してデータをインポートする

```
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
        }
    }
}
```
## Connector-V1

### Flink Sink Doris

#### プラグインコード

Seatunnel Flink Sink Doris [plugin code](https://github.com/apache/incubator-seatunnel)

#### オプション

| name | type | required | default value | engine |
| --- | --- | --- | --- | --- |
| fenodes | string | yes | - | Flink |
| database | string | yes | - | Flink  |
| table | string | yes | - | Flink  |
| user	 | string | yes | - | Flink  |
| password	 | string | yes | - | Flink  |
| batch_size	 | int | no |  100 | Flink  |
| interval	 | int | no |1000 | Flink |
| max_retries	 | int | no | 1 | Flink|
| doris.*	 | - | no | - | Flink  |

`fenodes [string]`

Doris Fe http url、例：127.0.0.1:8030

`database [string]`

Dorisデータベース

`table [string]`

Dorisテーブル

`user [string]`

Dorisユーザー

`password [string]`

Dorisパスワード

`batch_size [int]`

一度にDorisに書き込む最大行数、デフォルト値は100

`interval [int]`

フラッシュ間隔（ミリ秒）。この間隔後、非同期スレッドがキャッシュ内のデータをDorisに書き込みます。0に設定すると定期書き込みが無効になります。

`max_retries [int]`

Dorisへの書き込み失敗後のリトライ回数

`doris.* [string]`

Stream loadのインポートパラメータ。例：'doris.column_separator' = ', ' など。

[More Stream Load parameter configuration](../data-operate/import/import-way/stream-load-manual)

#### 例

Socket To Doris

```
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
#### 開始コマンド

```
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```
### Spark Sink Doris

#### プラグインコード

Seatunnel Spark Sink Doris [plugin code](https://github.com/apache/incubator-seatunnel)

#### オプション

| name | type | required | default value | engine |
| --- | --- | --- | --- | --- |
| fenodes | string | yes | - | Spark |
| database | string | yes | - | Spark |
| table	 | string | yes | - | Spark |
| user	 | string | yes | - | Spark |
| password	 | string | yes | - | Spark |
| batch_size	 | int | yes | 100 | Spark |
| doris.*	 | string | no | - | Spark |

`fenodes [string]`

Doris FEアドレス:8030

`database [string]`

Dorisターゲットデータベース名

`table [string]`

Dorisターゲットテーブル名

`user [string]`

Dorisユーザー名

`password [string]`

Dorisユーザーのパスワード

`batch_size [string]`

バッチあたりのDoris送信数

`doris. [string]`
Doris stream_loadプロパティ。'doris.'プレフィックス + stream_loadプロパティを使用できます

[More Doris stream_load Configurations](../data-operate/import/import-way/stream-load-manual)

#### 例

HiveからDorisへ

設定プロパティ

```
env{
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
   fenodes="xxxx:8030"
   database="gl_mint_dim"
   table="dim_date"
   user="root"
   password="root"
   batch_size=1000
   doris.column_separator="\t"
   doris.columns="date_key,date_value,day_in_year,day_in_month"
   }
}
```
#### 開始コマンド

```
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
