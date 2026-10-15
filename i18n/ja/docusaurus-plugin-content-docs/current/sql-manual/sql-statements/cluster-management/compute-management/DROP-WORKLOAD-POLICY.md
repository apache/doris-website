---
{
    "title": "DROP WORKLOAD POLICY",
    "language": "ja",
    "description": "ワークロードポリシーを削除します。"
}
---

## 説明

ワークロードポリシーを削除します。

## 構文

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## 必須パラメータ

**<workload_policy_name>**

ワークロードポリシーの名前です。

## アクセス制御要件

少なくとも `ADMIN_PRIV` 権限が必要です。

## 例

1. cancel_big_query という名前のワークロードポリシーを削除します。

  ```sql
  drop workload policy if exists cancel_big_query
  ```
