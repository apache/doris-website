---
{
  "title": "backend_active_tasks",
  "language": "ja",
  "description": "現在Backends上で実行中のQueryまたはLoadタスクのリソース使用量を表示します。"
}
---
## 概要

現在Backend上で実行中のQueryまたはLoadタスクのリソース使用状況を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名                  | 型           | 説明                                             |
| ------------------------- | ------------ | ------------------------------------------------ |
| BE_ID                     | bigint       | タスクを実行しているBackendのID                  |
| FE_HOST                   | varchar(256) | タスクを発行したFrontendのアドレス               |
| QUERY_ID                  | varchar(256) | クエリのID                                       |
| TASK_TIME_MS              | bigint       | タスク実行時間                                   |
| TASK_CPU_TIME_MS          | bigint       | タスクが使用したCPU時間                          |
| SCAN_ROWS                 | bigint       | スキャンされた行数                               |
| SCAN_BYTES                | bigint       | スキャンされたバイト数                           |
| BE_PEAK_MEMORY_BYTES      | bigint       | ピークメモリ使用量                               |
| CURRENT_USED_MEMORY_BYTES | bigint       | 現在のメモリ使用量                               |
| SHUFFLE_SEND_BYTES        | bigint       | シャッフルして送信されたバイト数                 |
| SHUFFLE_SEND_ROWS         | bigint       | シャッフルして送信された行数                     |
| QUERY_TYPE                | varchar(256) | クエリの種類                                     |
