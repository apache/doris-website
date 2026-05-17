---
{
    "title": "SHOW STORAGE VAULTS",
    "language": "zh-CN",
    "description": "SHOW STORAGE VAULTS 命令用于显示系统中配置的所有 storage vault 的信息。storage vault 用于管理数据外部存储位置。"
}
---

## 描述

SHOW STORAGE VAULTS 命令用于显示系统中配置的所有 storage vault 的信息。storage vault 用于管理数据外部存储位置。

## 语法

```sql
    SHOW STORAGE VAULTS
```

## Return Values

此命令返回一个结果集，包含以下列：

- `StorageVaultName`: storage vault 的名称。
- `StorageVaultId`: storage vault 的 ID。
- `Properties`: 包含 storage vault 配置属性的 JSON 字符串。
- `IsDefault`: 指示该 storage vault 是否设置为默认值（TRUE 或 FALSE）。

## 相关命令

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## 关键词

    SHOW, STORAGE VAULTS
