---
{
  "title": "workload_group_privileges",
  "language": "ja",
  "description": "ワークロードグループの権限情報を格納します。"
}
---
## 概要

Workload Groupsの権限情報を格納します。

## データベース

`information_schema`

## テーブル情報

| カラム名            | 型           | 説明                                     |
| ------------------- | ------------ | ---------------------------------------- |
| GRANTEE             | varchar(64)  | 権限を付与されたユーザー                 |
| WORKLOAD_GROUP_NAME | varchar(256) | Workload Groupの名前                     |
| PRIVILEGE_TYPE      | varchar(64)  | 権限の種類                               |
| IS_GRANTABLE        | varchar(3)   | 他のユーザーに付与可能かどうか           |
