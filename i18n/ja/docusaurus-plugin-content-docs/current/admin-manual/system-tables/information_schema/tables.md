---
{
    "title": "tables",
    "language": "ja",
    "description": "すべてのテーブル情報を格納します。"
}
---

## 概要

すべてのテーブル情報を格納します。

## データベース


`information_schema`


## テーブル情報

| カラム名        | 型            | 説明                                                         |
| --------------- | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | テーブルが属するカタログ                                     |
| TABLE_SCHEMA    | varchar(64)   | テーブルが属するデータベース                                 |
| TABLE_NAME      | varchar(64)   | テーブル名                                                   |
| TABLE_TYPE      | varchar(64)   | テーブルの種類。SYSTEM VIEW、VIEW、BASE TABLE のいずれか    |
| ENGINE          | varchar(64)   | テーブルのストレージエンジンの種類                           |
| VERSION         | bigint        | 無効な値                                                     |
| ROW_FORMAT      | varchar(10)   | 無効な値                                                     |
| TABLE_ROWS      | bigint        | テーブルの推定行数                                           |
| AVG_ROW_LENGTH  | bigint        | テーブルの平均行サイズ                                       |
| DATA_LENGTH     | bigint        | テーブルの推定サイズ                                         |
| MAX_DATA_LENGTH | bigint        | 無効な値                                                     |
| INDEX_LENGTH    | bigint        | 無効な値                                                     |
| DATA_FREE       | bigint        | 無効な値                                                     |
| AUTO_INCREMENT  | bigint        | 無効な値                                                     |
| CREATE_TIME     | datetime      | テーブルの作成日時                                           |
| UPDATE_TIME     | datetime      | テーブルのデータが最後に更新された日時                       |
| CHECK_TIME      | datetime      | 無効な値                                                     |
| TABLE_COLLATION | varchar(32)   | 固定値: utf-8                                                |
| CHECKSUM        | bigint        | 無効な値                                                     |
| CREATE_OPTIONS  | varchar(255)  | 無効な値                                                     |
| TABLE_COMMENT   | varchar(2048) | テーブルのコメント                                           |
