---
{
  "title": "Postgres/MySQL連続負荷",
  "language": "ja",
  "description": "DorisはStreaming Jobを使用して、MySQL、Postgres等の複数のテーブルからフルデータと増分データをDorisに継続的に同期することができます。"
}
---
## 概要

Job を使用して、MySQL、Postgres などの複数のテーブルからの完全データおよび増分データを Streaming Job 経由で Doris に継続的に同期することをサポートします。Doris へのリアルタイムマルチテーブルデータ同期が必要なシナリオに適しています。

## サポートされているデータソース

- MySQL
- Postgres

## 基本原理

[Flink CDC](https://github.com/apache/flink-cdc) を統合することで、Doris は MySQL、Postgres などからの変更ログの読み取りをサポートし、完全および増分マルチテーブルデータ同期を可能にします。初回同期時、Doris は自動的に下流テーブル（主キーテーブル）を作成し、主キーを上流と一致させます。

**注意事項:**

1. 現在、at-least-once セマンティクスのみが保証されています。
2. 主キーテーブルのみが同期でサポートされています。
3. LOAD 権限が必要です。下流テーブルが存在しない場合は、CREATE 権限も必要です。

## クイックスタート

### 前提条件

#### MySQL
my.cnf に以下を追加して MySQL で Binlog を有効にします:

```ini
log-bin=mysql-bin
binlog_format=ROW
server-id=1
```
#### Postgres
以下をpostgresql.confに追加してPostgresで論理レプリケーションを有効にします：

```ini
wal_level=logical
```
### インポートジョブの作成

#### MySQL

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-j-8.0.31.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"
)
```
#### Postgres

```sql
CREATE JOB test_postgres_job
ON STREAMING
FROM POSTGRES (
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.0.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "include_tables" = "test_tbls",
    "offset" = "latest"
)
TO DATABASE target_test_db (
  "table.create.properties.replication_num" = "1"
)
```
### インポート状況の確認

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
       Id: 1765332859199
       Name: mysql_db_sync
      Definer: root
    ExecuteType: STREAMING
RecurringStrategy: \N
       Status: RUNNING
     ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
     CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
      Comment: 
     Properties: \N
  CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
    EndOffset: \N
  LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
     ErrorMsg: \N
```
### Import ジョブの一時停止

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```
### Resume Import Job

```sql
RESUME JOB where jobName = <job_name> ;
```
### Import Jobの変更

```sql
ALTER JOB <job_name>
FROM MYSQL (
  "user" = "root",
  "password" = "123456"
)
TO DATABASE target_test_db
```
### Import Job の削除

```sql
DROP JOB where jobName = <job_name> ;
```
## リファレンスマニュアル

### Import コマンド

マルチテーブル同期ジョブを作成するための構文:

```sql
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
FROM <MYSQL|POSTGRES> (
  [source_properties]
)
TO DATABASE <target_db> (
  [target_properties]
)
```
| Module               | Description                  |
| ------------------   | --------------------------- |
| job_name             | ジョブ名                    |
| job_properties       | 一般的なインポートパラメータ   |
| comment              | ジョブコメント                 |
| source_properties    | ソース (MySQL/PG) パラメータ|
| target_properties    | Doris ターゲットDBパラメータ  |

### インポートパラメータ

#### FE設定パラメータ

| Parameter                             | Default | Description                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streamingジョブの最大数            |
| job_streaming_task_exec_thread_num     | 10      | StreamingTaskのスレッド数         |
| max_streaming_task_show_count          | 100     | メモリ内のStreamingTaskレコードの最大数|

#### 一般的なジョブインポートパラメータ

| Parameter     | Default | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| max_interval  | 10s     | 新しいデータがない場合のアイドルスケジューリング間隔   |

#### ソース設定パラメータ

| Parameter     | Default | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| jdbc_url      | -       | JDBC接続文字列 (MySQL/PG)           |
| driver_url    | -       | JDBCドライバjarパス                        |
| driver_class  | -       | JDBCドライバクラス名                      |
| user          | -       | データベースユーザー名                           |
| password      | -       | データベースパスワード                           |
| database      | -       | データベース名                               |
| schema        | -       | スキーマ名                                 |
| include_tables| -       | 同期するテーブル、カンマ区切り      |
| offset        | initial | initial: フル + 増分、latest: 増分のみ |
| snapshot_split_size | 8096 | 各分割のサイズ（行数）。フル同期中、テーブルは同期のために複数の分割に分けられます。 |
| snapshot_parallelism | 1 | フル同期フェーズの並列度、すなわち単一タスクが一度にスケジュールできる分割の最大数。 |

#### Doris ターゲットDBパラメータ

| Parameter                       | Default | Description                                 |
| ------------------------------- | ------- | ------------------------------------------- |
| table.create.properties.*       | -       | 作成時のテーブルプロパティ、例：replication_num |
| load.strict_mode | - | 厳密モードを有効にするかどうか。デフォルトでは無効。 |
| load.max_filter_ratio | - | サンプリングウィンドウ内で許可される最大フィルタリング比率。0から1の間（両端を含む）である必要があります。デフォルト値は0で、許容度ゼロを示します。サンプリングウィンドウはmax_interval * 10に等しくなります。このウィンドウ内で、エラー行と総行数の比率がmax_filter_ratioを超えた場合、スケジュールされたジョブは一時停止され、データ品質の問題に対処するために手動介入が必要になります。 |

### インポートステータス

#### Job

ジョブを送信した後、以下のSQLを実行してジョブステータスを確認できます：

```sql
select * from jobs(type=insert) where ExecuteType = "STREAMING"
*************************** 1. row ***************************
               Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-j-8.0.31.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 2
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: {"ts_sec":"0","file":"binlog.000003","pos":"157","kind":"SPECIFIC","gtids":"","row":"0","event":"0"}
    LoadStatistic: {"scannedRows":3,"loadBytes":232,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```
| 結果列 | 説明 |
| ------------------ | ------------------------------------------- |
| ID                 | Job ID                                      |
| NAME               | Job名                                    |
| Definer            | Job定義者                                 |
| ExecuteType        | Jobタイプ: ONE_TIME/RECURRING/STREAMING/MANUAL|
| RecurringStrategy  | 繰り返し戦略、Streamingの場合は空     |
| Status             | Job状態                                  |
| ExecuteSql         | JobのInsert SQL文                  |
| CreateTime         | Job作成時間                           |
| SucceedTaskCount   | 成功したTask数                  |
| FailedTaskCount    | 失敗したTask数                      |
| CanceledTaskCount  | キャンセルされたTask数                    |
| Comment            | Jobコメント                                 |
| Properties         | Jobプロパティ                              |
| CurrentOffset      | 現在のオフセット、StreamingJobのみ     |
| EndOffset          | ソースからの最大終了オフセット、Streamingのみ|
| LoadStatistic      | Job統計                              |
| ErrorMsg           | Jobエラーメッセージ                           |
| JobRuntimeMsg      | Jobランタイム情報                            |

#### Task

各Taskのステータスをチェックするには、以下のSQLを実行できます:

```sql
select * from tasks(type='insert') where jobId='1765336137066'
*************************** 1. row ***************************
       TaskId: 1765336137066
        JobId: 1765332859199
      JobName: mysql_db_sync
        Label: 1765332859199_1765336137066
       Status: SUCCESS
     ErrorMsg: \N
   CreateTime: 2025-12-10 11:09:06
    StartTime: 2025-12-10 11:09:16
   FinishTime: 2025-12-10 11:09:18
  TrackingUrl: \N
LoadStatistic: {"scannedRows":1,"loadBytes":333}
         User: root
FirstErrorMsg: 
RunningOffset: {"endOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9521","kind":"SPECIFIC","row":"1","event":"2","server_id":"1"},"startOffset":{"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","row":"1","splitId":"binlog-split","event":"2","server_id":"1"},"splitId":"binlog-split"}
```
| Result Column      | Description                                 |
| ------------------ | ------------------------------------------- |
| TaskId             | タスクID                                     |
| JobID              | ジョブID                                      |
| JobName            | ジョブ名                                    |
| Label              | タスクラベル                                  |
| Status             | タスクステータス                                 |
| ErrorMsg           | タスクエラーメッセージ                          |
| CreateTime         | タスク作成時刻                          |
| StartTime          | タスク開始時刻                             |
| FinishTime         | タスク終了時刻                            |
| LoadStatistic      | タスク統計                             |
| User               | タスク実行者                               |
| RunningOffset      | 現在のオフセット、Streamingジョブのみ     |
