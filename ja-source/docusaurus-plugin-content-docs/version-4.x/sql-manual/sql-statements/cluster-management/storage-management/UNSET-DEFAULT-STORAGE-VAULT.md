---
{
  "title": "DEFAULT STORAGE VAULT の設定を解除",
  "description": "指定されたデフォルトストレージVaultをキャンセルする",
  "language": "ja"
}
---
## 説明
指定されたデフォルトストレージボルトをキャンセルします

## 構文

```sql
UNSET DEFAULT STORAGE VAULT
```
## アクセス許可制御

| Privilege  | Object        | 注釈                                                      |
| :--------- | :------------ | :--------------------------------------------------------- |
| ADMIN_PRIV | Storage Vault | 管理者ユーザーのみがこのステートメントを実行する権限を持ちます |

## 例

```sql
UNSET DEFAULT STORAGE VAULT
```
