---
{
  "title": "カラム統計 | 内部スキーマ",
  "language": "ja",
  "description": "カラム統計",
  "sidebar_label": "Column Statistics"
}
---
# Column Statistics

## 概要

Column statistics

## データベース

`__internal_schema`

## テーブル情報

| カラム名           | 型             | 説明                                       |
| ------------------ | -------------- | ------------------------------------------ |
| id                 | varchar(4096)  | 一意ID                                     |
| catalog_id         | varchar(64)    | カタログのID                                |
| db_id              | varchar(64)    | DatabaseのID                               |
| tbl_id             | varchar(64)    | tableのID                                  |
| idx_id             | varchar(64)    | IndexのID                                  |
| col_id             | varchar(64)    | カラムのID、現在はカラム名を格納           |
| part_id            | varchar(64)    | パーティションのID、常に空                      |
| count              | bigint         | 行数                                       |
| ndv                | bigint         | 異なる値の数                               |
| null_count         | bigint         | NULLの数                                   |
| min                | varchar(65533) | 最小値                                     |
| max                | varchar(65533) | 最大値                                     |
| data_size_in_bytes | bigint         | データサイズ（バイト）                     |
| update_time        | datetime       | 現在の統計情報の更新時刻                   |
