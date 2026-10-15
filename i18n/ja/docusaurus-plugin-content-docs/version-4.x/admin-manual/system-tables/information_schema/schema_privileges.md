---
{
    "title": "schema_privileges",
    "language": "ja",
    "description": "データベースの権限情報を表示します。"
}
---

## 概要

データベースの権限情報を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名       | 型           | 説明                                     |
| -------------- | ------------ | ---------------------------------------- |
| GRANTEE        | varchar(81)  | 権限を付与されたユーザー                 |
| TABLE_CATALOG  | varchar(512) | Catalog 名。常に 'def'                  |
| TABLE_SCHEMA   | varchar(64)  | データベース名                           |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類                               |
| IS_GRANTABLE   | varchar(3)   | ほかのユーザーに権限を付与できるかどうか |
