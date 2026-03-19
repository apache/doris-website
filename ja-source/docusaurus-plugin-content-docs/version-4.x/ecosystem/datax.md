---
{
  "title": "DataX Doriswriter",
  "language": "ja",
  "description": "DataX DoriswriterプラグインはMySQL、Oracle、SQL サーバーなどの様々なデータソースからのデータ同期をサポートしています。"
}
---
# DataX Doriswriter

[DataX](https://github.com/alibaba/DataX) Doriswriterプラグインは、MySQL、Oracle、SQL サーバーなどの様々なデータソースから、Stream Load方式を使用してDorisにデータを同期することをサポートしています。

:::info Note
このプラグインはDataXサービスと組み合わせて使用する必要があります。
DataXは複数のデータソースをサポートしています。詳細については、ここを参照してください。
:::

## 使用方法

### DataXインストールパッケージを直接ダウンロード

DataXは、DataXが既に含まれている公式インストールパッケージを提供しており、直接ダウンロードして使用できます。詳細については、[ここ](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80)を参照してください。

### DorisWriterプラグインを手動でコンパイル

DorisWriterプラグインの[ソースコード](https://github.com/apache/doris/tree/master/extension/DataX)をダウンロードします。

1. `init-env.sh`を実行
2. 必要に応じて`DataX/doriswriter`のdoriswriterのコードを修正
3. doriswriterをビルド

    > doriswriterを単独でビルド：

        `mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests`

    > DataXプロジェクト全体をコンパイルする必要がある場合は、[ここ](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start)を参照してください

    > コンパイルエラー

        以下のコンパイルエラーが発生した場合：

        ```
        Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
        ```
以下の解決策を試すことができます：

        1. [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz)をダウンロード
        2. 解凍後、生成された`alibaba/datax/`ディレクトリを、使用しているmavenに対応する`.m2/repository/com/alibaba/`にコピーし、再度コンパイルを試行してください。

### Datax DorisWriterパラメータ紹介：

* **jdbcUrl**

  - 説明: DorisのJDBC接続文字列で、ユーザーはpreSqlまたはpostSQLを実行します。
  - 必須: はい
  - デフォルト: なし
* **loadUrl**

  - 説明: Stream Loadの接続対象として使用されます。形式は「ip:port」です。IPはFEノードのIP、portはFEノードのhttp_portです。複数入力可能で、英語のカンマ`,`で区切ります。doriswriterはポーリング方式でアクセスします。
  - 必須: はい
  - デフォルト: なし
* **username**

  - 説明: Dorisデータベースにアクセスするためのユーザー名
  - 必須: はい
  - デフォルト: なし
* **password**

  - 説明: Dorisデータベースにアクセスするためのパスワード
  - 必須: いいえ
  - デフォルト: 空
* **connection.selectedDatabase**
  - 説明: 書き込み対象のDorisデータベース名
  - 必須: はい
  - デフォルト: なし
* **connection. table**
  - 説明: 書き込み対象のDorisテーブル名
    - 必須: はい
    - デフォルト: なし
* **flushInterval**
  - 説明: データをバッチで書き込む時間間隔。この時間間隔を小さく設定しすぎると、Dorisの書き込みブロッキング問題が発生し、エラーコード-235が出ます。この時間間隔を小さく設定しすぎて、かつ`maxBatchRows`と`batchSize`パラメータを大きく設定しすぎた場合、設定したデータサイズに到達せず、データがインポートされることがあります。
  - 必須: いいえ
  - デフォルト: 30000 (ms)
* **column**
  - 説明: 対象テーブルにデータを書き込む必要があるフィールド。これらのフィールドは生成されるJsonデータのフィールド名として使用されます。フィールドはカンマで区切られます。例："column": ["id","name","age"]。
  - 必須: はい
  - デフォルト: いいえ
* **preSql**

  - 説明: 対象テーブルにデータを書き込む前に、ここの標準文が最初に実行されます。
  - 必須: いいえ
  - デフォルト: なし
* **postSql**

  - 説明: 対象テーブルにデータを書き込んだ後に、ここの標準文が実行されます。
  - 必須: いいえ
  - デフォルト: なし


* **maxBatchRows**
  - 説明: 各バッチでインポートするデータの最大行数。**batchSize**と合わせて、バッチ毎のインポートレコード行数を制御します。各バッチのデータが2つの閾値のいずれかに達すると、このバッチのデータのインポートが開始されます。
  - 必須: いいえ
  - デフォルト: 500000

* **batchSize**
  - 説明: 各バッチでインポートするデータの最大量。**maxBatchRows**と連携してバッチ毎のインポート数を制御します。各バッチのデータが2つの閾値のいずれかに達すると、このバッチのデータのインポートが開始されます。
  - 必須: いいえ
  - デフォルト: 94371840

* **maxRetries**

  - 説明: 各バッチのデータインポートが失敗した後の再試行回数
  - 必須: いいえ
  - デフォルト: 3


* **labelPrefix**

  - 説明: 各バッチのインポートタスクのlabelプレフィックス。最終的なlabelは`labelPrefix + UUID`となり、グローバルに一意のlabelを形成してデータの重複インポートを防止します
  - 必須: いいえ
  - デフォルト: `datax_doris_writer_`

* **loadProps**

  - 説明: StreamLoadのリクエストパラメータ。詳細は、StreamLoad紹介ページを参照してください。[Stream load - Apache Doris](https://doris.apache.org/docs/data-operate/import/stream-load-manual)

    これには、インポートするデータ形式：formatなどが含まれます。インポートするデータ形式のデフォルトはcsvで、JSONもサポートしています。詳細は、以下の型変換セクションを参照するか、上記のStream loadの公式情報を参照してください。

  - 必須: いいえ

  - デフォルト: なし

### 例

#### 1. Streamでデータを読み取り、Dorisにインポート

doriswriterプラグインの使用方法については、[こちら](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md)を参照してください。

#### 2.Mysqlでデータを読み取り、Dorisにインポート

1.Mysqlテーブル構造

```sql
CREATE TABLE `t_test`(
 `id`bigint(30) NOT NULL,
 `order_code` varchar(30) DEFAULT NULL COMMENT '',
 `line_code` varchar(30) DEFAULT NULL COMMENT '',
 `remark` varchar(30) DEFAULT NULL COMMENT '',
 `unit_no` varchar(30) DEFAULT NULL COMMENT '',
 `unit_name` varchar(30) DEFAULT NULL COMMENT '',
 `price` decimal(12,2) DEFAULT NULL COMMENT '',
 PRIMARY KEY(`id`) USING BTREE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```
2.Dorisテーブル構造

```sql
CREATE TABLE `ods_t_test` (
 `id`bigint(30) NOT NULL,
 `order_code` varchar(30) DEFAULT NULL COMMENT '',
 `line_code` varchar(30) DEFAULT NULL COMMENT '',
 `remark` varchar(30) DEFAULT NULL COMMENT '',
 `unit_no` varchar(30) DEFAULT NULL COMMENT '',
 `unit_name` varchar(30) DEFAULT NULL COMMENT '',
 `price` decimal(12,2) DEFAULT NULL COMMENT ''
）ENGINE=OLAP
UNIQUE KEY(id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 3",
"in_memory" = "false",
"storage_format" = "V2"
);
```
3. dataxスクリプトを作成する

my_import.json

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id","order_code","line_code","remark","unit_no","unit_name","price"],
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
                        "column": ["id","order_code","line_code","remark","unit_no","unit_name","price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval":30000,
                        "connection": [
                          {
                            "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                            "selectedDatabase": "demo",
                            "table": ["all_employees_info"]
                          }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array":"true",
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
>備考:
>
>```json
>"loadProps": {
>   "format": "json",
>   "strip_outer_array": "true",
>   "line_delimiter": "\\x02"
>}
>```
>
>1. ここではJSON形式を使用してデータをインポートします
>2. `line_delimiter`のデフォルトは改行文字ですが、データ内の値と競合する可能性があるため、特殊文字や不可視文字を使用してインポートエラーを回避できます
>3. strip_outer_array : インポートデータのバッチ内の複数行データを表します。Dorisは解析時に配列を展開し、その中の各Objectを順次データの1行として解析します。
>4. Stream loadのより多くのパラメータについては、[Stream load - Apache Doris](../data-operate/import/import-way/stream-load-manual)を参照してください
>5. CSV形式の場合は、このように使用できます
>
>```json
>"loadProps": {
>    "format": "csv",
>    "column_separator": "\\x01",
>    "line_delimiter": "\\x02"
>}
>```
>
>**CSV形式では、データ内の特殊文字との競合を避けるため、行区切り文字と列区切り文字に特に注意する必要があります。ここでは非表示文字の使用を推奨します。デフォルトの列区切り文字は: \t、行区切り文字: \n**

4.dataxタスクを実行します。詳細は[datax公式サイト](https://github.com/alibaba/DataX/blob/master/userGuid.md)を参照してください

```
python bin/datax.py my_import.json
```
実行後、以下の情報を確認できます

```
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
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s             | 0.007s             

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer - 
Task Start Time                        : 2022-11-16 14:28:53
Task End Time                          : 2022-11-16 14:29:04
Total Task Duration                    : 10s
Average Task Throughput                : 21B/s
Record Write Speed                     : 0rec/s
Total Records Read                     : 2
Total Read/Write Failures              : 0

```
