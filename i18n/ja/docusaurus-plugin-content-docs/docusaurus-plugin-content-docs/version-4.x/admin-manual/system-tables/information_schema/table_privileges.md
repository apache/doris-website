---
{
  "title": "table_privileges",
  "language": "ja",
  "description": "テーブルの認可情報を表示します。"
}
---
## 概要

テーブルの認可情報を表示します。

## Database

`information_schema`

## テーブル情報

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | 認可されたユーザー                             |
| TABLE_CATALOG  | varchar(512) | Catalogの名前                                  |
| TABLE_SCHEMA   | varchar(64)  | Databaseの名前                                 |
| TABLE_NAME     | varchar(64)  | Tableの名前                                    |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類                                     |
| IS_GRANTABLE   | varchar(3)   | 権限を他のユーザーに付与できるかどうか         |
