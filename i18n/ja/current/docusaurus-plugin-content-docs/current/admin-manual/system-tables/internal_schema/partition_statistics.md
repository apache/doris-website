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

| カラム名           | 型             | 説明                                        |
| ------------------ | -------------- | ------------------------------------------- |
| catalog_id         | varchar(64)    | Catalogの ID                                |
| db_id              | varchar(64)    | Databaseの ID                               |
| tbl_id             | varchar(64)    | Tableの ID                                  |
| idx_id             | varchar(64)    | Indexの ID                                  |
| part_name          | varchar(64)    | Partitionの名前                             |
| part_id            | bigint         | Partitionの ID                              |
| col_id             | varchar(64)    | カラムの ID、現在はカラム名を格納           |
| count              | bigint         | 行数                                        |
| ndv                | hll            | 個別値の数                                  |
| null_count         | bigint         | NULLの数                                    |
| min                | varchar(65533) | 最小値                                      |
| max                | varchar(65533) | 最大値                                      |
| data_size_in_bytes | bigint         | データサイズ（バイト）                      |
| update_time        | datetime       | 現在の統計の最終更新時刻                    |
