---
{
  "title": "table_options",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のためにのみ使用されます。常に空です。"
}
---
## 概要

このテーブルはMySQLの動作との互換性のためにのみ使用されます。常に空です。

## データベース


`information_schema`


## テーブル情報

| カラム名        | 型          | 説明        |
| --------------- | ----------- | ----------- |
| TABLE_CATALOG   | varchar(64) |             |
| TABLE_SCHEMA    | varchar(64) |             |
| TABLE_NAME      | varchar(64) |             |
| TABLE_MODEL     | text        |             |
| TABLE_MODEL_KEY | text        |             |
| DISTRIBUTE_KEY  | text        |             |
| DISTRIBUTE_TYPE | text        |             |
| BUCKETS_NUM     | int         |             |
| PARTITION_NUM   | int         |             |
