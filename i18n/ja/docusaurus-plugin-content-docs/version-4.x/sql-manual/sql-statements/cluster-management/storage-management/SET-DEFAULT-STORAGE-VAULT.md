---
{
    "title": "SET DEFAULT STORAGE VAULT",
    "language": "ja",
    "description": "このステートメントは、Doris のデフォルトの Storage Vault を設定するために使用します。デフォルトの Storage Vault は、内部テーブルまたはシステムテーブルのデータを保存するために使用されます。"
}
---

## 説明

このステートメントは、Doris のデフォルトの Storage Vault を設定するために使用します。デフォルトの Storage Vault は、内部テーブルまたはシステムテーブルのデータを保存するために使用されます。デフォルトの Storage Vault が設定されていない場合、Doris は正常に動作できません。デフォルトの Storage Vault は一度設定すると削除できません。


## 構文

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## 必須パラメータ

| パラメータ名          | 説明                                                         |
|-------------------|--------------------------------------------------------------|
| `<vault_name>`    | Storage Vault の名前です。デフォルトの Storage Vault として設定する Vault の一意の識別子です。           |

## 使用上の注意:
> 1. デフォルトの Storage Vault を設定できるのは ADMIN ユーザーのみです。

## 例

1. s3_vault という名前の Storage Vault をデフォルトの Storage Vault として設定します。

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```
