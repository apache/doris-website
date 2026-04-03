---
{
  "title": "Routine Load",
  "description": "Apache Doris Routine Load リアルタイムデータインポートガイド: Kafka からの CSV/JSON データの継続的な消費をサポートし、データの損失や重複がないことを保証する Exactly-Once セマンティクスを提供し、ジョブ作成、ステータス監視、エラーハンドリング、SSL/Kerberos セキュリティ認証設定を含みます。",
  "language": "ja"
}
---
DorisはRoutine LoadによってKafka Topicsからデータを継続的に消費することができます。Routine Loadジョブを送信すると、Dorisはインポートジョブを実行し続け、Kafkaクラスター内の指定されたTopicsからメッセージを消費するために継続的にインポートタスクを生成します。

Routine Loadはストリーミングインポートジョブで、Exactly-Onceセマンティクスをサポートし、データの損失や重複がないことを保証します。

## 使用例

### サポートされるデータソース

Routine LoadはKafkaクラスターからのデータ消費をサポートします。

### サポートされるデータファイル形式

Routine LoadはCSVおよびJSON形式のデータをサポートします。

CSV形式をインポートする場合、null値と空文字列を明確に区別する必要があります：

- Null値は`\n`で表現する必要があります。データ`a,\n,b`は、中間の列がnull値であることを示します。

- 空文字列（''）は直接空のままにします。データ`a,,b`は、中間の列が空文字列であることを示します。

### 使用制限

Routine Loadを使用してKafkaからデータを消費する場合、以下の制限があります：

- サポートされるメッセージ形式はCSVおよびJSONテキスト形式です。各CSVメッセージは1行で、行の末尾に改行は**含まれません**。

- デフォルトでは、Kafkaバージョン0.10.0.0（含む）以上がサポートされます。Kafka 0.10.0.0未満のバージョン（0.9.0、0.8.2、0.8.1、0.8.0）を使用するには、`kafka_broker_version_fallback`の値を互換性のある古いバージョンに設定してBE設定を変更するか、Routine Load作成時に`property.broker.version.fallback`の値を互換性のある古いバージョンに直接設定する必要があります。古いバージョンを使用するコストは、時間に基づいたKafkaパーティションオフセットの設定など、Routine Loadの一部の新機能が利用できない可能性があることです。

## 基本原則

Routine LoadはKafka Topicsからデータを継続的に消費し、Dorisに書き込みます。

Dorisでは、Routine Loadジョブを作成すると、いくつかのインポートタスクを含む永続的なインポートジョブが生成されます：

- Import Job（Load Job）：Routine Load Jobは、データソースからデータを継続的に消費する永続的なインポートジョブです。

- Import Task（Load Task）：インポートジョブは、実際の消費のためにいくつかのインポートタスクに分割されます。各タスクは独立したトランザクションです。

Routine Loadインポートの具体的なプロセスを以下の図に示します：

![Routine Load](/images/routine-load.png)

1. クライアントがFEにRoutine Loadジョブ作成リクエストを送信します。FEはRoutine Load Managerを通じて永続的なインポートジョブ（Routine Load Job）を生成します。

2. FEはJob SchedulerによってRoutine Load JobをいくつかのRoutine Load Tasksに分割し、Task Schedulerによってスケジュールされ、BEノードに配信されます。

3. BEでは、Routine Load Taskがインポートを完了した後、トランザクションをFEに送信し、Jobメタデータを更新します。

4. Routine Load Taskが送信された後、新しいTasksが生成されるか、タイムアウトしたTasksが再試行されます。

5. 新しく生成されたRoutine Load TasksはTask Schedulerによって継続的なサイクルで引き続きスケジュールされます。

### 自動回復

ジョブの高可用性を確保するため、自動回復メカニズムが導入されています。予期しない一時停止の場合、Routine Load Schedulerスレッドはジョブの自動回復を試みます。予期しないKafka障害やその他の非動作状況に対して、自動回復メカニズムはKafka回復後にインポートジョブが手動介入なしに正常に実行を継続できることを保証します。

自動回復されないケース：

- ユーザーが手動で`PAUSE ROUTINE LOAD`コマンドを実行した場合。

- データ品質の問題が存在する場合。

- データベースtableが削除されるなど、自動回復できないケース。

上記3つのケースを除き、その他の一時停止されたジョブは自動回復を試みます。

## クイックスタート

### インポートジョブの作成

DorisではCREATE ROUTINE LOADコマンドを使用して永続的なRoutine Loadインポートタスクを作成できます。詳細な構文については、CREATE ROUTINE LOADを参照してください。Routine LoadはCSVおよびJSONデータを消費できます。

**CSVデータのインポート**

1. サンプルインポートデータ

Kafkaには以下のサンプルデータがあります：

```sql
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```
2. インポートするTableを作成する

Dorisで、以下の構文を使用してインポートするTableを作成します：

```sql
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. Routine Loadインポートジョブの作成

Dorisでは、CREATE ROUTINE LOADコマンドを使用してインポートジョブを作成します：

```sql
CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
COLUMNS TERMINATED BY ",",
COLUMNS(user_id, name, age)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-routine-load-csv",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
**JSONデータのインポート**

1. サンプルインポートデータ

Kafkaには、以下のサンプルデータがあります：

