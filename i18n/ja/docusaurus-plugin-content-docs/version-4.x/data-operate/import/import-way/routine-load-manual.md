---
{
    "title": "Routine Load",
    "language": "ja",
    "description": "Apache Doris の Routine Load は Kafka からデータを継続的に取り込みます。CSV/JSON 形式、Exactly-Once セマンティクス、SSL/Kerberos 認証、ジョブのライフサイクル管理、トラブルシューティングを説明します。",
    "keywords": [
        "Routine Load",
        "Kafka リアルタイム取り込み",
        "Doris ストリーミング取り込み",
        "継続的な取り込み",
        "Exactly-Once",
        "Kafka SSL",
        "Kafka Kerberos",
        "Kafka SASL",
        "SASL_PLAINTEXT",
        "SASL_SSL",
        "JSON 取り込み",
        "CSV 取り込み",
        "動的テーブル取り込み",
        "単一ストリームから複数テーブルへの取り込み",
        "柔軟な部分列更新",
        "UPDATE_FLEXIBLE_COLUMNS",
        "PAUSED",
        "Routine Load PAUSED",
        "out of range",
        "kafka_broker_version_fallback",
        "property.broker.version.fallback",
        "desired_concurrent_number",
        "max_filter_ratio",
        "ErrorLogUrls",
        "ALTER ROUTINE LOAD",
        "PAUSE ROUTINE LOAD",
        "RESUME ROUTINE LOAD",
        "STOP ROUTINE LOAD"
    ]
}
---

<!-- Knowledge type: Procedures + Configuration parameters + Examples + FAQ -->
<!-- Applicable scenarios: Continuously consume data from Kafka into Doris / Real-time data ingestion / CDC streaming sync -->

Routine Load は、Kafka トピックからデータを継続的に読み取り、Doris テーブルに書き込む Apache Doris の**ストリーミング取り込み**ジョブです。ジョブを作成すると、Doris は取り込みジョブを継続的に実行し、指定した Kafka トピックのメッセージを読み取るタスクをリアルタイムで生成します。**Exactly-Once** セマンティクスにより、データの欠落や重複を防ぎます。

## クイックナビゲーション {#quick-navigation}

目的に応じて、該当するセクションに進んでください。

