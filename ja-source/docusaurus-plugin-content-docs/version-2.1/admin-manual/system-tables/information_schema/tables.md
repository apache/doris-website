---
{
  "title": "テーブル",
  "language": "ja",
  "description": "すべてのテーブル情報を格納します。"
}
---
## 概要

すべてのテーブル情報を格納します。

## データベース

`information_schema`

## テーブル情報

| カラム名        | タイプ        | 説明                                                         |
| --------------- | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | テーブルが属するカタログ                                      |
| TABLE_SCHEMA    | varchar(64)   | テーブルが属するDatabase                                     |
| TABLE_NAME      | varchar(64)   | テーブルの名前                                               |
| TABLE_TYPE      | varchar(64)   | テーブルのタイプ。以下を含む: SYSTEM VIEW、VIEW、BASE TABLE  |
| ENGINE          | varchar(64)   | テーブルのストレージエンジンタイプ                           |
| VERSION         | bigint        | 無効な値                                                     |
| ROW_FORMAT      | varchar(10)   | 無効な値                                                     |
| TABLE_ROWS      | bigint        | テーブルの推定行数                                           |
| AVG_ROW_LENGTH  | bigint        | テーブルの平均行サイズ                                       |
| DATA_LENGTH     | bigint        | テーブルの推定サイズ                                         |
| MAX_DATA_LENGTH | bigint        | 無効な値                                                     |
| INDEX_LENGTH    | bigint        | 無効な値                                                     |
| DATA_FREE       | bigint        | 無効な値                                                     |
| AUTO_INCREMENT  | bigint        | 無効な値                                                     |
| CREATE_TIME     | datetime      | テーブルが作成された時刻                                     |
| UPDATE_TIME     | datetime      | テーブルデータが最後に更新された時刻                         |
| CHECK_TIME      | datetime      | 無効な値                                                     |
| TABLE_COLLATION | varchar(32)   | 固定値: utf-8                                                |
| CHECKSUM        | bigint        | 無効な値                                                     |
| CREATE_OPTIONS  | varchar(255)  | 無効な値                                                     |
| TABLE_COMMENT   | varchar(2048) | テーブルのコメント                                           |
