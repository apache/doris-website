---
{
  "title": "SHOW STORAGE VAULTS",
  "description": "SHOW STORAGE VAULTS コマンドは、システムに設定されているすべてのストレージボルトに関する情報を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

SHOW STORAGE VAULTSコマンドは、システムに設定されているすべてのストレージボルトに関する情報を表示するために使用されます。ストレージボルトは、データの外部ストレージの場所を管理するために使用されます。

## 構文

```sql
    SHOW STORAGE VAULTS
```
## 戻り値

このコマンドは以下の列を含む結果セットを返します：

- `StorageVaultName`: ストレージボルトの名前。
- `StorageVaultId`: ストレージボルトのID。
- `Properties`: ボルトの設定プロパティを含むJSON文字列。
- `IsDefault`: このボルトがデフォルトとして設定されているかどうかを示します（TRUEまたはFALSE）。

## 関連コマンド

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## キーワード

    SHOW, STORAGE VAULTS
