---
{
    "title": "DROP STORAGE POLICY",
    "language": "en",
    "description": "Delete a storage policy. For detailed descriptions of storage policies, please refer to the \"Storage Policy\" chapter."
}
---

## Description

Delete a storage policy. For detailed descriptions of storage policies, please refer to the "Storage Policy" chapter.

## Syntax

```sql
DROP STORAGE POLICY <policy_name>
```
## Required Parameters

**<policy_name>**

> The name of the storage policy

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## Example

1. Delete a storage policy named policy1

    ```sql
    DROP STORAGE POLICY policy1
    ```