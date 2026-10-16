---
{
    "title": "partition_statistics",
    "language": "ja",
    "description": "パーティションの統計情報"
}
---

## 概要

パーティションの統計情報

## データベース


`__internal_schema`


## テーブル情報

| 列名               | 型             | 説明                                                 |
| ------------------ | -------------- | ---------------------------------------------------- |
| catalog_id         | varchar(64)    | カタログの ID                                        |
| db_id              | varchar(64)    | データベースの ID                                    |
| tbl_id             | varchar(64)    | テーブルの ID                                        |
| idx_id             | varchar(64)    | インデックスの ID                                    |
| part_name          | varchar(64)    | パーティション名                                     |
| part_id            | bigint         | パーティションの ID                                  |
| col_id             | varchar(64)    | 列の ID。現在は列名を格納します                      |
| count              | bigint         | 行数                                                 |
| ndv                | hll            | 重複しない値の数                                     |
| null_count         | bigint         | NULL の数                                            |
| min                | varchar(65533) | 最小値                                               |
| max                | varchar(65533) | 最大値                                               |
| data_size_in_bytes | bigint         | データサイズ（バイト単位）                           |
| update_time        | datetime       | 現在の統計情報の最終更新日時                         |