| 目的 | セクション |
| ------- | ------- |
| 最小構成の例をすぐに実行する | [クイックスタート](#quick-start) |
| 動作原理、状態遷移、自動復旧の仕組みを理解する | [基本原理](#basic-principles) |
| 設定可能な FE/BE/ジョブ/Kafka パラメータを調べる | [リファレンス](#reference-manual) |
| 耐障害性、フィルタリング、JSON、Kerberos など、用途別の例を探す | [取り込み例](#import-examples) |
| ジョブが `PAUSED` になる、`out of range` が報告される、SSL エラーが発生する | [よくある質問（FAQ）](#frequently-asked-questions-faq) |

## ユースケース {#use-cases}

<!-- Knowledge type: Scenario description -->

Routine Load は、次のような場合に適しています。

- Kafka トピックのリアルタイムデータを Doris に継続的に同期する。
- データの欠落や重複を防ぐために **Exactly-Once** セマンティクスが必要である。
- 取り込むデータに列マッピング、フィルタリング、派生列の計算などの変換を適用する。
- 一つの Kafka トピックから複数の Doris テーブルにデータを動的に振り分ける（単一ストリーム、複数テーブル）。

### 対応するデータソースと形式 {#supported-data-sources-and-formats}

Routine Load が読み取れるデータソースは **Kafka クラスター**のみで、次の二種類のメッセージ形式に対応します。

| 形式 | 説明 |
| ---- | ---- |
| CSV  | 各メッセージは一行で、行末に改行文字を**含めません**。 |
| JSON | 一つの JSON オブジェクト、または複数のオブジェクトを含む JSON 配列。 |

CSV 形式を取り込む際は、NULL 値と空文字列を区別してください。

- NULL 値は `\n` で表します。たとえば `a,\n,b` では、中央の列が NULL 値です。
- 空文字列はそのまま空のデータとして設定されます。たとえば `a,,b` では、中央の列が空文字列（`''`）です。

### 制限事項 {#limitations}

Kafka からデータを読み取る Routine Load には、次の制限があります。

| 制限 | 説明 |
| ------ | ---- |
| メッセージ形式 | CSV と JSON のテキスト形式のみをサポートします。各 CSV メッセージは一行で、行末に改行文字を**含めません**。 |
| Kafka のバージョン | デフォルトでは Kafka 0.10.0.0 以降に対応します。0.10.0.0 より前のバージョン（0.9.0、0.8.2、0.8.1、0.8.0）を使うには、BE の設定 `kafka_broker_version_fallback` を対象バージョンに変更するか、ジョブ作成時に `property.broker.version.fallback` を設定します。古いバージョンでは、時刻による Kafka パーティションのオフセット指定など、Routine Load の新しい機能が使えない場合があります。 |

## 基本原理 {#basic-principles}

Routine Load は Kafka トピックからデータを継続的に読み取り、Doris に書き込みます。Doris で Routine Load ジョブを作成すると、複数の取り込みタスクを含む長時間実行ジョブが生成されます。

- **取り込みジョブ（Load Job）**: データソースからデータを継続的に読み取る、長時間実行の Routine Load ジョブです。
- **取り込みタスク（Load Task）**: 実際の読み取りのためにジョブを分割したタスクです。各タスクは独立したトランザクションです。

Routine Load の詳しい処理の流れを次の図に示します。

![Routine Load の処理の流れ](/images/routine-load.png)

全体の流れは次のとおりです。

1. クライアントが FE に Routine Load ジョブの作成を要求します。FE は Routine Load Manager を通じて、長時間実行の取り込みジョブ（Routine Load Job）を生成します。
2. FE は Job Scheduler を通じてジョブを複数の Routine Load Task に分割します。Task Scheduler がタスクを BE ノードに割り当てます。
3. BE でタスクが取り込みを終えると、FE にトランザクションをコミットし、ジョブのメタデータを更新します。
4. タスクのコミット後、新しいタスクを生成するか、タイムアウトしたタスクを再試行します。
5. 新しいタスクは Task Scheduler によって継続的にスケジュールされます。

### 自動復旧の仕組み {#auto-recovery-mechanism}

<!-- Knowledge type: State machine / Operations rules -->

ジョブの可用性を高めるため、Routine Load には自動復旧の仕組みがあります。ジョブが予期せず一時停止すると、Routine Load Scheduler スレッドが自動的に復旧を試みます。Kafka 側の予期しない停止などで処理できなくなった場合も、Kafka の復旧後は通常、手動操作なしで取り込みジョブを再開できます。

次の表に、自動復旧するケースと手動対応が必要なケースを示します。

| 一時停止の原因 | 自動復旧 | 推奨される対応 |
| -------------- | ------------ | -------- |
| Kafka ブローカーへの一時的な接続不可、ネットワークの不安定さ | はい | Scheduler が `period_of_auto_resume_min` の間隔で自動的に再試行します。 |
| ユーザーが `PAUSE ROUTINE LOAD` を実行した | いいえ | `RESUME ROUTINE LOAD` を手動で実行します。 |
| データ品質の問題（`max_filter_ratio` または `max_error_number` を超過） | いいえ | `ErrorLogUrls` を調査し、データまたはパラメータを調整してから `RESUME` します。 |
| データベースやテーブルの削除など、復旧できないメタデータの例外 | いいえ | テーブルを再作成するか、ジョブを作り直します。 |

## クイックスタート {#quick-start}

<!-- Knowledge type: Procedures -->

このセクションでは、Kafka から Routine Load ジョブを作成する最小構成の例と、ジョブの表示、一時停止、再開、変更、停止の基本操作を説明します。

### 取り込みジョブの作成 {#create-an-import-job}

[CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD) コマンドで、長時間実行する Routine Load 取り込みジョブを作成できます。Routine Load は CSV と JSON のデータを読み取れます。

#### CSV データの取り込み {#import-csv-data}

1. Kafka データのサンプルを用意します。

    ```bash
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

2. 取り込み先のテーブルを作成します。

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Routine Load 取り込みジョブを作成します。

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

#### JSON データの取り込み {#import-json-data}

1. Kafka データのサンプルを用意します。

    ```bash
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

2. 取り込み先のテーブルを作成します。

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Routine Load 取り込みジョブを作成します。

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

:::info 注記
JSON ファイルのルートにある JSON オブジェクトを取り込むには、`jsonpaths` を `$.` に設定します。例: `PROPERTIES("jsonpaths"="$.")`。
:::

### 取り込み状態の確認 {#view-import-status}

Routine Load の状態は、次の二つの単位で確認します。

- **取り込みジョブ**: 取り込み先テーブル、サブタスク数、取り込みの遅延、設定、結果を確認します。
- **取り込みタスク**: サブタスクの状態、読み取りの進捗、割り当て先の BE ノードを確認します。

#### 取り込みジョブの確認 {#view-the-load-job}

[SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) コマンドで取り込みジョブを確認します。このコマンドには、取り込み先テーブル、遅延、設定、エラー情報など、現在のジョブの基本状態が表示されます。

次のコマンドは `testdb.example_routine_load_csv` の状態を表示します。

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

#### 取り込みサブタスクの確認 {#view-the-load-subtasks}

[SHOW ROUTINE LOAD TASK](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK) コマンドで取り込みサブタスクを確認します。このコマンドには、現在のジョブのサブタスク状態や割り当て先の BE ID などが表示されます。

次のコマンドは `testdb.example_routine_load_csv` のサブタスク情報を表示します。

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

### 取り込みジョブの一時停止 {#pause-an-import-job}

[PAUSE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD) コマンドで取り込みジョブを一時停止できます。一時停止したジョブは `PAUSED` 状態になりますが、終了はしません。`RESUME ROUTINE LOAD` コマンドで再開できます。

```sql
PAUSE ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### 取り込みジョブの再開 {#resume-an-import-job}

`PAUSED` 状態のジョブは、[RESUME ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD) コマンドで再開できます。

```sql
RESUME ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### 取り込みジョブの変更 {#modify-an-import-job}

作成済みのジョブは [ALTER ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD) コマンドで変更できます。変更前に `PAUSE ROUTINE LOAD` で一時停止し、変更後に `RESUME ROUTINE LOAD` で再開します。

たとえば、希望する並列度のパラメータ `desired_concurrent_number` と Kafka トピックの情報を変更するには、次のようにします。

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

### 取り込みジョブの停止 {#cancel-an-import-job}

[STOP ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD) コマンドで Routine Load 取り込みジョブを停止、削除できます。**削除したジョブは復旧できず**、`SHOW ROUTINE LOAD` コマンドでも表示できません。

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Compute Group のバインド {#bind-a-compute-group}

**ストレージとコンピュートが分離したモード**では、Routine Load は次の優先順位で Compute Group を選択します。

1. `use db@cluster` 文で指定された Compute Group。
2. ユーザープロパティ `default_compute_group` で指定された Compute Group。
3. 現在のユーザーがアクセス権を持つ Compute Group のいずれか。

**ストレージとコンピュートが一体のモード**では、ユーザープロパティ `resource_tags.location` で指定された Compute Group を選択します。指定がなければ、`default` という名前の Compute Group を使用します。

:::caution 注記
Routine Load ジョブの Compute Group は**作成時にのみ指定できます**。作成後にバインド先の Compute Group を変更することはできません。
:::

## リファレンス {#reference-manual}

<!-- Knowledge type: Configuration parameters + Syntax reference -->

### 取り込みコマンドの構文 {#import-command-syntax}

長時間実行する Routine Load 取り込みジョブを作成する構文は次のとおりです。

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```

各要素の説明は次のとおりです。

| 要素                  | 説明                                                  |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | 取り込みタスクを作成するデータベースを指定します。   |
| job_name               | 作成する取り込みタスクの名前を指定します。同じデータベース内に同名のタスクは作成できません。 |
| tbl_name               | データの取り込み先テーブルを指定します。省略可能です。省略すると動的テーブル方式になり、Kafka のデータにテーブル名を含める必要があります。 |
| merge_type             | データのマージ種別です。デフォルトは APPEND です。<p>次の三種類があります。</p><p>- APPEND: 追加して取り込みます。</p><p>- MERGE: マージして取り込みます。</p><p>- DELETE: 取り込んだデータをすべて削除対象として扱います。</p> |
| load_properties        | 取り込み内容を指定する要素で、次の句を含みます。<p>- column_separator 句</p><p>- columns_mapping 句</p><p>- preceding_filter 句</p><p>- where_predicates 句</p><p>- partitions 句</p><p>- delete_on 句</p><p>- order_by 句</p> |
| job_properties         | Routine Load の共通の取り込みパラメータを指定します。      |
| data_source_properties | Kafka データソースのプロパティを指定します。           |
| comment                | 取り込みジョブのコメントを指定します。                    |

### 取り込みパラメータの説明 {#import-parameter-description}

#### FE 設定パラメータ {#fe-configuration-parameters}

| パラメータ | デフォルト値 | 動的変更 | FE Master のみ | 説明 |
| -------- | ------ | -------- | ------------------ | -------- |
| max_routine_load_task_concurrent_num | 256 | はい | はい | Routine Load 取り込みジョブのサブタスク並列度の上限です。デフォルト値を維持することを推奨します。大きすぎる値を設定すると、同時実行タスクが増え、クラスターのリソースを消費する可能性があります。 |
| max_routine_load_task_num_per_be | 1024 | はい | はい | BE ごとに同時実行できる Routine Load タスクの最大数です。`max_routine_load_task_num_per_be` は `routine_load_thread_pool_size` より小さくしてください。 |
| max_routine_load_job_num | 100 | はい | はい | NEED_SCHEDULED、RUNNING、PAUSE 状態のジョブを含む Routine Load ジョブ数の上限です。 |
| max_tolerable_backend_down_num | 0 | はい | はい | BE が一台でも停止すると、Routine Load は自動復旧できません。一定の条件を満たすと、Doris は PAUSED タスクを再スケジュールして RUNNING 状態に切り替えられます。値が 0 の場合、すべての BE ノードが稼働している場合にのみ再スケジュールできます。 |
| period_of_auto_resume_min | 5（分） | はい | はい | Routine Load の自動復旧を試みる間隔です。 |

#### BE 設定パラメータ {#be-configuration-parameters}

| パラメータ | デフォルト値 | 動的変更 | 説明 |
| -------- | ------ | -------- | ---- |
| max_consumer_num_per_group | 3 | はい | 一つのサブタスクが読み取り用に生成できるコンシューマーの最大数です。 |

#### 取り込み設定パラメータ {#import-configuration-parameters}

Routine Load ジョブを作成する際、`CREATE ROUTINE LOAD` コマンドで各要素の取り込み設定パラメータを指定できます。

##### tbl_name 句 {#tbl_name-clause}

取り込み先テーブルの名前を指定します。省略可能です。

省略すると**動的テーブル**方式になり、Kafka のデータにテーブル名を含める必要があります。現在、動的テーブル名は Kafka Value からの抽出にのみ対応しており、データは次の形式に従う必要があります。JSON の場合は `table_name|{"col1": "val1", "col2": "val2"}` です。ここで `tbl_name` はテーブル名、`|` はテーブル名とデータの区切り文字です。CSV 形式も同様で、たとえば `table_name|val1,val2,val3` です。

:::caution 注記
ここでの `table_name` は Doris のテーブル名と完全に一致する必要があります。一致しないと取り込みに失敗します。動的テーブルでは `column_mapping` を使用できません。
:::

##### merge_type 句 {#merge_type-clause}

`merge_type` でデータのマージ種別を指定できます。次の三種類があります。

- **APPEND**: 追加して取り込みます。
- **MERGE**: マージして取り込みます。Unique Key モデルにのみ適用できます。削除フラグ列を示すには `[DELETE ON]` 句も必要です。
- **DELETE**: 取り込んだデータをすべて削除対象として扱います。

##### load_properties 句 {#load_properties-clause}

`load_properties` で取り込むデータのプロパティを指定できます。構文は次のとおりです。

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```

各要素に対応するパラメータは次のとおりです。

| サブ要素            | パラメータ          | 説明                                                  |
| --------------------- | ------------------ | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | `<column_separator>` | 列の区切り文字を指定します。デフォルトは `\t` です。たとえばカンマを指定する場合は `COLUMN TERMINATED BY ","` とします。NULL の扱いは次のとおりです。<p>- NULL 値は `\n` で表します。`a,\n,b` では中央の列が NULL 値です。</p><p>- 空文字列はそのまま空のデータとして設定されます。`a,,b` では中央の列が空文字列（`''`）です。</p> |
| COLUMNS               | `<column_name>`    | 対応する列名を指定します。たとえば取り込み列 `(k1, k2, k3)` を指定する場合は `COLUMNS(k1, k2, k3)` とします。次の場合、COLUMNS 句は省略できます。<p>- CSV の列とテーブルの列が 一対一 で対応する。</p><p>- JSON のキー名とテーブルの列名が一致する。</p> |
| &nbsp;                | `<column_mapping>` | 列マッピングによって、取り込み時に列のフィルタリングや変換ができます。たとえば、対象列 k4 を列 k3 の値に式 k3+1 を適用して計算する場合は `COLUMNS(k1, k2, k3, k4 = k3 + 1)` とします。詳細は [データ変換](../../import/load-data-convert) を参照してください。 |
| WHERE                 | `<where_expr>`     | 条件に基づいて取り込むデータをフィルタリングします。たとえば age > 30 のデータのみを取り込むには `WHERE age > 30` とします。 |
| PARTITION             | `<partition_name>` | 取り込み先テーブルのパーティションを指定します。省略すると、データは対応するパーティションに自動的に取り込まれます。たとえば p1 と p2 に取り込むには `PARTITION(p1, p2)` とします。 |
| DELETE ON             | `<delete_expr>`    | MERGE 取り込みモードで、`delete_expr` により削除対象を指定します。たとえば MERGE 時に age > 30 の行を削除するには `DELETE ON age > 30` とします。 |
| ORDER BY              | `<order_by_column>` | Unique Key モデルでのみ有効です。取り込むデータの Sequence Column を指定して順序を保証します。たとえば `create_time` を指定するには `ORDER BY create_time` とします。詳細は [データ更新 / Sequence Column](../../../data-operate/update/update-of-unique-model) を参照してください。 |

##### job_properties 句 {#job_properties-clause}

Routine Load 取り込みジョブの作成時に、`job_properties` 句でジョブのプロパティを指定できます。構文は次のとおりです。

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

`job_properties` 句のパラメータは次のとおりです。

| パラメータ | 説明 |
| ---- | ---- |
| desired_concurrent_number | <p>デフォルト値: 256</p><p>一つの取り込みタスクに対して希望する並列度です。取り込み時、希望するサブタスク並列度と実際の並列度は一致しない場合があります。実際の並列度は次のように計算します。</p><p>`min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`。各値の意味は次のとおりです。</p><p>- `topic_partition_num`: Kafka トピックのパーティション数。</p><p>- `desired_concurrent_number`: このパラメータの値。</p><p>- `max_routine_load_task_concurrent_num`: FE に設定された Routine Load のタスク並列度の上限。</p> |
| max_batch_interval | 各サブタスクの最大実行時間（秒）です。0 より大きい値を指定します。デフォルトは 60 です。`max_batch_interval`、`max_batch_rows`、`max_batch_size` はサブタスクの終了条件です。いずれかに達するとサブタスクが終了し、新しいサブタスクが生成されます。 |
| max_batch_rows | 各サブタスクが読み取れる最大行数です。200000 以上を指定します。デフォルトは 20000000 です。`max_batch_interval`、`max_batch_rows`、`max_batch_size` はサブタスクの終了条件です。いずれかに達するとサブタスクが終了し、新しいサブタスクが生成されます。 |
| max_batch_size | 各サブタスクが読み取れる最大バイト数です。単位はバイト、範囲は 100 MB～1 GB、デフォルトは 1 GB です。`max_batch_interval`、`max_batch_rows`、`max_batch_size` はサブタスクの終了条件です。いずれかに達するとサブタスクが終了し、新しいサブタスクが生成されます。 |
| max_error_number | サンプリングウィンドウ内で許容するエラー行の最大数です。0 以上を指定します。デフォルトは 0（エラー行を許容しない）です。サンプリングウィンドウは `max_batch_rows * 10` です。ウィンドウ内のエラー行数が `max_error_number` を超えると、Routine Load ジョブは一時停止します。データ品質の問題を手動で確認する必要があります。`ErrorLogUrls` フィールドは [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) コマンドで確認できます。WHERE 条件で除外された行はエラー行に数えません。 |
| strict_mode | 厳密モードを有効にするかどうかを指定します。デフォルトは無効です。厳密モードでは、取り込み時の列型変換を厳密にチェックします。有効にすると、元の値が NULL でないのに型変換後に NULL になった行は除外されます。<p>除外ルール:</p><p>- 厳密モードは派生列（関数による変換で生成した列）に影響しません。</p><p>- 列型の変換が必要な場合、型が不正なデータは除外されます。`ErrorLogUrls` は [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) で確認できます。</p><p>- 範囲制限のある列型では、元データが型変換を通過しても範囲制限を満たさない場合、厳密モードは影響しません。たとえば型が `decimal(1,0)` で元データが 10 の場合、型変換は通過しますが列の宣言範囲には収まりません。詳細は [厳密モード](../../../data-operate/import/handling-messy-data#strict-mode-strict_mode) を参照してください。</p> |
| timezone | 取り込みジョブで使うタイムゾーンを指定します。デフォルトはセッションのタイムゾーンパラメータです。取り込みで使用するすべてのタイムゾーン関連関数の結果に影響します。 |
| format | 取り込むデータの形式を指定します。デフォルトは CSV です。JSON 形式にも対応します。 |
| jsonpaths | データ形式が JSON の場合、`jsonpaths` で JSON データから抽出するフィールドを指定できます。例: `"jsonpaths" = "[\"$.userid\",\"$.username\",\"$.age\",\"$.city\"]"` |
| json_root | データ形式が JSON の場合、`json_root` で JSON データのルートノードを指定できます。Doris は `json_root` で指定したルートノードから要素を抽出して解析します。デフォルトは空です。例: `"json_root" = "$.RECORDS"` |
| strip_outer_array | データ形式が JSON の場合、`strip_outer_array` を true にすると、JSON データを配列として扱い、各要素を一行として処理します。デフォルトは false です。Kafka の JSON データは最外層が `[]` で囲まれた配列であることがよくあります。その場合は `"strip_outer_array" = "true"` を指定できます。たとえば、次のデータは二行に解析されます: `[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism | バッチデータ送信の並列度を設定します。指定値が BE の設定 `max_send_batch_parallelism_per_job` を超える場合、コーディネーターを務める BE は `max_send_batch_parallelism_per_job` の値を使用します。 |
| load_to_single_tablet | タスクのデータを対応するパーティションの一つのタブレットにのみ取り込めるようにします。デフォルトは false です。このパラメータはランダムバケットを使用する OLAP テーブルへの取り込み時にのみ設定できます。 |
| partial_columns | 部分列更新を有効にするかどうかを指定します。デフォルトは false です。テーブルモデルが Unique で、Merge on Write を使用する場合にのみ設定できます。単一ストリームから複数テーブルへの取り込みでは使用できません。詳細は [部分列更新](../../../data-operate/update/partial-column-update.md) を参照してください。 |
| unique_key_update_mode | Unique Key テーブルの更新モードを指定します。選択肢:<ul><li>`UPSERT`（デフォルト）: 行全体の通常の挿入または更新。</li><li>`UPDATE_FIXED_COLUMNS`: 全行で同じ列を更新する部分列更新。`partial_columns=true` と同等です。</li><li>`UPDATE_FLEXIBLE_COLUMNS`: 行ごとに異なる列を更新できる柔軟な部分列更新。JSON 形式が必要で、テーブルで `enable_unique_key_skip_bitmap_column=true` が有効である必要があります。`jsonpaths`、`fuzzy_parse`、`COLUMNS` 句、`WHERE` 句とは併用できません。</li></ul>詳細は [部分列更新](../../../data-operate/update/partial-column-update#flexible-column-update) を参照してください。 |
| partial_update_new_key_behavior | Unique Merge on Write テーブルの部分列更新で新しい行を挿入する場合の処理です。`APPEND` と `ERROR` の二種類があります。<br/>- `APPEND`: 新しい行の挿入を許可します。<br/>- `ERROR`: 新しい行を挿入しようとすると、取り込みが失敗してエラーを報告します。 |
| max_filter_ratio | サンプリングウィンドウ内で許容する最大除外率です。0 以上 1 以下を指定します。デフォルト値は 1.0 で、どのエラー行も許容します。サンプリングウィンドウは `max_batch_rows * 10` です。ウィンドウ内のエラー行数 / 総行数が `max_filter_ratio` を超えると、Routine Load ジョブは一時停止します。データ品質の問題を手動で確認する必要があります。WHERE 条件で除外された行はエラー行に数えません。 |
| enclose | 囲み文字を指定します。CSV のフィールドに行区切りや列区切りが含まれる場合、単一バイトの囲み文字を指定すると、意図しない分割を防げます。たとえば列区切りが `,`、囲み文字が `'` の場合、データ `a,'b,c'` の `b,c` は 一つのフィールドとして解析されます。 |
| escape | エスケープ文字を指定します。フィールド内で囲み文字と同じ文字をエスケープするために使用します。たとえばデータ `a,'b,'c'` の囲み文字が `'` で `b,'c` を 一つのフィールドとして解析するには、単一バイトのエスケープ文字（`\` など）を指定し、データを `a,'b,\'c'` に変更します。 |

#### data_source_properties 句 {#data_source_properties-clause}

`data_source_properties` 句で Kafka データソースのプロパティを指定できます。構文は次のとおりです。

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

`data_source_properties` 句のパラメータは次のとおりです。

| パラメータ | 説明 |
| ---- | ---- |
| kafka_broker_list | Kafka ブローカーへの接続情報を指定します。形式は `<kafka_broker_ip>:<kafka port>` です。複数のブローカーはカンマで区切ります。例: `"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic | 購読する Kafka トピックを指定します。一つの取り込みジョブが読み取れる Kafka トピックは 一つだけです。 |
| kafka_partitions | 購読する Kafka パーティションを指定します。省略すると、デフォルトですべてのパーティションを読み取ります。 |
| kafka_offsets | 読み取る Kafka パーティションの開始オフセットです。時刻を指定すると、その時刻以降の最新のオフセットから読み取ります。0 以上の具体的なオフセット値、または次の形式を指定できます。<p>- `OFFSET_BEGINNING`: データが存在する位置から購読します。</p><p>- `OFFSET_END`: 末尾から購読します。</p><p>- 時刻形式。例: `"2021-05-22 11:00:00"`。</p><p>省略すると、デフォルトではトピックの全パーティションを `OFFSET_END` から購読します。開始オフセットを複数指定する場合はカンマで区切ります。例: `"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"` または `"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`。</p><p>注: 時刻形式と OFFSET 形式は混在できません。</p> |
| property | Kafka シェルの `--property` パラメータと同等の、カスタム Kafka パラメータを指定します。値がファイルの場合は先頭に `FILE:` を付けます。ファイルの作成については [CREATE FILE](../../../sql-manual/sql-statements/security/CREATE-FILE) コマンドを参照してください。対応する他のカスタムパラメータについては、librdkafka 公式ドキュメントのクライアント設定 [CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md) を参照してください。例: `"property.client.id" = "12345"`、`"property.group.id" = "group_id_0"`、`"property.ssl.ca.location" = "FILE:ca.pem"`。 |

`data_source_properties` に Kafka の property パラメータを設定すると、安全なアクセス方法を構成できます。Doris は現在、plaintext（デフォルト）、SSL、PLAIN、Kerberos などの Kafka セキュリティプロトコルに対応しています。

### 取り込み状態 {#import-status}

`SHOW ROUTINE LOAD` コマンドで取り込みジョブの状態を確認できます。

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

結果の例:

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

結果の列について、次の表で説明します。

| 結果の列        | 説明                                                  |
| -------------------- | ------------------------------------------------------------ |
| Id                   | Doris が自動生成したジョブ ID。                |
| Name                 | ジョブ名。                                                |
| CreateTime           | ジョブの作成日時。                                       |
| PauseTime            | ジョブを最後に一時停止した日時。                              |
| EndTime              | ジョブの終了日時。                                            |
| DbName               | 対応するデータベース名。                             |
| TableName            | 対応するテーブル名。複数テーブルのジョブ（動的テーブル）では個別のテーブル名は表示されず、代わりに `multi-table` と表示されます。 |
| IsMultiTable         | 複数テーブルのジョブ（単一ストリーム、複数テーブル）かどうか。 |
| State                | ジョブの実行状態。状態は 5 種類あります。後述の [ジョブの状態遷移](#job-state-machine) を参照してください。 |
| DataSourceType       | データソースの種類: KAFKA。                                 |
| CurrentTaskNum       | 現在のサブタスク数。                              |
| JobProperties        | ジョブ設定の詳細。                                   |
| DataSourceProperties | データソース設定の詳細。                           |
| CustomProperties     | カスタム設定。                                        |
| Statistic            | ジョブの実行状態に関する統計情報。                         |
| Progress             | ジョブの実行進捗。Kafka データソースでは、各パーティションの現在の読み取りオフセットを表示します。たとえば `{"0":"2"}` は Kafka パーティション 0 の読み取り進捗が 2 であることを意味します。 |
| Lag                  | ジョブの遅延状況。Kafka データソースでは、各パーティションの読み取り遅延を表示します。たとえば `{"0":10}` は Kafka パーティション 0 の読み取り遅延が 10 であることを意味します。 |
| ReasonOfStateChanged | ジョブの状態が変わった理由。                         |
| ErrorLogUrls         | 除外された品質の低いデータを確認できる URL。    |
| OtherMsg             | その他のエラー情報。                                     |

### ジョブの状態遷移 {#job-state-machine}

<!-- Knowledge type: State machine -->

Routine Load ジョブには 5 つの状態があります。状態間の遷移は次のとおりです。

| 状態 | 意味 | 契機 | 次に遷移可能な状態 |
| ---- | ---- | -------- | -------------- |
| `NEED_SCHEDULE` | ジョブはスケジュール待ちです。 | `CREATE ROUTINE LOAD` または `RESUME ROUTINE LOAD` の直後の初期状態。 | `RUNNING` |
| `RUNNING` | ジョブは実行中で、Kafka から継続的に読み取っています。 | スケジュールに成功した後。 | `PAUSED` / `STOPPED` |
| `PAUSED` | ジョブは一時停止していますが、終了していません。 | 手動の `PAUSE ROUTINE LOAD`、または例外による自動停止。 | `NEED_SCHEDULE`（手動の `RESUME` または自動復旧）/ `CANCELLED` |
| `STOPPED` | ジョブは停止し、**再開できません**。 | `STOP ROUTINE LOAD`。 | 終端状態。 |
| `CANCELLED` | ジョブは取り消されました。 | データベースやテーブルの削除、その他の例外。 | 終端状態。 |

## 取り込み例 {#import-examples}

<!-- Knowledge type: Procedures + Examples -->

次の表は、このセクションの主な例を用途別にまとめたものです。

| 分類 | シナリオ | 対象となる課題 |
| ---- | ---- | -------- |
| データ品質とフィルタリング | [取り込みエラーの最大許容値を設定する](#set-maximum-import-fault-tolerance) | ダーティデータを許容する必要があるなど、データ品質が安定しない場合。 |
| データ品質とフィルタリング | [取り込み時のフィルター条件を設定する](#set-import-filter-conditions) | 条件を満たすデータのみを取り込む場合。 |
| データ品質とフィルタリング | [厳密モードでの取り込み](#strict-mode-import) | 型変換エラーを厳密に除外する場合。 |
| 読み取り制御 | [指定したオフセットからデータを読み取る](#consume-data-from-a-specified-offset) | Kafka のオフセットを正確に制御する場合。 |
| 読み取り制御 | [Consumer Group の group.id と client.id を指定する](#specify-the-groupid-and-clientid-of-the-consumer-group) | Kafka コンシューマーの識別子をカスタマイズする場合。 |
| データの書き込み制御 | [指定したパーティションにデータを取り込む](#import-data-into-a-specified-partition) | 取り込み先テーブルの特定のパーティションにのみ書き込む場合。 |
| データの書き込み制御 | [取り込みのタイムゾーンを設定する](#set-the-import-timezone) | タイムゾーンをまたぐ時刻フィールドを扱う場合。 |
| データの書き込み制御 | [merge_type を設定する](#set-merge_type) | Unique Key テーブルで削除またはマージを行う場合。 |
| データ変換 | [取り込み時の列マッピングと派生列の計算](#column-mapping-and-derived-column-computation-in-import) | 取り込み時にフィールドを計算する場合。 |
| データ変換 | [囲み文字を使ってデータを取り込む](#import-data-with-enclosing-characters) | CSV のフィールドに区切り文字が含まれる場合。 |
| 複雑な形式 | [JSON 形式の取り込み](#json-format-import) | Kafka のデータが JSON 形式の場合。 |
| 複雑な形式 | [複合型の取り込み](#import-complex-types) | Array、Map、Bitmap、HLL などの型を扱う場合。 |
| セキュリティと複数テーブル | [Kafka セキュリティ認証](#kafka-security-authentication) | SSL、Kerberos、PLAIN などの認証が必要な場合。 |
| セキュリティと複数テーブル | [単一ストリームから複数テーブルへの取り込み](#single-stream-multi-table-import) | 一つのトピックのデータを複数の Doris テーブルに書き込む場合。 |

### 取り込みエラーの最大許容値を設定する {#set-maximum-import-fault-tolerance}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### 指定したオフセットからデータを読み取る {#consume-data-from-a-specified-offset}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### Consumer Group の group.id と client.id を指定する {#specify-the-groupid-and-clientid-of-the-consumer-group}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### 取り込み時のフィルター条件を設定する {#set-import-filter-conditions}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### 指定したパーティションにデータを取り込む {#import-data-into-a-specified-partition}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### 取り込みのタイムゾーンを設定する {#set-the-import-timezone}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### merge_type を設定する {#set-merge_type}

#### merge_type を指定して削除する {#specify-merge_type-to-perform-delete}

1. 取り込みデータのサンプル:

    ```sql
    3,Alexander,22
    5,William,26
    ```

    取り込み前のテーブルのデータ:

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

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### merge_type を指定してマージする {#specify-merge_type-to-perform-merge}

1. 取り込みデータのサンプル:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    取り込み前のテーブルのデータ:

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

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### マージ取り込みで Sequence Column を指定する {#specify-the-sequence-column-for-merge-imports}

1. 取り込みデータのサンプル:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    取り込み前のテーブルのデータ:

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

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### 取り込み時の列マッピングと派生列の計算 {#column-mapping-and-derived-column-computation-in-import}

1. 取り込みデータのサンプル:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### 囲み文字を使ってデータを取り込む {#import-data-with-enclosing-characters}

1. 取り込みデータのサンプル:

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

### JSON 形式の取り込み {#json-format-import}

#### シンプルモードで JSON データを取り込む {#import-json-data-in-simple-mode}

1. 取り込みデータのサンプル:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### マッチモードで複雑な JSON データを取り込む {#import-complex-json-data-in-match-mode}

1. 取り込みデータのサンプル:

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### JSON のルートノードを指定して取り込む {#import-data-with-a-specified-json-root-node}

1. 取り込みデータのサンプル:

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. テーブルのスキーマ:

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### 取り込み時の列マッピングと派生列の計算（JSON） {#column-mapping-and-derived-column-computation-in-import-json}

1. 取り込みデータのサンプル:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### 柔軟な部分列更新 {#flexible-partial-column-update}

この例では、行ごとに異なる列を更新できる柔軟な部分列更新の使用方法を示します。変更レコードに含まれるフィールドが異なる場合があるため、**CDC のシナリオ**で役立ちます。

1. 取り込みデータのサンプル（JSON レコードごとに更新する列が異なります）。

    ```json
    {"id": 1, "balance": 150.00, "last_active": "2024-01-15 10:30:00"}
    {"id": 2, "city": "Shanghai", "age": 28}
    {"id": 3, "name": "Alice", "balance": 500.00, "city": "Beijing"}
    {"id": 1, "age": 30}
    {"id": 4, "__DORIS_DELETE_SIGN__": 1}
    ```

2. テーブルを作成します（Merge-on-Write と skip bitmap 列を有効にする必要があります）。

    ```sql
    CREATE TABLE demo.routine_test_flexible (
        id           INT            NOT NULL  COMMENT "id",
        name         VARCHAR(30)              COMMENT "name",
        age          INT                      COMMENT "age",
        city         VARCHAR(50)              COMMENT "city",
        balance      DECIMAL(10,2)            COMMENT "balance",
        last_active  DATETIME                 COMMENT "last active time"
    )
    UNIQUE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1",
        "enable_unique_key_merge_on_write" = "true",
        "enable_unique_key_skip_bitmap_column" = "true"
    );
    ```

3. 初期データを挿入します。

    ```sql
    INSERT INTO demo.routine_test_flexible VALUES
    (1, 'John', 25, 'Shenzhen', 100.00, '2024-01-01 08:00:00'),
    (2, 'Jane', 30, 'Guangzhou', 200.00, '2024-01-02 09:00:00'),
    (3, 'Bob', 35, 'Hangzhou', 300.00, '2024-01-03 10:00:00'),
    (4, 'Tom', 40, 'Nanjing', 400.00, '2024-01-04 11:00:00');
    ```

4. 取り込みコマンド:

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

5. 取り込み結果:

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

    :::info 注記
    `id=4` の行は `__DORIS_DELETE_SIGN__` により削除されます。各行では、対応する JSON レコードに含まれる列だけが更新されます。
    :::

### 複合型の取り込み {#import-complex-types}

#### Array 型の取り込み {#import-array-data-type}

1. 取り込みデータのサンプル:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### Map 型の取り込み {#import-map-data-type}

1. 取り込みデータのサンプル:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### Bitmap 型の取り込み {#import-bitmap-data-type}

1. 取り込みデータのサンプル:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

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

#### HLL 型の取り込み {#import-hll-data-type}

1. 取り込みデータのサンプル:

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

2. テーブルのスキーマ:

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

3. 取り込みコマンド:

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

4. 取り込み結果:

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
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

### Kafka セキュリティ認証 {#kafka-security-authentication}

Doris は次の Kafka セキュリティプロトコルによるアクセスに対応します。以下に取り込み例とパラメータの説明を示します。

#### SSL 認証を使用した Kafka データの取り込み {#import-kafka-data-with-ssl-authentication}

取り込みコマンドの例:

```sql
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

| パラメータ                         | 説明                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| property.security.protocol        | 使用するセキュリティプロトコルです。上の例では SSL を使用します。 |
| property.ssl.ca.location          | CA（認証局）証明書の場所です。  |
| property.ssl.certificate.location | （Kafka サーバー側でクライアント認証が有効な場合のみ必須）クライアントの公開鍵の場所です。 |
| property.ssl.key.location         | （Kafka サーバー側でクライアント認証が有効な場合のみ必須）クライアントの秘密鍵の場所です。 |
| property.ssl.key.password         | （Kafka サーバー側でクライアント認証が有効な場合のみ必須）クライアントの秘密鍵のパスワードです。 |

#### Kerberos 認証を使用した Kafka データの取り込み {#import-kafka-data-with-kerberos-authentication}

取り込みコマンドの例:

```sql
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

| パラメータ                           | 説明                                         |
| ----------------------------------- | --------------------------------------------------- |
| property.security.protocol          | 使用するセキュリティプロトコルです。上の例では SASL_PLAINTEXT を使用します。 |
| property.sasl.kerberos.service.name | ブローカーのサービス名を指定します。デフォルトは Kafka です。 |
| property.sasl.kerberos.keytab       | keytab ファイルの場所です。                    |
| property.sasl.kerberos.principal    | Kerberos プリンシパルを指定します。                   |

:::tip ヒント
`rdnbs=true` を `krb5.conf` に設定することを推奨します。設定しない場合、`Server kafka/15.5.4.68@EXAMPLE.COM not found in Kerberos database` というエラーが発生することがあります。
:::

#### PLAIN 認証を使用した Kafka クラスターの取り込み {#import-a-kafka-cluster-with-plain-authentication}

取り込みコマンドの例:

```sql
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

| パラメータ                  | 説明                                         |
| -------------------------- | --------------------------------------------------- |
| property.security.protocol | 使用するセキュリティプロトコルです。上の例では SASL_PLAINTEXT を使用します。 |
| property.sasl.mechanism    | SASL 認証メカニズムとして PLAIN を指定します。 |
| property.sasl.username     | SASL ユーザー名です。                                  |
| property.sasl.password     | SASL パスワードです。                                  |

#### 暗号化認証を使用した Kafka サービスへの接続（StreamNative の例） {#connect-to-a-kafka-service-with-encrypted-authentication-streamnative-example}

StreamNative メッセージングサービスへの接続を例に説明します。

```sql
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

:::caution 注記
- BE 側に信頼済み CA 証明書のパスが設定されていない場合は、`"property.enable.ssl.certificate.verification" = "false"` を設定してサーバー証明書の検証を省略します。
- 証明書を検証する場合は、信頼済み CA 証明書のパスを設定します: `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`。
:::

### 単一ストリームから複数テーブルへの取り込み {#single-stream-multi-table-import}

`test1` という名前の Kafka Routine Load 動的複数テーブル取り込みタスクを `example_db` に作成します。`group.id` と `client.id` を指定し、デフォルトですべてのパーティションを自動的に読み取り、データが存在する位置（`OFFSET_BEGINNING`）から購読します。

Kafka から `tbl1` と `tbl2` がある `example_db` にデータを取り込む場合を考えます。`test1` という Routine Load タスクを作成し、Kafka トピック `my_topic` のデータを `tbl1` と `tbl2` の両方に取り込めます。

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

この場合、Kafka のデータにテーブル名を含める必要があります。現在、動的テーブル名は Kafka Value からの抽出にのみ対応しており、データは次の形式に従う必要があります。JSON の場合は `table_name|{"col1": "val1", "col2": "val2"}` です。ここで `tbl_name` はテーブル名、`|` はテーブル名とデータの区切り文字です。CSV 形式も同様で、たとえば `table_name|val1,val2,val3` です。

:::caution 注記
ここでの `table_name` は Doris のテーブル名と完全に一致する必要があります。一致しないと取り込みに失敗します。動的テーブルでは `column_mapping` を使用できません。
:::

### 厳密モードでの取り込み {#strict-mode-import}

`test1` という名前で、`example_tbl` を対象とする Kafka Routine Load タスクを `example_db` に作成し、厳密モードを有効にします。

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

## よくある質問（FAQ） {#frequently-asked-questions-faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Error diagnosis -->

### Routine Load ジョブが自動的に PAUSED 状態になった場合はどうすればよいですか？ {#what-should-i-do-if-a-routine-load-job-automatically-enters-the-paused-state}

通常、データ品質の問題か Kafka 側の例外が原因です。

1. `SHOW ROUTINE LOAD FOR <job_name>` を実行し、`ReasonOfStateChanged` と `ErrorLogUrls` を確認します。
2. ダーティデータが原因の場合は、必要に応じて `max_filter_ratio` と `max_error_number` を増やします。
3. Kafka 側の例外が原因の場合は、ブローカーとトピックにアクセスできることを確認してから、`RESUME ROUTINE LOAD` を実行して復旧します。

### `Offset out of range` または `out of range` エラーにはどう対処しますか？ {#how-to-handle-the-offset-out-of-range-or-out-of-range-error}

通常、記録されたオフセットが Kafka の保持期間を過ぎて削除されたことを意味します。

1. `PAUSE ROUTINE LOAD FOR <job_name>` でジョブを一時停止します。
2. `ALTER ROUTINE LOAD` で `kafka_offsets` を有効な位置（`OFFSET_BEGINNING` や特定のオフセット）に設定し直します。
3. `RESUME ROUTINE LOAD` を実行してジョブを復旧します。

### `Server kafka/xxx@EXAMPLE.COM not found in Kerberos database` エラーにはどう対処しますか？ {#server-kafkaxxxexamplecom-not-found-in-kerberos-database}

Kerberos 認証では、`rdnbs=true` を `krb5.conf` に設定します。

### `Server certificate verification failed` などの SSL エラーにはどう対処しますか？ {#server-certificate-verification-failed-or-other-ssl-errors}

BE 側に信頼済み CA 証明書が設定されていない場合は、`"property.enable.ssl.certificate.verification" = "false"` を設定するか、`"property.ssl.ca.location" = "/path/to/ca-cert.pem"` を明示的に指定します。

### 希望した並列度（`desired_concurrent_number`）が反映されないのはなぜですか？ {#the-desired-concurrency-desired_concurrent_number-does-not-take-effect}

実際の並列度は、次の三つの値の最小値で決まります。

```text
min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)
```

Kafka トピックのパーティション数と FE 設定 `max_routine_load_task_concurrent_num` を確認します。

### 古い Kafka バージョン（< 0.10.0.0）を使用するには？ {#how-to-use-an-older-kafka-version-01000}

BE 設定に `kafka_broker_version_fallback` を指定するか、ジョブ作成時に `property.broker.version.fallback` で対応するバージョンを指定します。

### 単一ストリームから複数テーブルに取り込む際、取り込み先テーブルを指定するには？ {#how-to-specify-the-target-table-for-single-stream-multi-table-import}

Kafka メッセージの Value に `table_name|<data>` の形式でテーブル名を含める必要があり、その名前は Doris のテーブル名と完全に一致させてください。動的テーブルでは `column_mapping` を使用できません。

### 取り込みに失敗したダーティデータを確認するには？ {#how-to-view-the-dirty-data-that-failed-to-import}

`SHOW ROUTINE LOAD FOR <job_name>` を実行し、結果の `ErrorLogUrls` フィールドを確認します。ブラウザーまたは `wget` でその URL にアクセスし、除外されたエラーデータのサンプルとエラーの原因を確認できます。

### Routine Load ジョブを変更する前に一時停止する必要がありますか？ {#must-i-pause-a-routine-load-job-before-modifying-it}

はい。`ALTER ROUTINE LOAD` コマンドを実行するには、ジョブが `PAUSED` 状態である必要があります。変更の手順は、`PAUSE ROUTINE LOAD` → `ALTER ROUTINE LOAD` → `RESUME ROUTINE LOAD` です。

## 関連情報 {#more-help}

- SQL マニュアル: [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- クライアントのコマンドラインで `HELP ROUTINE LOAD` を実行すると、詳しいヘルプが表示されます。