```sql
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-json --from-beginning
{"user_id":1,"name":"Emily","age":25}
{"user_id":2,"name":"Benjamin","age":35}
{"user_id":3,"name":"Olivia","age":28}
{"user_id":4,"name":"Alexander","age":60}
{"user_id":5,"name":"Ava","age":17}
{"user_id":6,"name":"William","age":69}
{"user_id":7,"name":"Sophia","age":32}
{"user_id":8,"name":"James","age":64}
{"user_id":9,"name":"Emma","age":37}
{"user_id":10,"name":"Liam","age":64}
```
2. インポートするTableの作成

Dorisで、以下の構文を使用してインポートするTableを作成します：

```sql
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. Routine Loadインポートジョブの作成

Dorisでは、CREATE ROUTINE LOADコマンドを使用してインポートジョブを作成します：

```sql
CREATE ROUTINE LOAD testdb.example_routine_load_json ON test_routineload_tbl
COLUMNS(user_id,name,age)
PROPERTIES(
    "format"="json",
    "jsonpaths"="[\"$.user_id\",\"$.name\",\"$.age\"]"
)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-routine-load-json",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
:::info Note
JSON ファイルのルートノードから JSON オブジェクトをインポートする必要がある場合、jsonpaths を `$.` として指定する必要があります。例：`PROPERTIES("jsonpaths"="$.")`。
:::

### インポート状況の確認

Doris では、Routine Load のインポートジョブステータスとインポートタスクステータス：

- Import Job：主にインポートタスクの対象Table、サブタスク数、インポート遅延状況、インポート設定、およびインポート結果を確認するために使用されます。

- Import Task：主にインポートサブタスクのステータス、消費進捗、および割り当てられた BE ノードを確認するために使用されます。

**01 実行中のインポートジョブの確認**

SHOW ROUTINE LOAD コマンドを使用してインポートジョブステータスを確認できます。SHOW ROUTINE LOAD は、インポート対象Table、インポート遅延状況、インポート設定情報、インポートエラー情報など、現在のジョブの基本ステータスを表示します。

たとえば、次のコマンドで testdb.example_routine_load_csv のジョブステータスを確認できます：

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```
**02 実行中のインポートタスクの表示**

SHOW ROUTINE LOAD TASKコマンドを使用して、インポートサブタスクのステータスを表示できます。SHOW ROUTINE LOAD TASKは、サブタスクステータス、ディスパッチされたBE ID など、現在のジョブ下でのサブタスク情報を表示します。

例えば、以下のコマンドでtestdb.example_routine_load_csvのタスクステータスを表示できます：

```sql
mysql> SHOW ROUTINE LOAD TASK WHERE jobname = 'example_routine_load_csv';
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| TaskId                            | TxnId | TxnStatus | JobId | CreateTime          | ExecuteStartTime    | Timeout | BeId  | DataSourceProperties |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| 8cf47e6a68ed4da3-8f45b431db50e466 | 195   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 10429 | {"4":1231,"9":2603}  |
| f2d4525c54074aa2-b6478cf8daaeb393 | 196   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 12109 | {"1":1225,"6":1216}  |
| cb870f1553864250-975279875a25fab6 | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"2":7234,"7":4865}  |
| 68771fd8a1824637-90a9dac2a7a0075e | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"3":1769,"8":2982}  |
| 77112dfea5e54b0a-a10eab3d5b19e565 | 197   | PREPARE   | 12177 | 2024-01-15 12:21:02 | 2024-01-15 12:21:02 | 20      | 12098 | {"0":3000,"5":2622}  |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
```
### インポートジョブの一時停止

PAUSE ROUTINE LOADコマンドを使用してインポートジョブを一時停止できます。インポートジョブを一時停止すると、PAUSEDステートに入りますが、インポートジョブは終了せず、RESUME ROUTINE LOADコマンドを使用して再開できます。

例えば、以下のコマンドでtestdb.example_routine_load_csvインポートジョブを一時停止できます：

```sql
PAUSE ROUTINE LOAD FOR testdb.example_routine_load_csv;
```
### Resume Import Job

RESUME ROUTINE LOADコマンドを使用してインポートジョブを再開できます。

例えば、以下のコマンドでtestdb.example_routine_load_csvインポートジョブを再開できます：

```sql
RESUME ROUTINE LOAD FOR testdb.example_routine_load_csv;
```
### Import Jobの変更

作成されたimport jobは、ALTER ROUTINE LOADコマンドを使用して変更することができます。import jobを変更する前に、PAUSE ROUTINE LOADを使用してそれを一時停止し、変更後にRESUME ROUTINE LOADを使用して再開する必要があります。

例えば、desired_concurrent_numberというdesired import taskの同期実行パラメータを変更し、以下のコマンドでKafka Topic情報を変更することができます：

```sql
ALTER ROUTINE LOAD FOR testdb.example_routine_load_csv
PROPERTIES(
    "desired_concurrent_number" = "3"
)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.60:9092",
    "kafka_topic" = "test-topic"
);
```
### インポートジョブのキャンセル

STOP ROUTINE LOADコマンドを使用してRoutine Loadインポートジョブを停止および削除できます。削除されたインポートジョブは復旧できず、SHOW ROUTINE LOADコマンドで表示することもできません。

以下のコマンドでインポートジョブtestdb.example_routine_load_csvを停止および削除できます：

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```
### Bind Compute Group

ストレージ・コンピュート分離モードでは、Routine LoadのCompute Group選択ロジックは以下の優先順位に従います：

