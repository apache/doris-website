---
{
  "title": "パーティション",
  "language": "ja",
  "description": "データベース内のすべてのテーブルのパーティション状態を表示する。"
}
---
## 概要

データベース内のすべてのテーブルのパーティションステータスを表示します。

## データベース

`information_schema`

## テーブル情報

| Column Name                   | タイプ          | 詳細                          |
| ----------------------------- | ------------- | ------------------------------------ |
| PARTITION_ID	                | bigint        | Partitinon ID                        |
| TABLE_CATALOG                 | varchar(64)   | カタログ名                         |
| TABLE_SCHEMA                  | varchar(64)   | データベース名                        |
| TABLE_NAME                    | varchar(64)   | テーブル名                           |
| PARTITION_NAME                | varchar(64)   | パーティション名                       |
| SUBPARTITION_NAME             | varchar(64)   | 常に空                         |
| PARTITION_ORDINAL_POSITION    | int           | パーティションの序数位置    |
| SUBPARTITION_ORDINAL_POSITION | int           | 常に空                         |
| PARTITION_METHOD              | varchar(13)   | パーティション方法                     |
| SUBPARTITION_METHOD           | varchar(13)   | 常に空                         |
| PARTITION_EXPRESSION          | varchar(2048) | パーティション式                 |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 常に空                         |
| PARTITION_DESCRIPTION         | text          | パーティションの説明                |
| TABLE_ROWS                    | bigint        |                                      |
| AVG_ROW_LENGTH                | bigint        |                                      |
| DATA_LENGTH                   | bigint        |                                      |
| MAX_DATA_LENGTH               | bigint        |                                      |
| INDEX_LENGTH                  | bigint        |                                      |
| DATA_FREE                     | bigint        |                                      |
| CREATE_TIME                   | bigint        |                                      |
| UPDATE_TIME                   | datetime      |                                      |
| CHECK_TIME                    | datetime      |                                      |
| CHECKSUM                      | bigint        |                                      |
| PARTITION_COMMENT             | text          |                                      |
| NODEGROUP                     | varchar(256)  |                                      |
| TABLESPACE_NAME               | varchar(268)  |                                      |
| LOCAL_DATA_SIZE               | text	        | パーティションローカルデータサイズ            |
| REMOTE_DATA_SIZE              | text          | パーティションリモートデータサイズ（クラウド）   |
| STATE                         | text	        | パーティションステータス                      |
| REPLICA_ALLOCATION  	        | text	        | tabletのレプリカの分散 |
| REPLICA_NUM                   | int 	        | レプリカ数                         |
| STORAGE_POLICY                | text          | ストレージポリシー                       |
| STORAGE_MEDIUM                | text          | ストレージメディア                       |
| COOLDOWN_TIME_MS              | text          | クールダウン時間                        |
| LAST_CONSISTENCY_CHECK_TIME   | text          | 最後の整合性チェック時間          |
| BUCKET_NUM                    | int           | パーティションバケット数                 |
| COMMITTED_VERSION             | bigint        | 最後のコミットバージョン                |
| VISIBLE_VERSION               | bigint        | 現在の可視バージョン              |
| PARTITION_KEY                 | text          | パーティションキー                        |
| RANGE                         | text          | パーティション範囲（最小最大値）       |
| DISTRIBUTION                  | text          | 分散タイプ                    |
