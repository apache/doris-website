---
{
  "title": "workload_groups",
  "language": "ja",
  "description": "Workload Groupsの設定情報を記録します。"
}
---
## 概要

Workload Groupの設定情報を記録します。

## データベース

`information_schema`

## テーブル情報

| カラム名                       | 型           | 説明                                                         |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| ID                             | bigint       | Workload GroupのID                                           |
| NAME                           | varchar(256) | Workload Groupの名前                                         |
| CPU_SHARE                      | bigint       | Workload GroupのCPUソフト制限重み                            |
| MEMORY_LIMIT                   | varchar(256) | Workload Groupのメモリ制限                                   |
| ENABLE_MEMORY_OVERCOMMIT       | varchar(256) | Workload Groupのメモリソフト制限を有効にするかどうか         |
| MAX_CONCURRENCY                | bigint       | Workload Groupの最大同時実行数                               |
| MAX_QUEUE_SIZE                 | bigint       | Workload Groupの最大キューサイズ                             |
| QUEUE_TIMEOUT                  | bigint       | Workload Groupのキュータイムアウト                           |
| CPU_HARD_LIMIT                 | varchar(256) | Workload GroupのCPUハード制限サイズ                          |
| SCAN_THREAD_NUM                | bigint       | ローカルスキャンのスレッド数                                 |
| MAX_REMOTE_SCAN_THREAD_NUM     | bigint       | リモートスキャンスレッドプールの最大スレッド数               |
| MIN_REMOTE_SCAN_THREAD_NUM     | bigint       | リモートスキャンスレッドプールの最小スレッド数               |
| SPILL_THRESHOLD_LOW_WATERMARK  | varchar(256) | Workload Groupのディスクスピル低水位閾値                     |
| SPILL_THRESHOLD_HIGH_WATERMARK | varchar(256) | Workload Groupのディスクスピル高水位閾値                     |
| TAG                            | varchar(256) | Workload Groupのタグ                                         |
| READ_BYTES_PER_SECOND          | bigint       | ローカル読み取りで1秒あたりにスキャンされるバイト数          |
| REMOTE_READ_BYTES_PER_SECOND   | bigint       | リモート読み取りで1秒あたりにスキャンされるバイト数          |
