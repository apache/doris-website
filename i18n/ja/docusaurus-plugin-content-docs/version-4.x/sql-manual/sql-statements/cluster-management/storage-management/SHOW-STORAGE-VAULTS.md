---
{
    "title": "SHOW STORAGE VAULTS",
    "language": "ja",
    "description": "SHOW STORAGE VAULTS コマンドは、システムに設定されているすべてのストレージボールトの情報を表示します。"
}
---

## 説明

SHOW STORAGE VAULTS コマンドは、システムに設定されているすべてのストレージボールトの情報を表示します。ストレージボールトは、データの外部保存先を管理するために使用します。

## 構文

```sql
    SHOW STORAGE VAULTS
```

## 戻り値

このコマンドは、次の列を含む結果セットを返します。

- `StorageVaultName`: ストレージボールトの名前。
- `StorageVaultId`: ストレージボールトの ID。
- `Properties`: ボールトの設定プロパティを含む JSON 文字列。
- `IsDefault`: このボールトがデフォルトに設定されているかどうかを示します（TRUE または FALSE）。

## 関連コマンド

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## キーワード

    SHOW, STORAGE VAULTS
