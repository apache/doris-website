---
{
    "title": "table_privileges",
    "language": "ja",
    "description": "テーブルの権限情報を表示します。"
}
---

## 概要

テーブルの権限情報を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名       | 型           | 説明                                           |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | 権限を付与されたユーザー                       |
| TABLE_CATALOG  | varchar(512) | カタログ名                                     |
| TABLE_SCHEMA   | varchar(64)  | データベース名                                 |
| TABLE_NAME     | varchar(64)  | テーブル名                                     |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類                                     |
| IS_GRANTABLE   | varchar(3)   | その権限をほかのユーザーに付与できるかどうか   |
