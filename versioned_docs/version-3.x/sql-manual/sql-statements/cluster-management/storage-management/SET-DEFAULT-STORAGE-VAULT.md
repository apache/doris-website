---
{
    "title": "SET DEFAULT STORAGE VAULT",
    "language": "en"
}
---

## Description

This statement is used to set the default storage vault in Doris. The default storage vault is used to store data for internal or system tables. If the default storage vault is not set, Doris will not be able to operate normally. Once a default storage vault is set, it cannot be removed.


## Syntax

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## Required Parameters

| Parameter Name          | Description                                                         |
|-------------------|--------------------------------------------------------------|
| `<vault_name>`    | The name of the storage vault. This is the unique identifier of the vault you want to set as the default storage vault.           |

## Usage Notes:
> 1. Only ADMIN users can set the default storage vault.

## Examples

1. Set the storage vault named s3_vault as the default storage vault.

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```