1. `use db@cluster`文で指定されたCompute Groupを選択する。
2. ユーザー属性`default_compute_group`で指定されたCompute Groupを選択する。
3. 現在のユーザーがアクセス権限を持つCompute Groupsから1つを選択する。

ストレージ・コンピュート統合モードでは、ユーザー属性`resource_tags.location`で指定されたCompute Groupを選択します。ユーザー属性で指定されていない場合は、`default`という名前のCompute Groupを使用します。

Routine LoadジョブのCompute Groupは作成時にのみ指定できることに注意してください。Routine Loadジョブが作成されると、そのバインドされたCompute Groupは変更できません。

## リファレンスマニュアル

### インポートコマンド

Routine Load永続インポートジョブを作成する構文は以下の通りです：

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```
インポートジョブを作成するためのモジュール記述：

| Module                   | デスクリプション                                                         |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | インポートタスクを作成するデータベースを指定します。                                   |
| job_name               | 作成するインポートタスクの名前を指定します。同じデータベース内で同じ名前のタスクを持つことはできません。 |
| tbl_name               | インポートするTableの名前を指定します。これはオプションです。指定しない場合、動的Tableモードが使用され、KafkaデータにTable名情報が含まれている必要があります。 |
| merge_type             | データマージタイプ。デフォルトはAPPENDです。<p>merge_typeには3つのオプションがあります：</p> <p>- APPEND: 追記インポートモード</p> <p>- MERGE: マージインポートモード</p> <p>- DELETE: インポートされたすべてのデータが削除されます。</p> |
| load_properties        | インポート記述モジュール。以下のコンポーネントを含みます：<p>- column_separator句</p> <p>- columns_mapping句</p> <p>- preceding_filter句</p> <p>- where_predicates句</p> <p>- partitions句</p> <p>- delete_on句</p> <p>- order_by句</p> |
| job_properties         | Routine Loadの一般的なインポートパラメータを指定するために使用されます。                       |
| data_source_properties | Kafkaデータソースのプロパティを記述するために使用されます。                                  |
| comment                | インポートジョブの備考を記述するために使用されます。                                 |

### インポートパラメータ記述

**01 FE設定パラメータ**

| パラメータ名                          | デフォルト値 | Dynamic 構成 | FE Master Exclusive 構成 | Parameter デスクリプション                                                                                     |
|-----------------------------------|--------|----------|---------------------|----------------------------------------------------------------------------------------------|
| max_routine_load_task_concurrent_num | 256    | Yes       | Yes                  | Routine Loadインポートジョブのサブタスクの最大並行数を制限します。デフォルト値を維持することを推奨します。設定値が大きすぎると、並行タスクが多くなりすぎて、クラスタリソースを占有する可能性があります。 |
| max_routine_load_task_num_per_be  | 1024   | Yes       | Yes                  | BE毎に制限されるRoutine Loadタスクの最大並行数。`max_routine_load_task_num_per_be`は`routine_load_thread_pool_size`未満である必要があります。 |
| max_routine_load_job_num           | 100    | Yes       | Yes                  | NEED_SCHEDULED、RUNNING、PAUSEを含むRoutine Loadジョブの最大数を制限します。                        |
| max_tolerable_backend_down_num     | 0      | Yes       | Yes                  | BEが1つでもダウンしている限り、Routine Loadは自動復旧できません。特定の条件下で、DorisはPAUSEDタスクをRUNNING状態に再スケジュールできます。このパラメータの値が0の場合、すべてのBEノードが生きている場合にのみ再スケジュールが許可されることを意味します。 |
| period_of_auto_resume_min          | 5 (minutes) | Yes       | Yes                  | Routine Loadの自動復旧の期間。                                                               |

**02 BE設定パラメータ**


| パラメータ名                     | デフォルト値 | Dynamic 構成 | デスクリプション                                                                                                             |
|------------------------------|--------|----------|------------------------------------------------------------------------------------------------------------------|
| max_consumer_num_per_group   | 3      | Yes       | サブタスクが消費のために生成できるコンシューマの最大数。 |

**03 インポート設定パラメータ**

Routine Loadジョブを作成する際、CREATE ROUTINE LOADコマンドを通じて異なるモジュールに対して異なるインポート設定パラメータを指定できます。

**tbl_name句**

インポートするTableの名前を指定します。これはオプションです。

指定しない場合、動的Tableモードが使用され、KafkaデータにTable名情報が含まれている必要があります。現在、動的Table名はKafkaのValueからのみ取得でき、この形式に準拠する必要があります：JSON形式の場合：`table_name|{"col1": "val1", "col2": "val2"}`、ここで`tbl_name`はTable名で、`|`がTable名とTableデータの区切り文字です。CSV形式のデータも同様です。例：`table_name|val1,val2,val3`。ここの`table_name`はDorisのTable名と一致する必要があることに注意してください。そうでなければインポートが失敗します。動的Tableは後述するcolumn_mapping設定をサポートしないことに注意してください。

**merge_type句**

merge_typeモジュールを通じてデータマージタイプを指定できます。merge_typeには3つのオプションがあります：

- APPEND: 追記インポートモード

- MERGE: マージインポートモード。Unique Keyモデルにのみ適用可能。Delete Flagカラムをマークするために[DELETE ON]モジュールと併用する必要があります

- DELETE: インポートされたすべてのデータが削除されます

**load_properties句**

load_propertiesモジュールを通じてインポートデータのプロパティを記述できます。具体的な構文は以下の通りです：

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```
対応する特定のモジュールのパラメータは以下の通りです：

