---
{
  "title": "TVF連続負荷",
  "language": "ja",
  "description": "DorisではJob + TVFアプローチを使用して継続的なインポートタスクを作成できます。Jobを送信後、Dorisは継続的にインポートジョブを実行します、"
}
---
## 概要

DorisではJob + TVFアプローチを使用して継続的なインポートタスクを作成できます。Jobを送信した後、Dorisは継続的にインポートジョブを実行し、リアルタイムでTVFにクエリを実行してデータをDorisテーブルに書き込みます。

## サポートされているTVF

[S3](../../../sql-manual/sql-functions/table-valued-functions/s3.md) TVF

## 基本原理

### S3

S3の指定されたディレクトリ内のファイルを反復処理し、各ファイルをリストに分割して小さなバッチでDorisテーブルに書き込みます。

**増分読み取り方法**

タスクを作成した後、Dorisは指定されたパスから継続的にデータを読み取り、固定の頻度で新しいファイルをポーリングします。

注意：新しいファイルの名前は、最後にインポートされたファイルの名前よりも辞書順で大きくなければなりません。そうでなければ、Dorisはそれを新しいファイルとして扱いません。例えば、ファイルがfile1、file2、file3という名前の場合、それらは順次インポートされます。後でfile0という名前の新しいファイルが追加された場合、最後にインポートされたファイルfile3よりも辞書順で小さいため、Dorisはそれをインポートしません。

## クイックスタート

### インポートジョブの作成

S3ディレクトリでCSVで終わるファイルが定期的に生成されると仮定します。その後、Jobを作成できます。

```SQL
CREATE JOB my_job 
ON STREAMING
DO 
INSERT INTO db1.tbl1 
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "<format>"
)
```
### インポート状況を確認する

```SQL
select * from job(type=insert) where ExecuteType = "streaming"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: \N
       Properties: \N
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         ErrorMsg: \N
    JobRuntimeMsg: \N
```
### インポートジョブを一時停止

```SQL
PAUSE JOB WHERE jobname = <job_name> ;
```
### インポートジョブの再開

```SQL
RESUME JOB where jobName = <job_name> ;
```
### import ジョブの変更

```SQL
-- -- Supports modifying Job properties and insert statements
Alter Job jobName
PROPERTIES(
   "session.insert_max_filter_ratio"="0.5" 
)
INSERT INTO db1.tbl1 
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "<format>"
)
```
### インポートされたジョブを削除

```SQL
DROP JOB where jobName = <job_name> ;
```
## リファレンス

### Importコマンド

Job + TVF常駐インポートジョブを作成する構文は以下の通りです：

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```
モジュールの説明は以下の通りです：

| モジュール | 説明 |

| -------------- | ------------------------------------------------------------ |
| job_name | タスク名 |
| job_properties | Jobを指定するために使用される一般的なインポートパラメータ |
| comment | Jobを説明するために使用される備考 |
| Insert_Command | 実行するSQL；現在はInsert into table select * from s3()のみサポート |

### インポートパラメータ

#### FE設定パラメータ

| パラメータ | デフォルト値 | |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num | 1024 | Streamingジョブの最大数 |
| job_streaming_task_exec_thread_num | 10 | StreamingTasksの実行に使用されるスレッド数 |
| max_streaming_task_show_count | 100 | StreamingTaskのメモリに保持されるタスク実行記録の最大数 |

#### インポート設定パラメータ

| パラメータ | デフォルト値 | 説明 |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.* | None | job_propertiesでのすべてのsession変数の設定をサポート。インポート変数については、[Insert Into Select](../../../data-operate/import/import-way/insert-into-manual.md#Import Configuration Parameters)を参照してください |
| s3.max_batch_files | 256 | ファイルの累積数がこの値に達したときにインポート書き込みをトリガーします。 |
| s3.max_batch_bytes | 10G | 累積データ量がこの値に達したときにインポート書き込みをトリガーします。 |
| max_interval | 10s | 上流で新しいファイルやデータの追加がない場合のアイドルスケジューリング間隔。 |

### インポートステータス

#### Job

ジョブが正常に送信された後、**select \* from job("insert") where ExecuteType = 'Streaming'**を実行してジョブの現在のステータスを確認できます。

```SQL
select * from job(type=insert) where ExecuteType = "streaming"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://wd-test123/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 5
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: {"s3.max_batch_files":"2","session.insert_max_filter_ratio":"0.5"}
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":0,"loadBytes":0,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```
特定のパラメータ結果は以下のように表示されます:

| Result Columns | Description |
| ----------------- | ------------------------------------------------------------ |
| ID | Job ID |
| NAME | Job Name |
| Definer | Job Definer |
| ExecuteType | Jobスケジュールタイプ: *ONE_TIME/RECURRING/STREAMING/MANUAL* |
| RecurringStrategy | 繰り返し戦略。通常のInsert操作で使用され、ExecuteType=Streamingの場合は空 |
| Status | Jobステータス |
| ExecuteSql | JobのInsert SQL文 |
| CreateTime | Job作成時刻 |
| SucceedTaskCount | 成功したタスク数 |
| FailedTaskCount | 失敗したタスク数 |
| CanceledTaskCount | キャンセルされたタスク数 |
| Comment | Jobコメント |
| Properties | Jobプロパティ |
| CurrentOffset | Jobの現在の完了オフセット。`ExecuteType=Streaming`の場合のみ値を持つ。 |
| EndOffset | Jobがデータソースから取得した最大EndOffset。`ExecuteType=Streaming`の場合のみ値を持つ。 |
| LoadStatistic | Job統計情報。 |
| ErrorMsg | Job実行中のエラーメッセージ。 |
| JobRuntimeMsg | Jobの一部のランタイム情報。

#### Task

`select \* from tasks(type='insert') where jobId='1758534452459'`を実行して、各Taskの実行ステータスを確認できます。

注意: 最新のTask情報のみが保持されます。

```SQL
mysql> select * from tasks(type='insert') where jobId='1758534452459'\G
*************************** 1. row ***************************
       TaskId: 1758534723330
        JobId: 1758534452459
      JobName: test_streaming_insert_job_name
        Label: 1758534452459_1758534723330
       Status: SUCCESS
     ErrorMsg: \N
   CreateTime: 2025-09-22 17:52:55
    StartTime: \N
   FinishTime: \N
  TrackingUrl: \N
LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         User: root
FirstErrorMsg: \N
RunningOffset: {"startFileName":"s3/demo/1.csv","endFileName":"s3/demo/8.csv"}
```
| 結果列 | 説明 |
| ------------- | ---------------------------------------------------- |
| TaskId | Task ID |
| JobID | JobID |
| JobName | Job名 |
| Label | InsertのLabel |
| Status | Taskのステータス |
| ErrorMsg | Task失敗情報 |
| CreateTime | Task作成時刻 |
| StartTime | Task開始時刻 |
| FinishTime | Task完了時刻 |
| TrackingUrl | InsertのエラーURL |
| LoadStatistic | Task統計情報 |
| User | Taskの実行者 |
| FirstErrorMsg | 通常のInsertTaskにおける最初のデータ品質エラーに関する情報 |
| RunningOffset | 現在のTask同期のオフセット情報。Job.ExecuteType=Streamingの場合のみ値を持つ |
