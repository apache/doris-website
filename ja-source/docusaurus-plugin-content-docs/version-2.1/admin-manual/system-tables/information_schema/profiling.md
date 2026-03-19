---
{
  "title": "プロファイリング",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性を維持することのみを目的としています。常に空です。"
}
---
## 概要

このテーブルは、MySQLの動作との互換性を維持することのみを目的としています。常に空です。

## データベース

`information_schema`

## テーブル情報

| Column Name         | タイプ        | 詳細 |
| ------------------- | ----------- | ----------- |
| QUERY_ID            | int         |             |
| SEQ                 | int         |             |
| STATE               | varchar(30) |             |
| DURATION            | double      |             |
| CPU_USER            | double      |             |
| CPU_SYSTEM          | double      |             |
| CONTEXT_VOLUNTARY   | int         |             |
| CONTEXT_INVOLUNTARY | int         |             |
| BLOCK_OPS_IN        | int         |             |
| BLOCK_OPS_OUT       | int         |             |
| MESSAGES_SENT       | int         |             |
| MESSAGES_RECEIVED   | int         |             |
| PAGE_FAULTS_MAJOR   | int         |             |
| PAGE_FAULTS_MINOR   | int         |             |
| SWAPS               | int         |             |
| SOURCE_FUNCTION     | varchar(30) |             |
| SOURCE_FILE         | varchar(20) |             |
| SOURCE_LINE         | int         |             |
