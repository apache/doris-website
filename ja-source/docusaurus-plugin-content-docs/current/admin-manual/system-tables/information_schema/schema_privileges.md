---
{
  "title": "schema_privileges",
  "language": "ja",
  "description": "データベースの認証情報を表示します。"
}
---
## 概要

データベースの認証情報を表示します。

## Database

`information_schema`

## table Information

| Column Name    | タイプ         | 詳細                                         |
| -------------- | ------------ | --------------------------------------------------- |
| GRANTEE        | varchar(81)  | 認証されたユーザー                                 |
| TABLE_CATALOG  | varchar(512) | カタログ名、常に'def'                               |
| TABLE_SCHEMA   | varchar(64)  | Database名                                          |
| PRIVILEGE_TYPE | varchar(64)  | 権限のタイプ                                       |
| IS_GRANTABLE   | varchar(3)   | 他のユーザーに認証を付与できるかどうか             |
