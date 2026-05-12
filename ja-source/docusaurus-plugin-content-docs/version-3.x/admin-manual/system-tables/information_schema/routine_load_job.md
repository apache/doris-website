---
{
  "title": "routine_load_job",
  "language": "ja",
  "description": "ルーチンロードジョブに関する情報を表示するために使用されます。"
}
---
## 概要

routine load ジョブの情報を表示するために使用されます。

## データベースとテーブル

`information_schema.routine_load_job`

## テーブル情報

| カラム名                 | 型      | 説明                                                                                                                                                    | 例 |
| :----------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-- |
| JOB_ID                   | text    | Doris によって自動生成されるジョブ ID。                                                                                                                 | `12025` |
| JOB_NAME                 | text    | Routine Load ジョブ名。                                                                                                                                 | `example_routine_load` |
| CREATE_TIME              | text    | ジョブ作成時刻。                                                                                                                                        | `2024-01-15 08:12:42` |
| PAUSE_TIME               | text    | 直近のジョブ一時停止時刻。ジョブが一時停止されていない場合は `NULL`。                                                                                   | `NULL` |
| END_TIME                 | text    | ジョブ終了時刻。ジョブが終了していない場合は `NULL`。                                                                                                   | `NULL` |
| DB_NAME                  | text    | ジョブが属するデータベース名。                                                                                                                          | `default_cluster:testdb` |
| TABLE_NAME               | text    | ジョブのインポート先テーブル名。マルチテーブルインポートの場合は `multi-table` と表示されます。                                                         | `test_routineload_tbl` |
| STATE                    | text    | ジョブ実行状態。`NEED_SCHEDULE`、`RUNNING`、`PAUSED`、`STOPPED`、`CANCELLED` があります。                                                               | `RUNNING` |
| CURRENT_TASK_NUM         | text    | 現在スケジュール中または実行中のサブタスク数。                                                                                                          | `1` |
| JOB_PROPERTIES           | text    | ジョブプロパティ設定。バッチサイズ、並行数、インポート形式、カラムマッピング、エラー許容設定などを含みます。                                            | `{"max_batch_rows":"200000","format":"csv","columnToColumnExpr":"user_id,name,age","max_filter_ratio":"1.0"}` |
| DATA_SOURCE_PROPERTIES   | text    | データソースプロパティ設定。Kafka の場合、topic、broker リスト、現在の Kafka パーティションなどを含みます。                                             | `{"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}` |
| CUSTOM_PROPERTIES        | text    | ジョブ作成時に設定されたカスタムプロパティ。Kafka の場合、通常は offset、group id、および `property.` プレフィックスで渡された Kafka クライアントパラメータを含みます。 | `{"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}` |
| STATISTIC                | text    | ジョブ実行統計情報。よく使われるフィールドには `receivedBytes`、`loadedRows`、`errorRows`、`committedTaskNum`、`abortedTaskNum`、`loadRowsRate`、`taskExecuteTimeMs` などがあります。 | `{"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}` |
| PROGRESS                 | text    | ジョブ実行進捗。Kafka の場合、各パーティションの現在の消費済み offset を表示します。                                                                     | `{"0":"2"}` |
| LAG                      | text    | ジョブ遅延情報。Kafka の場合、各パーティションの消費ラグを表示します。                                                                                  | `{"0":0}` |
| REASON_OF_STATE_CHANGED  | text    | ジョブ状態変更の理由。正常実行中は通常空で、異常一時停止またはキャンセル時に具体的な理由が記録されます。                                                | `The number of failed task exceeded max_error_number` |
| ERROR_LOG_URLS           | text    | 品質チェックでフィルタされた不正データを確認するためのエラーログ URL。エラーログがない場合は空です。                                                    | `http://fe_host:8030/api/_load_error_log?file=error.log` |
| USER_NAME                | text    | ジョブを作成または操作したユーザー。                                                                                                                    | `root` |
| CURRENT_ABORT_TASK_NUM   | int     | 現在の失敗サブタスク数。                                                                                                                                | `0` |
| IS_ABNORMAL_PAUSE        | boolean | ユーザーの手動操作ではなく、システムによって異常一時停止されたかどうか。`true` はシステムによる異常一時停止、`false` は異常一時停止なしを表します。        | `false` |

## 異常ジョブの確認

ジョブが異常一時停止している、失敗タスクが存在する、または `RUNNING` 状態だが実行中のサブタスクがなく Kafka に消費ラグが残っている場合は、追加調査が必要な異常ジョブとみなせます。以下の SQL でこれらのジョブを確認できます。

```sql
SELECT DB_NAME, JOB_NAME
FROM information_schema.routine_load_job
WHERE IS_ABNORMAL_PAUSE = TRUE
   OR (
        STATE = 'RUNNING'
        AND (
             CURRENT_ABORT_TASK_NUM > 0
             OR (
                  CAST(CURRENT_TASK_NUM AS INT) = 0
                  AND `LAG` REGEXP ':[[:space:]]*[1-9][0-9]*'
             )
        )
   );
```

異常ジョブが見つかったら、対応するデータベースに切り替え、`SHOW ROUTINE LOAD` でジョブ詳細を確認します。

```sql
USE `db_name`;
SHOW ROUTINE LOAD FOR `job_name`;
```

`LAG` は Kafka の各パーティションの消費ラグ情報です。`LAG REGEXP ':[[:space:]]*[1-9][0-9]*'` は、少なくとも 1 つのパーティションに 0 より大きいラグがあるジョブにマッチします。
