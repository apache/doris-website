---
{
  "title": "DROP STORAGE POLICY",
  "language": "ja",
  "description": "ストレージポリシーを削除します。ストレージポリシーの詳細な説明については、「Storage Policy」の章を参照してください。"
}
---
## 説明

ストレージポリシーを削除します。ストレージポリシーの詳細については、「Storage Policy」の章を参照してください。

## 構文

```sql
DROP STORAGE POLICY <policy_name>
```
## 必須パラメータ

**<policy_name>**

> ストレージポリシー名

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| 権限 | オブジェクト | 注記 |
| ---------- | ------ | ----- |
| ADMIN_PRIV | Global |       |

## 例

1. policy1という名前のストレージポリシーを削除する

  ```sql
  DROP STORAGE POLICY policy1
  ```
