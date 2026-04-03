---
{
  "title": "DROP WORKLOAD POLICY",
  "language": "ja",
  "description": "ワークロードポリシーを削除する"
}
---
## 説明

Workload Policyを削除します

## 構文

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## 必須パラメータ

**<workload_policy_name>**

Workload Policyの名前

## アクセス制御要件

最低限`ADMIN_PRIV`権限が必要です

## 例

1. cancel_big_queryという名前のWorkload Policyを削除する

  ```sql
  drop workload policy if exists cancel_big_query
  ```
