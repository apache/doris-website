---
{
  "title": "ユーザー権限",
  "language": "ja",
  "description": "ユーザー認証情報を表示する。"
}
---
## 概要

ユーザー認可情報を表示します。

## データベース


`information_schema`


## テーブル情報

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | 権限が付与されるユーザー          |
| TABLE_CATALOG  | varchar(512) | 常に 'def'                                   |
| PRIVILEGE_TYPE | varchar(64)  | 権限のタイプ                              |
| IS_GRANTABLE   | varchar(3)   | 権限を他者に付与できるかどうか |