| サブモジュール                | パラメータ                                                         | 説明                                                         |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | <column_separator>                                           | カラム区切り文字の指定に使用します。デフォルトは `\t` です。例えば、カンマを区切り文字として指定するには、以下のコマンドを使用します：`COLUMN TERMINATED BY ","`<br/>null値の処理については、以下の点にご注意ください：<p>- null値は `\n` で表現する必要があります。データ `a,\n,b` は中央のカラムがnull値であることを示します</p> <p>- 空文字列（''）は直接空のままにします。データ `a,,b` は中央のカラムが空文字列であることを示します</p> |
| COLUMNS               | <column_name>                                                | 対応するカラム名の指定に使用します。例えば、インポートカラム `(k1, k2, k3)` を指定するには、以下のコマンドを使用します：`COLUMNS(k1, k2, k3)`<br/>以下の場合、COLUMNS句は省略できます：<p>- CSVのカラムがTableのカラムと一対一で対応している場合</p> <p>- JSONのキーカラムがTableのカラムと同じ名前の場合</p> |   
| &nbsp;&nbsp;               | <column_mapping>      | インポート時に、カラムのフィルタリングと変換にカラムマッピングを使用できます。例えば、インポート時に対象カラムがデータソースの特定のカラムから派生する必要があり、対象カラムk4がカラムk3からk3+1の式を使って計算される場合、以下のコマンドを使用します：`COLUMNS(k1, k2, k3, k4 = k3 + 1)`<br/>詳細については、[Data Transformation](../../import/load-data-convert)を参照してください |                                                              |
| WHERE                 | <where_expr>                                                 | where_exprの指定により、条件に基づいてインポートデータソースをフィルタリングできます。例えば、age > 30のデータのみをインポートするには、以下のコマンドを使用します：`WHERE age > 30` |
| PARTITION             | <partition_name>                                             | 対象Tableのどのパーティションにインポートするかを指定します。指定されない場合は、自動的に対応するパーティションにインポートします。例えば、対象Tableのパーティションp1とp2にインポートするには、以下のコマンドを使用します：`PARTITION(p1, p2)` |
| DELETE ON             | <delete_expr>                                                | MERGEインポートモードにおいて、delete_exprを使用してどのカラムを削除する必要があるかをマークします。例えば、MERGE時にage > 30のカラムを削除するには、以下のコマンドを使用します：`DELETE ON age > 30` |
| ORDER BY              | <order_by_column>                                            | Unique Keyモデルでのみ有効です。インポートデータのSequence Columnを指定してデータの順序を保証するために使用します。例えば、Unique KeyTableをインポートする際に、Sequence Columnをcreate_timeとして指定するには、以下のコマンドを使用します：`ORDER BY create_time`<br/>Unique KeyモデルでのSequence Columnの説明については、ドキュメント[Data アップデート/Sequence Column](../../../data-operate/update/update-of-unique-model)を参照してください |

**job_properties句**

