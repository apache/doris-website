---
{
  "title": "DROP STORAGE POLICY",
  "language": "ja",
  "description": "ストレージポリシーを削除します。ストレージポリシーの詳細な説明については、「Storage Policy」の章を参照してください。"
}
---
## 説明

ストレージポリシーを削除します。ストレージポリシーの詳細な説明については、「Storage Policy」の章を参照してください。

## 構文

```sql
DROP STORAGE POLICY <policy_name>
```
## 必須パラメータ

**<policy_name>**

> ストレージポリシーの名前

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限  | オブジェクト | 備考 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## 例

1. policy1という名前のストレージポリシーを削除する

    ```sql
    DROP STORAGE POLICY policy1
    ```
