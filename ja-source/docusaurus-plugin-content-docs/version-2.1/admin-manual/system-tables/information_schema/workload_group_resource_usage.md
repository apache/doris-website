---
{
  "title": "workload_group_resource_usage",
  "language": "ja",
  "description": "Workload Groupリソースの使用状況情報を格納します。"
}
---
## 概要

Workload Group リソースの使用状況情報を格納します。

## データベース


`information_schema`


## テーブル情報

| カラム名                     | 型     | 説明                                      |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | Backend の ID                             |
| WORKLOAD_GROUP_ID            | bigint | Workload Group の ID                      |
| MEMORY_USAGE_BYTES           | bigint | メモリ使用量（バイト）                    |
| CPU_USAGE_PERCENT            | double | CPU 使用率（パーセント）                  |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | ローカルスキャンデータレート（バイト/秒） |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | リモートスキャンデータレート（バイト/秒） |