Routine Loadインポートジョブの作成時に、job_properties句を指定してインポートジョブのプロパティを指定できます。構文は以下の通りです：

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```
job_properties句の具体的なパラメータオプションは以下の通りです：

| パラメータ                      | 説明                                                         |
| ------------------------- | ------------------------------------------------------------ |
| desired_concurrent_number | <p>デフォルト値: 256 </p> <p>パラメータ説明: 単一インポートサブタスク（loadタスク）の望ましい並行数。Routine Loadインポートジョブが分割される望ましいインポートサブタスクの数を変更します。インポート中、望ましいサブタスクの並行性は実際の並行性と等しくない場合があります。実際の並行性は、クラスタノード数、負荷、データソース条件に基づいて総合的に考慮され、以下の式を使用して実際のインポートサブタスク数を計算します：</p> <p>`min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`、ここで：</p> <p>- topic_partition_numはKafka Topicのパーティション数を表します</p> <p>- desired_concurrent_numberは設定されたパラメータサイズを表します</p> <p>- max_routine_load_task_concurrent_numはFEでRoutine Loadの最大タスク並行数を設定するパラメータです</p> |
| max_batch_interval        | 各サブタスクの最大実行時間（秒単位）。0より大きい必要があり、デフォルトは60(s)です。max_batch_interval/max_batch_rows/max_batch_sizeは合わせてサブタスク実行閾値を構成します。いずれかのパラメータが閾値に達すると、インポートサブタスクが終了し、新しいインポートサブタスクが生成されます。 |
| max_batch_rows            | 各サブタスクが読み取る最大行数。200000以上である必要があります。デフォルトは20000000です。max_batch_interval/max_batch_rows/max_batch_sizeは合わせてサブタスク実行閾値を構成します。いずれかのパラメータが閾値に達すると、インポートサブタスクが終了し、新しいインポートサブタスクが生成されます。 |
| max_batch_size            | 各サブタスクが読み取る最大バイト数。単位はバイトで、範囲は100MBから1GBです。デフォルトは1Gです。max_batch_interval/max_batch_rows/max_batch_sizeは合わせてサブタスク実行閾値を構成します。いずれかのパラメータが閾値に達すると、インポートサブタスクが終了し、新しいインポートサブタスクが生成されます。 |
| max_error_number          | サンプリングウィンドウ内で許可される最大エラー行数。0以上である必要があります。デフォルトは0で、エラー行は許可されないことを意味します。サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内のエラー行数が`max_error_number`より大きい場合、routineジョブは一時停止され、SHOW ROUTINE LOADコマンドの`ErrorLogUrls`を通じてデータ品質の問題を手動で確認する必要があります。where条件によってフィルタリングされた行はエラー行としてカウントされません。 |
| strict_mode               | strictモードを有効にするかどうか。デフォルトはoffです。Strictモードは、インポートプロセス中の列型変換の厳密なフィルタリングを意味します。有効にすると、列型変換の結果がNULLになる非null生データはフィルタリングされます。<p>Strictモードのフィルタリング戦略：</p> <p>- 派生列（関数変換によって生成される）については、Strict Modeは効果がありません</p> <p>- 列型の変換が必要な場合、型が間違っているデータはフィルタリングされ、型エラーによってフィルタリングされたデータについてはSHOW ROUTINE LOADの`ErrorLogUrls`で確認できます</p> <p>- 範囲制限を含むインポート列について、生データが型変換を正常に通過できるが範囲制限を通過できない場合、strictモードはそれに効果がありません。例：型がdecimal(1,0)で、生データが10の場合、型変換は通過できますが宣言された範囲内ではありません。このデータはstrictモードの影響を受けません。詳細については、[Strict Mode](../../../data-operate/import/handling-messy-data#strict-mode)を参照してください。</p> |
| timezone                  | インポートジョブに使用するタイムゾーンを指定します。デフォルトではSessionのtimezoneパラメータを使用します。このパラメータは、インポートに関与するすべてのタイムゾーン関連の関数結果に影響します。 |
| format                    | インポートデータ形式を指定します。デフォルトはCSVで、JSON形式をサポートしています。               |
| jsonpaths                 | インポートデータ形式がJSONの場合、jsonpathsを通じてJSONデータから抽出するフィールドを指定できます。例えば、以下のコマンドでインポート用のjsonpathsを指定します：`"jsonpaths" = "[\"$.userid\",\"$.username\",\"$.age\",\"$.city\"]"` |
| json_root                 | インポートデータ形式がJSONの場合、json_rootを通じてJSONデータのルートノードを指定できます。Dorisはルートノードから要素を抽出して解析します。デフォルトは空です。例えば、以下のコマンドでインポート用のJSONルートノードを指定します：`"json_root" = "$.RECORDS"` |
| strip_outer_array         | インポートデータ形式がjsonの場合、strip_outer_arrayがtrueであることは、JSONデータが配列として提示され、データの各要素が1行として扱われることを意味します。デフォルト値はfalseです。通常、KafkaのJSONデータは配列形式、つまり外側の角括弧`[]`を含む場合があります。この場合、`"strip_outer_array" = "true"`を指定してTopic内のデータを配列モードで消費できます。例えば、以下のデータは2行に解析されます：`[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism    | バッチデータ送信の並列度を設定するために使用されます。並列度の値がBE設定の`max_send_batch_parallelism_per_job`を超える場合、コーディネーターとして機能するBEは`max_send_batch_parallelism_per_job`の値を使用します。 |
| load_to_single_tablet     | タスクごとに対応するパーティションの1つのタブレットのみにデータをインポートすることをサポートします。デフォルト値はfalseです。このパラメータは、ランダムバケティングを使用するolapTableにデータをインポートする場合にのみ許可されます。 |
| partial_columns           | 部分列更新を有効にするかどうかを指定します。デフォルト値はfalseです。このパラメータは、TableモデルがUniqueでMerge on Writeを使用する場合にのみ許可されます。マルチTableストリーミングはこのパラメータをサポートしていません。詳細については、[Partial Column アップデート](../../../data-operate/update/partial-column-update.md)を参照してください |
| unique_key_update_mode    | Unique KeyTableの更新モードを指定します。オプション値：<ul><li>`UPSERT`（デフォルト）：標準的な全行挿入または更新操作。</li><li>`UPDATE_FIXED_COLUMNS`：部分列更新、すべての行が同じ列を更新。`partial_columns=true`と同等。</li><li>`UPDATE_FLEXIBLE_COLUMNS`：柔軟な部分列更新、各行が異なる列を更新可能。JSON形式が必要で、Tableに`enable_unique_key_skip_bitmap_column=true`が必要。`jsonpaths`、`fuzzy_parse`、`COLUMNS`句、または`WHERE`句と併用不可。</li></ul>詳細については、[Partial Column アップデート](../../../data-operate/update/partial-column-update#flexible-partial-column-update)を参照してください |
| partial_update_new_key_behavior | Unique Merge on WriteTableで部分列更新を実行する際の新しく挿入された行の処理方法。2つのタイプ：`APPEND`、`ERROR`。<br/>- `APPEND`：新しい行データの挿入を許可<br/>- `ERROR`：新しい行を挿入する際にインポートが失敗してエラーを報告 |
| max_filter_ratio          | サンプリングウィンドウ内で許可される最大フィルタリング率。0以上1以下である必要があります。デフォルト値は1.0で、任意のエラー行を許容できることを意味します。サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内のエラー行/総行数が`max_filter_ratio`より大きい場合、routineジョブは一時停止され、データ品質の問題を手動で確認する必要があります。where条件によってフィルタリングされた行はエラー行としてカウントされません。 |
| enclose                   | 囲み文字を指定します。CSVデータフィールドに行または列の区切り文字が含まれる場合、保護のために単一バイト文字を囲み文字として指定できます。例えば、列区切り文字が","で囲み文字が"'"の場合、データ"a,'b,c'"について、"b,c"が1つのフィールドとして解析されます。 |
| escape                    | エスケープ文字を指定します。囲み文字と同じフィールド内の文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で、囲み文字が"'"、"b,'cを1つのフィールドとして解析したい場合、"\"などの単一バイトエスケープ文字を指定し、データを"a,'b,\'c'"に変更する必要があります。 |

**04 data_source_properties句**

Routine Loadインポートジョブを作成する際、data_source_properties句を指定してKafkaデータソースのプロパティを指定できます。構文は以下の通りです：

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```
data_source_properties句の具体的なパラメータオプションは以下の通りです：

| Parameter              | デスクリプション                                                         |
| ----------------- | ------------------------------------------------------------ |
| kafka_broker_list | Kafkaブローカー接続情報を指定します。形式は`<kafka_broker_ip>:<kafka port>`です。複数のブローカーはカンマで区切ります。例えば、Kafka Brokerでは、デフォルトのポート番号は9092です。Broker Listは以下のコマンドで指定できます：`"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic       | 購読するKafkaトピックを指定します。1つのインポートジョブは1つのKafka Topicのみを消費できます。 |
| kafka_partitions  | 購読するKafka Partitionsを指定します。指定されない場合、デフォルトですべてのパーティションが消費されます。 |
| kafka_offsets     | 消費するKafka Partitionでの開始消費ポイント（オフセット）。時刻が指定された場合、その時刻以上の最も近いオフセットから消費を開始します。オフセットは0以上の具体的なオフセットを指定するか、以下の形式を使用できます：<p>- OFFSET_BEGINNING: データが存在する位置から購読します。</p> <p>- OFFSET_END: 末尾から購読します。</p> <p>- 時刻形式、例："2021-05-22 11:00:00"</p> <p>指定されない場合、デフォルトで`OFFSET_END`からトピック下のすべてのパーティションを購読します。</p> <p>複数の開始消費ポイントをカンマで区切って指定できます、例：`"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"`または`"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`</p> <p>時刻形式とOFFSET形式は混在できないことに注意してください。</p> |
| property          | カスタムkafkaパラメータを指定します。kafka shellの"--property"パラメータと機能的に同等です。パラメータのValueがファイルの場合、Valueの前にキーワード"FILE:"を追加する必要があります。ファイルの作成については、CREATE FILEコマンドのドキュメントを参照してください。サポートされているカスタムパラメータの詳細については、librdkafkaの公式[CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md)ドキュメントのクライアント設定項目を参照してください。例：`"property.client.id" = "12345"`、`"property.group.id" = "group_id_0"`、`"property.ssl.ca.location" = "FILE:ca.pem"`。 |

data_source_propertiesでkafka propertyパラメータを設定することで、セキュアアクセスオプションを設定できます。現在、Dorisは複数のKafkaセキュリティプロトコルをサポートしています、例えばplaintext（デフォルト）、SSL、PLAIN、Kerberosなど。

### インポートステータス

インポートジョブのステータスはSHOW ROUTINE LOADコマンドで確認できます。具体的な構文は以下の通りです：

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```
例えば、SHOW ROUTINE LOADは以下の結果セットの例を返します：

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```
特定の表示結果の説明は以下の通りです：

| Result Column               | Column デスクリプション                                                       |
| -------------------- | ------------------------------------------------------------ |
| Id                   | Job ID。Dorisによって自動生成されます。                                 |
| Name                 | Job名。                                                   |
| CreateTime           | Job作成時刻。                                               |
| PauseTime            | 最新のJob一時停止時刻。                                       |
| EndTime              | Job終了時刻。                                               |
| DbName               | 対応するデータベース名                                               |
| TableName            | 対応するTable名。マルチTableの場合、動的Tableのため、具体的なTable名は表示されず、multi-tableと表示されます。 |
| IsMultiTbl           | マルチTableかどうか。                                                 |
| State                | Job実行ステータス。5つの状態があります：<p>- NEED_SCHEDULE：スケジュール待ちのJob。CREATE ROUTINE LOADまたはRESUME ROUTINE LOAD後、Jobは最初にNEED_SCHEDULE状態に入ります；</p> <p>- RUNNING：Job実行中；</p> <p>- PAUSED：Job一時停止中、RESUME ROUTINE LOADで再開可能；</p> <p>- STOPPED：Job終了済みで再開不可；</p> <p>- CANCELLED：Jobキャンセル済み。</p> |
| DataSourceType       | データソースタイプ：KAFKA。                                          |
| CurrentTaskNum       | 現在のサブタスク数。                                             |
| JobProperties        | Job設定詳細。                                               |
| DataSourceProperties | データソース設定詳細。                                             |
| CustomProperties     | カスタム設定。                                                 |
| Statistic            | Job実行ステータス統計。                                       |
| Progress             | Job実行進捗。Kafkaデータソースの場合、各パーティションの現在消費されたoffsetを表示します。例えば、`{"0":"2"}`はKafkaパーティション0の消費進捗が2であることを意味します。 |
| Lag                  | Job遅延ステータス。Kafkaデータソースの場合、各パーティションの消費遅延を表示します。例えば、`{"0":10}`はKafkaパーティション0の消費遅延が10であることを意味します。 |
| ReasonOfStateChanged | Jobステータス変更理由                                           |
| ErrorLogUrls         | フィルタリングされた品質の悪いデータの閲覧アドレス                           |
| OtherMsg             | その他のエラーメッセージ                                                 |

## インポート例

### 最大インポートエラー許容率の設定

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "max_filter_ratio"="0.5",
                "max_error_number" = "100",
                "strict_mode" = "true"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test01;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    +------+------------+------+
    2 rows in set (0.01 sec)
    ```
### 指定された消費ポイントからのデータ消費

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```
### Consumer GroupのグループIDとクライアントIDを指定する

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```
### Import Filter条件の設定

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```
### 指定パーティションデータのインポート

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```
4. Import結果

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```
### Set Import Timezone

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```
### merge_typeを設定する

**Delete操作のmerge_typeを指定する**

1. サンプルインポートデータ

    ```sql
    3,Alexander,22
    5,William,26
    ```
インポート前のTable内のデータ：

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```
**Merge操作でmerge_typeを指定する**

1. サンプルインポートデータ

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```
Table内のインポート前のデータ:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```
4. インポート結果

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```
**インポート時のマージ用シーケンスカラムの指定**

1. サンプルインポートデータ

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```
インポート前のTable内のデータ：

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE 
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```
4. インポート結果

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```
### インポート時の完全なカラムマッピングと派生カラム計算

1. サンプルインポートデータ

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```
### 囲い文字を含むデータのインポート

1. サンプルインポートデータ

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```
4. インポート結果

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```
### JSON Format Import

**Simple Mode での JSON Format データの Import**

1. サンプル import データ

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. Import結果

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```
**Matching Modeでの複雑なJSON形式データのインポート**

1. サンプルインポートデータ

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```
**インポートデータのJSONルートノードを指定する**

1. サンプルインポートデータ

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```
**Complete Column Mapping and Derived Column Calculation During Import**

1. サンプルインポートデータ

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```
**Flexible Partial Column アップデート**

この例では、各行が異なる列を更新できる柔軟な部分列更新の使用方法を示します。これは、変更レコードが異なるフィールドを含む可能性があるCDCシナリオで非常に有用です。

1. サンプルインポートデータ（各JSONレコードは異なる列を更新します）：

    ```json
    {"id": 1, "balance": 150.00, "last_active": "2024-01-15 10:30:00"}
    {"id": 2, "city": "Shanghai", "age": 28}
    {"id": 3, "name": "Alice", "balance": 500.00, "city": "Beijing"}
    {"id": 1, "age": 30}
    {"id": 4, "__DORIS_DELETE_SIGN__": 1}
    ```
2. Tableの作成（Merge-on-Writeを有効にし、bitmapカラムをスキップする必要があります）：

    ```sql
    CREATE TABLE demo.routine_test_flexible (
        id           INT            NOT NULL  COMMENT "id",
        name         VARCHAR(30)              COMMENT "Name",
        age          INT                      COMMENT "Age",
        city         VARCHAR(50)              COMMENT "City",
        balance      DECIMAL(10,2)            COMMENT "Balance",
        last_active  DATETIME                 COMMENT "Last Active Time"
    )
    UNIQUE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1",
        "enable_unique_key_merge_on_write" = "true",
        "enable_unique_key_skip_bitmap_column" = "true"
    );
    ```
3. 初期データを挿入する:

    ```sql
    INSERT INTO demo.routine_test_flexible VALUES
    (1, 'John', 25, 'Shenzhen', 100.00, '2024-01-01 08:00:00'),
    (2, 'Jane', 30, 'Guangzhou', 200.00, '2024-01-02 09:00:00'),
    (3, 'Bob', 35, 'Hangzhou', 300.00, '2024-01-03 10:00:00'),
    (4, 'Tom', 40, 'Nanjing', 400.00, '2024-01-04 11:00:00');
    ```
4. Importコマンド:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job_flexible ON routine_test_flexible
            PROPERTIES
            (
                "format" = "json",
                "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoadFlexible",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```
5. インポート結果：

    ```sql
    mysql> SELECT * FROM demo.routine_test_flexible ORDER BY id;
    +------+-------+------+-----------+---------+---------------------+
    | id   | name  | age  | city      | balance | last_active         |
    +------+-------+------+-----------+---------+---------------------+
    |    1 | John  |   30 | Shenzhen  |  150.00 | 2024-01-15 10:30:00 |
    |    2 | Jane  |   28 | Shanghai  |  200.00 | 2024-01-02 09:00:00 |
    |    3 | Alice |   35 | Beijing   |  500.00 | 2024-01-03 10:00:00 |
    +------+-------+------+-----------+---------+---------------------+
    3 rows in set (0.01 sec)
    ```
注意: `id=4`の行は`__DORIS_DELETE_SIGN__`により削除され、各行は対応するJSONレコードに含まれる列のみを更新しました。

### 複合型のインポート

**Array データ型のインポート**

1. サンプルインポートデータ

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```
**Import Map データ型**

1. サンプルインポートデータ

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Importコマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```
**Import Bitmap Data タイプ**

1. サンプルimportデータ

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```
2. Table構造

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```
4. インポート結果

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18 
        -> group by id 
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```
**HLL Data タイプ のインポート**

1. サンプルインポートデータ

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```
2. Table構造

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```
3. Import コマンド

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```
4. インポート結果

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing  | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing  | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Hebei    | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shaanxi  | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing  | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu  | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```
### Kafka Security 認証

**SSL認証されたKafkaからのデータインポート**

サンプルインポートコマンド：

```SQL
CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "ssl",
            "property.ssl.ca.location" = "FILE:ca.pem",
            "property.ssl.certificate.location" = "FILE:client.pem",
            "property.ssl.key.location" = "FILE:client.key",
            "property.ssl.key.password" = "ssl_passwd"
        );  
