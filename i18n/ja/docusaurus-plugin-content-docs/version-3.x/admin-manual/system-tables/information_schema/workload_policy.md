---
{
  "title": "workload_policy",
  "language": "ja",
  "description": "Workload Policiesの設定情報を記録します。"
}
---
## 概要

Workload Policiesの設定情報を記録します。

## データベース

`information_schema`

## テーブル情報

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | Workload PolicyのID                            |
| NAME           | varchar(256) | Workload Policyの名前                          |
| CONDITION      | text         | Workload Policyの条件                          |
| ACTION         | text         | Workload Policyのアクション                    |
| PRIORITY       | int          | Workload Policyの優先度                        |
| ENABLED        | boolean      | Workload Policyが有効かどうか                  |
| VERSION        | int          | Workload Policyのバージョン                    |
| WORKLOAD_GROUP | text         | PolicyにバインドされたWorkload Groupの名前     |
