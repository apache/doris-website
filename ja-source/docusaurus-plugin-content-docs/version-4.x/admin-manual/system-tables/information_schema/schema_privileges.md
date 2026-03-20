---
{
  "title": "スキーマ権限",
  "language": "ja",
  "description": "データベースの認証情報を表示する。"
}
---
## 概要

データベースの認可情報を表示します。

## Database

`information_schema`

## テーブル情報

| Column Name    | タイプ         | 詳細                                         |
| -------------- | ------------ | --------------------------------------------------- |
| GRANTEE        | varchar(81)  | 認可されたユーザー                                 |
| TABLE_CATALOG  | varchar(512) | カタログ名、常に 'def'                             |
| TABLE_SCHEMA   | varchar(64)  | データベース名                                     |
| PRIVILEGE_TYPE | varchar(64)  | 権限のタイプ                                       |
| IS_GRANTABLE   | varchar(3)   | 他のユーザーに認可を付与できるかどうか             |