```
パラメータの説明:

| パラメータ                              | 説明                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| property.security.protocol        | 使用するセキュリティプロトコル（上記の例ではSSLなど）                     |
| property.ssl.ca.location          | CA（Certificate Authority）証明書の場所                        |
| property.ssl.certificate.location | （Kafkaサーバーでクライアント認証が有効になっている場合のみ必須）クライアントの公開鍵の場所 |
| property.ssl.key.location         | （Kafkaサーバーでクライアント認証が有効になっている場合のみ必須）クライアントの秘密鍵の場所 |
| property.ssl.key.password         | （Kafkaサーバーでクライアント認証が有効になっている場合のみ必須）クライアントの秘密鍵のパスワード |

**Kerberos認証されたKafkaからのデータインポート**

サンプルインポートコマンド:

```SQL
CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "SASL_PLAINTEXT",
            "property.sasl.kerberos.service.name" = "kafka",
            "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
            "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
        );  
```
パラメータの説明:

| パラメータ                                | 説明                                                |
| ----------------------------------- | --------------------------------------------------- |
| property.security.protocol          | 使用されるセキュリティプロトコル、上記の例ではSASL_PLAINTEXTなど |
| property.sasl.kerberos.service.name | brokerサービス名を指定、デフォルトはKafka              |
| property.sasl.kerberos.keytab       | keytabファイルの場所                                   |
| property.sasl.kerberos.principal    | kerberosプリンシパルを指定                             |

> `krb5.conf`で`rdnbs=true`を設定することを推奨します。そうしないと、次のエラーが発生する可能性があります: `サーバー kafka/15.5.4.68@EXAMPLE.COM not found in Kerberos database`

**PLAIN認証Kafkaクラスターからのインポート**

サンプルインポートコマンド:

```SQL
CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad22",
            "property.security.protocol"="SASL_PLAINTEXT",
            "property.sasl.mechanism"="PLAIN",
            "property.sasl.username"="admin",
            "property.sasl.password"="admin"
        );  
