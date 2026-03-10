---
{
  "title": "schema_privileges",
  "language": "ja",
  "description": "データベースの認証情報を表示します。"
}
---
## 概要

データベースの認可情報を表示します。

## データベース


`information_schema`


## テーブル情報

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | 認可されたユーザー                             |
| TABLE_CATALOG  | varchar(512) | カタログ名、常に 'def'                         |
| TABLE_SCHEMA   | varchar(64)  | データベース名                                 |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類                                     |
| IS_GRANTABLE   | varchar(3)   | 他のユーザーに認可を付与できるかどうか         |
