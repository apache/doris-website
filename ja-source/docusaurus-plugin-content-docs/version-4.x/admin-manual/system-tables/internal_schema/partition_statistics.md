---
{
  "title": "partition_statistics",
  "language": "ja",
  "description": "パーティション統計"
}
---
## 概要

パーティション統計

## データベース


`__internal_schema`


## テーブル情報

| カラム名           | 型             | 説明                                             |
| ------------------ | -------------- | ------------------------------------------------ |
| catalog_id         | varchar(64)    | カタログのID                                      |
| db_id              | varchar(64)    | DatabaseのID                                     |
| tbl_id             | varchar(64)    | tableのID                                        |
| idx_id             | varchar(64)    | IndexのID                                        |
| part_name          | varchar(64)    | パーティションの名前                                  |
| part_id            | bigint         | パーティションのID                                    |
| col_id             | varchar(64)    | カラムのID、現在はカラム名を格納                 |
| count              | bigint         | 行数                                             |
| ndv                | hll            | 個別値の数                                       |
| null_count         | bigint         | NULLの数                                         |
| min                | varchar(65533) | 最小値                                           |
| max                | varchar(65533) | 最大値                                           |
| data_size_in_bytes | bigint         | データサイズ（バイト単位）                       |
| update_time        | datetime       | 現在の統計の最終更新時刻                         |