```
パラメータの説明:

| パラメータ                       | 説明                                                |
| -------------------------- | --------------------------------------------------- |
| property.security.protocol | 使用するセキュリティプロトコル。上記の例では SASL_PLAINTEXT など |
| property.sasl.mechanism    | SASL認証メカニズムを PLAIN として指定                          |
| property.sasl.username     | SASLユーザー名                                       |
| property.sasl.password     | SASLパスワード                                         |

### 単一ストリームからのマルチTableインポート

example_db に対して test1 という名前の Kafka ルーチン動的マルチTableインポートタスクを作成します。列区切り文字と group.id および client.id を指定し、デフォルトですべてのパーティションを自動的に消費し、データが存在する位置（OFFSET_BEGINNING）から購読を開始します。

ここでは、Kafka から example_db の tbl1 と tbl2 の両方のTableにデータをインポートする必要があると仮定します。`my_topic` という名前の Kafka Topic から tbl1 と tbl2 の両方に同時にデータをインポートする test1 という名前のルーチンインポートタスクを作成します。これにより、1つのルーチンインポートタスクで Kafka データを2つのTableにインポートすることができます。

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```
この時点で、KafkaのデータにはTable名情報を含む必要があります。現在、動的Table名はKafkaのValueからのみ取得可能で、この形式に従う必要があります：JSON形式の場合：`table_name|{"col1": "val1", "col2": "val2"}`、ここで`tbl_name`はTable名で、`|`がTable名とTableデータの区切り文字です。CSVフォーマットデータも同様で、例えば：`table_name|val1,val2,val3`です。ここでの`table_name`はDorisのTable名と一致する必要があり、そうでなければインポートは失敗します。動的Tableは、後述するcolumn_mapping設定をサポートしないことに注意してください。

