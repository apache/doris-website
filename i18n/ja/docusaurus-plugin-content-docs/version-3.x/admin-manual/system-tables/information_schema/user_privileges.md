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

| カラム名       | 型           | 説明                                   |
| -------------- | ------------ | -------------------------------------- |
| GRANTEE        | varchar(81)  | 権限を付与されたユーザー               |
| TABLE_CATALOG  | varchar(512) | 常に 'def'                             |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類                             |
| IS_GRANTABLE   | varchar(3)   | 権限を他のユーザーに付与できるかどうか |
