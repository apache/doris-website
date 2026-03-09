---
{
  "title": "パーティション",
  "language": "ja",
  "description": "データベース内のすべてのテーブルのPartitionステータスを表示します。2.1.7以前（2.1.7を含む）では、テーブルは常に空でした。"
}
---
## 概要

データベース内のすべてのテーブルのPartitionステータスを表示します。2.1.7（含む）より前では、テーブルは常に空でした。

## データベース

`information_schema`

## テーブル情報

| カラム名                      | 型            | 説明                           |
| ----------------------------- | ------------- | --------------------------------- |
| TABLE_CATALOG                 | varchar(64)   | カタログ名                      |
| TABLE_SCHEMA                  | varchar(64)   | データベース名                     |
| TABLE_NAME                    | varchar(64)   | テーブル名                        |
| PARTITION_NAME                | varchar(64)   | パーティション名                    |
| SUBPARTITION_NAME             | varchar(64)   | 常に空                      |
| PARTITION_ORDINAL_POSITION    | int           | パーティションの序数位置 |
| SUBPARTITION_ORDINAL_POSITION | int           | 常に空                      |
| PARTITION_METHOD              | varchar(13)   | パーティション方式                  |
| SUBPARTITION_METHOD           | varchar(13)   | 常に空                      |
| PARTITION_EXPRESSION          | varchar(2048) | パーティション式              |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 常に空                      |
| PARTITION_DESCRIPTION         | text          | パーティション説明             |
| TABLE_ROWS                    | bigint        |                                   |
| AVG_ROW_LENGTH                | bigint        |                                   |
| DATA_LENGTH                   | bigint        |                                   |
| MAX_DATA_LENGTH               | bigint        |                                   |
| INDEX_LENGTH                  | bigint        |                                   |
| DATA_FREE                     | bigint        |                                   |
| CREATE_TIME                   | bigint        |                                   |
| UPDATE_TIME                   | datetime      |                                   |
| CHECK_TIME                    | datetime      |                                   |
| CHECKSUM                      | bigint        |                                   |
| PARTITION_COMMENT             | text          |                                   |
| NODEGROUP                     | varchar(256)  |                                   |
| TABLESPACE_NAME               | varchar(268)  |                                   |
