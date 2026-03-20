---
{
  "title": "routine_load_job",
  "language": "ja",
  "description": "定期ロードジョブに関する情報を表示するために使用されます。"
}
---
## 概要

routine load ジョブに関する情報を表示するために使用されます。

## データベース

`information_schema`

## テーブル情報

| カラム名                | 型        | 説明                                       |
| :-------------------- | :-------- | :----------------------------------------- |
| JOB_ID                | text      | ジョブID                                   |
| JOB_NAME              | text      | ジョブ名                                   |
| CREATE_TIME           | text      | ジョブ作成時刻                             |
| PAUSE_TIME            | text      | ジョブ一時停止時刻                         |
| END_TIME              | text      | ジョブ終了時刻                             |
| DB_NAME               | text      | データベース名                             |
| TABLE_NAME            | text      | テーブル名                                 |
| STATE                 | text      | ジョブ状態                                 |
| CURRENT_TASK_NUM      | text      | 現在のサブタスク数                         |
| JOB_PROPERTIES        | text      | ジョブプロパティ設定                       |
| DATA_SOURCE_PROPERTIES| text      | データソースプロパティ設定                 |
| CUSTOM_PROPERTIES     | text      | カスタムプロパティ設定                     |
| STATISTIC            | text      | ジョブ統計情報                             |
| PROGRESS             | text      | ジョブ進行状況情報                         |
| LAG                  | text      | ジョブ遅延情報                             |
| REASON_OF_STATE_CHANGED| text     | ジョブ状態変更の理由                       |
| ERROR_LOG_URLS       | text      | エラーログURL                              |
| USER_NAME            | text      | ユーザー名                                 |
| CURRENT_ABORT_TASK_NUM| int       | 現在の失敗タスク数                         |
| IS_ABNORMAL_PAUSE    | boolean   | システムによる一時停止かどうか（ユーザー以外による一時停止） |
