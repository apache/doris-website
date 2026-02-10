---
{
    "title": "SHOW STORAGE VAULTS",
    "language": "en",
    "description": "The SHOW STORAGE VAULTS command is used to display information about all storage vaults configured in the system."
}
---

## Description

The SHOW STORAGE VAULTS command is used to display information about all storage vaults configured in the system. Storage vaults are used to manage external storage locations for data.

## Syntax

```sql
    SHOW STORAGE VAULTS
```

## Return Values

This command returns a result set with the following columns:

- `StorageVaultName`: The name of the storage vault.
- `StorageVaultId`: The id of the storage vault.
- `Properties`: A JSON string containing the configuration properties of the vault.
- `IsDefault`: Indicates whether this vault is set as the default (TRUE or FALSE).

## Related Commands

- [CREATE STORAGE VAULT](./CREATE-STORAGE-VAULT)
- [GRANT](../../account-management/GRANT-TO)
- [REVOKE](../../account-management/REVOKE-FROM)
- [SET DEFAULT STORAGE VAULT](./SET-DEFAULT-STORAGE-VAULT)

## Keywords

    SHOW, STORAGE VAULTS
