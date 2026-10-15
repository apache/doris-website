---
{
    "title": "routine_load_job",
    "language": "ja",
    "description": "Routine Load ジョブの情報を確認するためのテーブルです。"
}
---

## 概要

Routine Load ジョブの情報を確認するためのテーブルです。

## データベースとテーブル

`information_schema.routine_load_jobs`

## テーブル情報

| カラム名 | 型 | 説明 | 例 |
| :--- | :--- | :--- | :--- |
| JOB_ID | text | Doris が生成したジョブ ID。 | `12025` |
| JOB_NAME | text | Routine Load ジョブの名前。 | `example_routine_load` |
| CREATE_TIME | text | ジョブの作成時刻。 | `2024-01-15 08:12:42` |
| PAUSE_TIME | text | ジョブが最後に一時停止した時刻。一時停止したことがない場合は `NULL`。 | `NULL` |
| END_TIME | text | ジョブの終了時刻。終了していない場合は `NULL`。 | `NULL` |
| DB_NAME | text | ジョブのデータベース名。 | `default_cluster:testdb` |
| TABLE_NAME | text | ジョブのロード先テーブル名。複数テーブルへのインポートジョブでは `multi-table`。 | `test_routineload_tbl` |
| STATE | text | ジョブの実行状態。`NEED_SCHEDULE`、`RUNNING`、`PAUSED`、`STOPPED`、`CANCELLED` のいずれか。 | `RUNNING` |
| CURRENT_TASK_NUM | text | 現在スケジュール中または実行中のサブタスク数。 | `1` |
| JOB_PROPERTIES | text | バッチサイズ、並行度、インポート形式、カラムマッピング、エラー許容範囲などのジョブ設定。 | `{"max_batch_rows":"200000","format":"csv","columnToColumnExpr":"user_id,name,age","max_filter_ratio":"1.0"}` |
| DATA_SOURCE_PROPERTIES | text | データソースの設定。Kafka の場合はトピック、ブローカー一覧、現在の Kafka パーティションなどを含みます。 | `{"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}` |
| CUSTOM_PROPERTIES | text | ジョブ作成時に設定したカスタムプロパティ。Kafka の場合は通常、オフセット、グループ ID、`property.` プレフィックス付きで渡した Kafka クライアントパラメータなどを含みます。バージョン 4.0.8 以降、機密性の高いプロパティは `******` と表示されます。 | `{"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}` |
| STATISTIC | text | ジョブの実行時統計情報。主なフィールドには `receivedBytes`、`loadedRows`、`errorRows`、`committedTaskNum`、`abortedTaskNum`、`loadRowsRate`、`taskExecuteTimeMs` があります。 | `{"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}` |
| PROGRESS | text | ジョブの実行進捗。Kafka の場合は各パーティションで消費済みのオフセットを示します。 | `{"0":"2"}` |
| LAG | text | ジョブの遅延情報。Kafka の場合は各パーティションの消費遅延を示します。 | `{"0":0}` |
| REASON_OF_STATE_CHANGED | text | ジョブの状態が変わった理由。通常の実行中は空で、ジョブが異常に一時停止またはキャンセルされた場合は具体的な理由を記録します。 | `The number of failed task exceeded max_error_number` |
| ERROR_LOG_URLS | text | 品質チェックで不合格となり、除外されたデータを確認するためのエラーログ URL。エラーログがない場合は空です。 | `http://fe_host:8030/api/_load_error_log?file=error.log` |
| USER_NAME | text | ジョブを作成または操作したユーザー。 | `root` |
| CURRENT_ABORT_TASK_NUM | int | 現在の失敗したサブタスク数。 | `0` |
| IS_ABNORMAL_PAUSE | boolean | ユーザーによる手動操作ではなく、システムによってジョブが異常に一時停止されたかどうか。`true` はシステムによる異常な一時停止を、`false` は異常な一時停止がないことを示します。 | `false` |
| COMPUTE_GROUP | text | ジョブを実行するコンピュートグループ。 | `default_compute_group` |
| FIRST_ERROR_MSG | text | ジョブで最初に発生したエラーメッセージ。根本原因の調査に役立ちます。エラーがない場合は空です。 | `too many filtered rows` |

## データの取得元と完全性

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Multi-FE cluster troubleshooting / Empty error messages -->

`FIRST_ERROR_MSG` と `ERROR_LOG_URLS` は、マスター FE のメモリ内でのみ保持される一時的な実行時フィールドです。フォロワー FE はメタデータの再生時にこれらの値を設定しません。

:::caution 動作の変更（4.0.8）

バージョン 4.0.8 以降、`information_schema.routine_load_jobs` のスキャンはマスター FE にルーティングされます。そのため、どの FE からクエリしても、完全な `FIRST_ERROR_MSG` と `ERROR_LOG_URLS` の値が返されます。

4.0.8 より前は、クエリを受け付けた FE がこのテーブルの結果を返していました。そのため、マスター以外の FE ではこれら二つのカラムが空になり、マスターに転送される `SHOW ROUTINE LOAD` の結果と一致しませんでした。

このルーティングはセッション変数 `enable_schema_scan_from_master_fe` で制御され、デフォルト値は `true` です。

:::

## 異常なジョブの検索

ジョブが異常に一時停止している場合、失敗したタスクがある場合、または `RUNNING` 状態でも実行中のサブタスクがなく、Kafka に消費遅延が残っている場合は、調査が必要です。次の SQL で該当するジョブを検索できます。

```sql
SELECT DB_NAME, JOB_NAME
FROM information_schema.routine_load_jobs
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

異常なジョブが見つかったら、該当するデータベースに切り替え、`SHOW ROUTINE LOAD` でジョブの詳細を確認します。

```sql
USE `db_name`;
SHOW ROUTINE LOAD FOR `job_name`;
```

`LAG` は Kafka の各パーティションの消費遅延情報です。`LAG REGEXP ':[[:space:]]*[1-9][0-9]*'` は、少なくとも一つのパーティションで遅延が 0 より大きいジョブに一致します。
