---
{
    "title": "workload_policy",
    "language": "ja",
    "description": "Workload Policy の設定情報を記録します。"
}
---

## 概要

Workload Policy の設定情報を記録します。

## データベース


`information_schema`


## テーブル情報

| カラム名    | 型         | 説明                                    |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | Workload Policy の ID |
| NAME           | varchar(256) | Workload Policy の名前 |
| CONDITION      | text         | Workload Policy の条件 |
| ACTION         | text         | Workload Policy のアクション |
| PRIORITY       | int          | Workload Policy の優先度 |
| ENABLED        | boolean      | Workload Policy が有効かどうか |
| VERSION        | int          | Workload Policy のバージョン |
| WORKLOAD_GROUP | text         | Policy に関連付けられた Workload Group の名前 |
