---
{
  "title": "workload_group_resource_usage",
  "language": "ja",
  "description": "ワークロードグループリソースの使用情報を格納します。"
}
---
## 概要

Workload Groupリソースの使用状況情報を格納します。

## データベース

`information_schema`

## テーブル情報

| カラム名                     | タイプ | 説明                                      |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | BackendのID                               |
| WORKLOAD_GROUP_ID            | bigint | Workload GroupのID                        |
| MEMORY_USAGE_BYTES           | bigint | メモリ使用量（バイト）                    |
| CPU_USAGE_PERCENT            | double | CPU使用率                                 |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | ローカルスキャンのデータレート（バイト/秒） |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | リモートスキャンのデータレート（バイト/秒） |
