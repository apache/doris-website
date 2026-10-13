---
{
    "title": "workload_groups",
    "language": "ja",
    "description": "Workload Group の設定情報を記録します。"
}
---

## 概要

Workload Group の設定情報を記録します。

## データベース


`information_schema`


## テーブル情報

| カラム名                    | 型         | 説明                                                  |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| ID                             | bigint       | Workload Group の ID |
| NAME                           | varchar(256) | Workload Group の名前 |
| CPU_SHARE                      | bigint       | Workload Group の CPU ソフト制限の重み |
| MEMORY_LIMIT                   | varchar(256) | Workload Group のメモリ上限 |
| ENABLE_MEMORY_OVERCOMMIT       | varchar(256) | Workload Group のメモリのソフト制限を有効にするかどうか |
| MAX_CONCURRENCY                | bigint       | Workload Group の最大同時実行数 |
| MAX_QUEUE_SIZE                 | bigint       | Workload Group の最大キューサイズ |
| QUEUE_TIMEOUT                  | bigint       | Workload Group のキュー待機タイムアウト |
| CPU_HARD_LIMIT                 | varchar(256) | Workload Group の CPU ハード制限値 |
| SCAN_THREAD_NUM                | bigint       | ローカルスキャンのスレッド数 |
| MAX_REMOTE_SCAN_THREAD_NUM     | bigint       | リモートスキャンのスレッドプール内の最大スレッド数 |
| MIN_REMOTE_SCAN_THREAD_NUM     | bigint       | リモートスキャンのスレッドプール内の最小スレッド数 |
| SPILL_THRESHOLD_LOW_WATERMARK  | varchar(256) | Workload Group のディスクへのスピルの低水位 |
| SPILL_THRESHOLD_HIGH_WATERMARK | varchar(256) | Workload Group のディスクへのスピルの高水位 |
| TAG                            | varchar(256) | Workload Group のタグ |
| READ_BYTES_PER_SECOND          | bigint       | ローカル読み取りで毎秒スキャンするバイト数 |
| REMOTE_READ_BYTES_PER_SECOND   | bigint       | リモート読み取りで毎秒スキャンするバイト数 |
