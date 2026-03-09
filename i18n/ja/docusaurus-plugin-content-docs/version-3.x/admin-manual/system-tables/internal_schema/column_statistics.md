---
{
  "title": "column_statistics | 内部スキーマ",
  "language": "ja",
  "description": "カラム統計",
  "sidebar_label": "column_statistics"
}
---
# column_statistics

## 概要

カラム統計情報

## データベース

`__internal_schema`

## テーブル情報

| カラム名           | 型             | 説明                                           |
| ------------------ | -------------- | ---------------------------------------------- |
| id                 | varchar(4096)  | 一意ID                                         |
| catalog_id         | varchar(64)    | Catalogの ID                                   |
| db_id              | varchar(64)    | Databaseの ID                                  |
| tbl_id             | varchar(64)    | Tableの ID                                     |
| idx_id             | varchar(64)    | Indexの ID                                     |
| col_id             | varchar(64)    | カラムのID、現在はカラム名を格納               |
| part_id            | varchar(64)    | Partitionの ID、常に空                         |
| count              | bigint         | 行数                                           |
| ndv                | bigint         | 個別値数                                       |
| null_count         | bigint         | NULL の数                                      |
| min                | varchar(65533) | 最小値                                         |
| max                | varchar(65533) | 最大値                                         |
| data_size_in_bytes | bigint         | データサイズ（バイト単位）                     |
| update_time        | datetime       | 現在の統計情報の更新時刻                       |
