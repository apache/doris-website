---
{
    "title": "DataX Doriswriter",
    "language": "ja",
    "description": "DataX Doriswriter を使用し、MySQL、Oracle、SQL Server などのデータソースから Stream Load 経由で Apache Doris にデータを同期する方法を説明します。パラメータ設定とインポート例も示します。",
    "keywords": [
        "DataX Doriswriter",
        "DataX から Doris へのインポート",
        "Stream Load",
        "MySQL から Doris への同期"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / Offline batch synchronization -->

[DataX](https://github.com/alibaba/DataX) の Doriswriter プラグインは、MySQL、Oracle、SQL Server などのさまざまなデータソースから、Stream Load を介して Doris にデータを同期します。

オフラインのデータ同期にすでに DataX を使用している場合や、DataX がサポートするデータソースから Doris にデータを書き込む必要がある場合は、Doriswriter を DataX の Writer プラグインとして使用できます。このドキュメントでは、実際の設定手順に沿って、プラグインの入手、パラメータの設定、ジョブの実行方法を説明し、JSON および CSV 形式でインポートする際の注意点を示します。

DataX Doriswriter を使用する主な手順は次のとおりです。

1. DataX のインストールパッケージを入手するか、Doriswriter プラグインを自分でコンパイルします。
2. Doriswriter が Doris に書き込むために必要な接続、バッチ、Stream Load の各パラメータを設定します。
3. DataX のジョブスクリプトを作成し、同期ジョブを実行します。
4. 区切り文字の衝突を避けるため、データ形式に応じて `loadProps` を調整します。

## 事前確認

| 項目 | 説明 |
| --- | --- |
| DataX サービス | Doriswriter は DataX サービスと併用する必要があります。 |
| データソースのサポート | DataX は多くのデータソースをサポートしています。対応一覧は [DataX がサポートするデータチャネル](https://github.com/alibaba/DataX#support-data-channels) を参照してください。 |
| Doris のインポート先 | Doriswriter は Stream Load を介して Doris に書き込みます。`loadUrl` には FE ノードの `http_port` を指定する必要があります。 |

## DataX と Doriswriter の入手

### DataX インストールパッケージを直接ダウンロードする

DataX にはそのまま使用できるインストールパッケージが用意されています。ダウンロードリンクは [DataX インストールパッケージのダウンロード](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80) を参照してください。

### Doriswriter プラグインを自分でコンパイルする

Doriswriter プラグインを自分でコンパイルするには、まず [Doriswriter プラグインのソースコード](https://github.com/apache/doris/tree/master/extension/DataX) をダウンロードします。

1. `init-env.sh` を実行します。
2. `doriswriter` プラグインを個別にコンパイルします。

    ```shell
    mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests
    ```

DataX プロジェクト全体のコンパイル方法は、[DataX クイックスタート](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start) を参照してください。

#### `datax-all` の依存関係エラーへの対処

コンパイル中に次のエラーが表示された場合：

```text
Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
```

次の手順で対処します。

1. [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz) をダウンロードします。
2. 展開して得られた `alibaba/datax/` ディレクトリを、ローカルの Maven が使用する `.m2/repository/com/alibaba/` ディレクトリにコピーし、再度コンパイルします。

## Doriswriter のパラメータ設定

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: DataX job configuration -->

Doriswriter のパラメータでは、Doris への接続、書き込み先のデータベースとテーブル、バッチサイズ、失敗時の再試行、Stream Load リクエストのプロパティを設定します。

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbcUrl` | はい | なし | `preSql` または `postSql` の実行に使用する Doris の JDBC 接続文字列です。 |
| `loadUrl` | はい | なし | Stream Load の送信先です。形式は `ip:port` で、`ip` は FE ノードの IP アドレス、`port` は FE ノードの `http_port` です。カンマ（`,`）で区切って複数のアドレスを指定できます。doriswriter はそれらにラウンドロビン方式でアクセスします。 |
| `username` | はい | なし | Doris データベースへのアクセスに使用するユーザー名です。 |
| `password` | いいえ | 空文字列 | Doris データベースへのアクセスに使用するパスワードです。 |
| `connection.selectedDatabase` | はい | なし | 書き込み先の Doris データベース名です。 |
| `connection.table` | はい | なし | 書き込み先の Doris テーブル名です。 |
| `flushInterval` | いいえ | `30000` ms | データ書き込みバッチ間の時間間隔です。小さすぎる値を設定すると Doris への書き込みがブロックされ、エラーコード `-235` が返されることがあります。また、`maxBatchRows` と `batchSize` に大きな値を設定していても、行数やデータ量のしきい値に達する前にインポートが開始されることがあります。 |
| `column` | はい | なし | 書き込み先テーブルの対象カラムです。指定した名前が、生成される JSON データのフィールド名として使用されます。たとえば `"column": ["id", "name", "age"]` のように、フィールドをカンマで区切って指定します。 |
| `preSql` | いいえ | なし | 書き込み先テーブルへのデータ書き込み前に実行する標準 SQL 文です。 |
| `postSql` | いいえ | なし | 書き込み先テーブルへのデータ書き込み後に実行する標準 SQL 文です。 |
| `maxBatchRows` | いいえ | `500000` | インポートバッチあたりの最大行数です。`batchSize` とともに各バッチのサイズを制御し、どちらかのしきい値に達した時点でインポートが開始されます。 |
| `batchSize` | いいえ | `94371840` | インポートバッチあたりの最大データ量です。`maxBatchRows` とともに各バッチのサイズを制御し、どちらかのしきい値に達した時点でインポートが開始されます。 |
| `maxRetries` | いいえ | `3` | バッチのインポートが失敗した後の再試行回数です。 |
| `labelPrefix` | いいえ | `datax_doris_writer_` | 各インポートジョブのラベルの接頭辞です。最終的なラベルは `labelPrefix + UUID` となり、グローバルな一意性を確保して重複インポートを防ぎます。 |
| `loadProps` | いいえ | なし | Stream Load リクエストのパラメータです。インポートするデータ形式、区切り文字、その他のプロパティを設定できます。デフォルトの形式は CSV で、JSON もサポートされています。その他のパラメータは [Stream Load のドキュメント](../../data-operate/import/import-way/stream-load-manual.md) を参照してください。 |

## 使用例

### シナリオ 1：Stream からデータを読み取り、Doris にインポートする

プラグインを使用して Stream からデータを読み取り、Doris にインポートする方法は、[Doriswriter の公式サンプル](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md) を参照してください。

### シナリオ 2：MySQL からデータを読み取り、Doris にインポートする

次の例では、DataX で MySQL からデータを読み取り、Doriswriter を介して Doris に書き込む方法を示します。

#### 1. MySQL のソーステーブルを準備する

```sql
CREATE TABLE `t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT '',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```

#### 2. Doris の書き込み先テーブルを準備する

```sql
CREATE TABLE `ods_t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT ''
) ENGINE=OLAP
UNIQUE KEY(`id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "in_memory" = "false",
    "storage_format" = "V2"
);
```

#### 3. DataX のジョブスクリプトを作成する

`my_import.json` を作成します。実際に使用する際は、`reader` 内のソースデータベースとテーブル、および `writer` 内の Doris の書き込み先データベースとテーブル、ユーザー名、パスワードを、使用環境に合った値に置き換えてください。

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "connection": [
                            {
                                "jdbcUrl": ["jdbc:mysql://localhost:3306/demo"],
                                "table": ["employees_1"]
                            }
                        ],
                        "username": "root",
                        "password": "xxxxx",
                        "where": ""
                    }
                },
                "writer": {
                    "name": "doriswriter",
                    "parameter": {
                        "loadUrl": ["127.0.0.1:8030"],
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval": 30000,
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                                "selectedDatabase": "demo",
                                "table": ["all_employees_info"]
                            }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array": "true",
                            "line_delimiter": "\\x02"
                        }
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "1"
            }
        }
    }
}
```

#### 4. インポートするデータ形式を設定する

上記の例では、JSON 形式でデータをインポートします。

```json
"loadProps": {
    "format": "json",
    "strip_outer_array": "true",
    "line_delimiter": "\\x02"
}
```

JSON 形式を使用する際の注意点は次のとおりです。

1. `line_delimiter` のデフォルトは改行文字で、データ内の値と衝突することがあります。インポートエラーを避けるため、特殊文字や不可視文字を使用してください。
2. `strip_outer_array` は、インポートする単一バッチのデータに複数行が含まれることを示します。解析時に、Doris は外側の配列を展開し、その中の各 Object を個別の行として解析します。
3. Stream Load のその他のパラメータについては、[Stream Load のドキュメント](../../data-operate/import/import-way/stream-load-manual.md) を参照してください。

CSV 形式を使用する場合は、次のように設定します。

```json
"loadProps": {
    "format": "csv",
    "column_separator": "\\x01",
    "line_delimiter": "\\x02"
}
```

CSV 形式では、データ内の特殊文字との衝突を避けるため、行とカラムの区切り文字に特に注意してください。不可視文字の使用を推奨します。デフォルトのカラム区切り文字は `\t`、行区切り文字は `\n` です。

#### 5. DataX ジョブを実行する

次のコマンドでジョブを実行します。その他の実行方法については、[DataX ユーザーガイド](https://github.com/alibaba/DataX/blob/master/userGuid.md) を参照してください。

```shell
python bin/datax.py my_import.json
```

正常に実行されると、次のようなログが表示されます。

```text
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - jobContainer starts to do prepare ...
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do prepare work .
2022-11-16 14:28:54.013 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do prepare work .
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - jobContainer starts to do split ...
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - Job set Channel-Number to 1 channels.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] splits to [1] tasks.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] splits to [1] tasks.
2022-11-16 14:28:54.033 [job-0] INFO  JobContainer - jobContainer starts to do schedule ...
2022-11-16 14:28:54.036 [job-0] INFO  JobContainer - Scheduler starts [1] taskGroups.
2022-11-16 14:28:54.037 [job-0] INFO  JobContainer - Running by standalone Mode.
2022-11-16 14:28:54.041 [taskGroup-0] INFO  TaskGroupContainer - taskGroupId=[0] start [1] channels for [1] tasks.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set byte_speed_limit to -1, No bps activated.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set record_speed_limit to -1, No tps activated.
2022-11-16 14:28:54.049 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] attemptCount[1] is started
2022-11-16 14:28:54.052 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Begin to read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
Wed Nov 16 14:28:54 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:28:54.071 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Finished read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Start to join batch data: rows[2] bytes[438] label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Executing stream load to: 'http://127.0.0.1:8030/api/demo/dwd_universal_tb_task/_stream_load', size: '441'
2022-11-16 14:28:54.224 [Thread-1] INFO  DorisStreamLoadObserver - StreamLoad response :{"Status":"Success","BeginTxnTimeMs":0,"Message":"OK","NumberUnselectedRows":0,"CommitAndPublishTimeMs":17,"Label":"datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f","LoadBytes":441,"StreamLoadPutTimeMs":1,"NumberTotalRows":2,"WriteDataTimeMs":11,"TxnId":217056,"LoadTimeMs":31,"TwoPhaseCommit":"false","ReadDataTimeMs":0,"NumberLoadedRows":2,"NumberFilteredRows":0}
2022-11-16 14:28:54.225 [Thread-1] INFO  DorisWriterManager - Async stream load finished: label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.249 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] is successed, used[201]ms
2022-11-16 14:28:54.250 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] completed it's tasks.
2022-11-16 14:29:04.048 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.049 [job-0] INFO  AbstractScheduler - Scheduler accomplished all tasks.
2022-11-16 14:29:04.049 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do post work.
Wed Nov 16 14:29:04 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:29:04.187 [job-0] INFO  DorisWriter$Job - Start to execute preSqls:[select count(1) from dwd_universal_tb_task]. context info:jdbc:mysql://172.16.0.13:9030/demo.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do post work.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX jobId [0] completed successfully.
2022-11-16 14:29:04.204 [job-0] INFO  HookInvoker - No hook invoked, because base dir not exists or is a file: /data/datax/hook
2022-11-16 14:29:04.205 [job-0] INFO  JobContainer -
         [total cpu info] =>
                averageCpu                     | maxDeltaCpu                    | minDeltaCpu
                -1.00%                         | -1.00%                         | -1.00%


         [total gc info] =>
                 NAME                 | totalGCCount       | maxDeltaGCCount    | minDeltaGCCount    | totalGCTime        | maxDeltaGCTime     | minDeltaGCTime
                 PS MarkSweep         | 1                  | 1                  | 1                  | 0.017s             | 0.017s             | 0.017s
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer -
Job start time                  : 2022-11-16 14:28:53
Job end time                    : 2022-11-16 14:29:04
Total job duration              :                 10s
Average job throughput          :               21B/s
Record write speed              :              0rec/s
Total records read              :                   2
Total read/write failures       :                   0
```

## インポート時の注意点とベストプラクティス

- `flushInterval` を小さすぎる値に設定しないでください。Doris への書き込みがブロックされてエラーコード `-235` が返されたり、`maxBatchRows` または `batchSize` のしきい値に達する前にインポートが開始されたりすることがあります。
- CSV 形式を使用する場合は、`column_separator` と `line_delimiter` がデータ内の値と衝突しないか確認してください。不可視文字を使うと衝突の可能性を下げられます。
- バッチが配列になっている JSON 形式を使用する場合は、Doris が配列内の各 Object を独立した行として解析するように `strip_outer_array = true` を設定してください。
- `labelPrefix` は UUID と組み合わされてグローバルに一意なラベルとなり、重複インポートを防ぎます。
- `loadUrl` にはカンマで区切って複数の FE アドレスを指定できます。doriswriter はそれらにラウンドロビン方式でアクセスします。

## FAQ

### DataX Doriswriter で同期できるのは MySQL のデータだけですか？

いいえ。DataX は多くのデータソースをサポートしています。このドキュメントの詳細な例では MySQL を使用していますが、DataX がサポートする他のデータソースからも Doriswriter を介して Doris に書き込めます。

### `loadUrl` にはどのポートを使用しますか？

`loadUrl` には FE ノードの `http_port` を `ip:port` 形式で指定します。複数のアドレスを指定した場合、doriswriter はそれらにラウンドロビン方式でアクセスします。

### JSON または CSV 形式でインポートする際に、区切り文字に注意が必要なのはなぜですか？

`line_delimiter` や `column_separator` がデータ内の文字と衝突すると、インポートエラーが発生することがあります。区切り文字に特殊文字や不可視文字を使用すると、衝突の可能性を下げられます。