### Strict Modeインポート

example_dbのexample_tblに対してtest1という名前のKafka routineインポートタスクを作成します。このインポートタスクはstrict modeです。

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```
## 暗号化および認証されたKafkaサービスへの接続

ここでは、StreamNative messaging serviceへのアクセスを例として使用します：

```
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(user_id, name, age) 
FROM KAFKA (
    "kafka_broker_list" = "pc-xxxx.aws-mec1-test-xwiqv.aws.snio.cloud:9093",
    "kafka_topic" = "my_topic",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "PLAIN",
    "property.sasl.username" = "user",
    "property.sasl.password" = "token:eyJhbxxx",
    "property.group.id" = "my_group_id_1",
    "property.client.id" = "my_client_id_1",
    "property.enable.ssl.certificate.verification" = "false"
);
```
注意: BE側で信頼できるCA証明書パスが設定されていない場合、サーバー証明書が信頼できるかどうかを検証しないように `"property.enable.ssl.certificate.verification" = "false"` を設定する必要があります。

そうでない場合は、信頼できるCA証明書パスを設定する必要があります: `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`。

## 詳細なヘルプ

SQLマニュアルのRoutine Loadを参照してください。また、クライアントのコマンドラインで `HELP ROUTINE LOAD` を入力すると、より詳細なヘルプ情報を取得できます。
