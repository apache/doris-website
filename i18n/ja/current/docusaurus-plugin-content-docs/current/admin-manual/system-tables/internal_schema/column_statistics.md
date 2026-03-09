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

## Database

`__internal_schema`

## テーブル情報

| Column Name        | Type           | Description                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| id                 | varchar(4096)  | 一意のID                                         |
| catalog_id         | varchar(64)    | CatalogのID                                      |
| db_id              | varchar(64)    | DatabaseのID                                     |
| tbl_id             | varchar(64)    | TableのID                                        |
| idx_id             | varchar(64)    | IndexのID                                        |
| col_id             | varchar(64)    | カラムのID、現在はカラム名を格納                 |
| part_id            | varchar(64)    | PartitionのID、常に空                            |
| count              | bigint         | 行数                                             |
| ndv                | bigint         | 異なる値の数                                     |
| null_count         | bigint         | NULLの数                                         |
| min                | varchar(65533) | 最小値                                           |
| max                | varchar(65533) | 最大値                                           |
| data_size_in_bytes | bigint         | データサイズ（バイト単位）                       |
| update_time        | datetime       | 現在の統計の更新時刻                             |
