---
{
    "title": "user_privileges",
    "language": "ja",
    "description": "ユーザーに付与された権限情報を表示します。"
}
---

## 概要

ユーザーに付与された権限情報を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名    | 型         | 説明                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | 権限を付与されたユーザー |
| TABLE_CATALOG  | varchar(512) | 常に 'def' |
| PRIVILEGE_TYPE | varchar(64)  | 権限の種類 |
| IS_GRANTABLE   | varchar(3)   | その権限をほかのユーザーに付与できるかどうか |
