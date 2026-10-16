---
{
    "title": "backend_active_tasks",
    "language": "ja",
    "description": "現在 Backend で実行中の Query タスクまたは Load タスクのリソース使用状況を確認できます。"
}
---

## 概要

現在 Backend で実行中の Query タスクまたは Load タスクのリソース使用状況を確認できます。

## データベース


`information_schema`


## テーブル情報

| カラム名                  | 型           | 説明                                          |
| ------------------------- | ------------ | --------------------------------------------- |
| BE_ID                     | bigint       | タスクを実行している Backend の ID            |
| FE_HOST                   | varchar(256) | タスクを発行した Frontend のアドレス           |
| QUERY_ID                  | varchar(256) | クエリの ID                                   |
| TASK_TIME_MS              | bigint       | タスクの実行時間                              |
| TASK_CPU_TIME_MS          | bigint       | タスクが使用した CPU 時間                     |
| SCAN_ROWS                 | bigint       | スキャンした行数                              |
| SCAN_BYTES                | bigint       | スキャンしたバイト数                          |
| BE_PEAK_MEMORY_BYTES      | bigint       | 最大メモリ使用量                              |
| CURRENT_USED_MEMORY_BYTES | bigint       | 現在のメモリ使用量                            |
| SHUFFLE_SEND_BYTES        | bigint       | シャッフルして送信したバイト数                |
| SHUFFLE_SEND_ROWS         | bigint       | シャッフルして送信した行数                    |
| QUERY_TYPE                | varchar(256) | クエリの種類                                  |
