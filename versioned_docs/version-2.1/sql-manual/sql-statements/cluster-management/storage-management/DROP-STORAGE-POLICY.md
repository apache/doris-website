---
{
    "title": "DROP STORAGE POLICY",
    "language": "en"
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

> Storage policy name

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes |
| ---------- | ------ | ----- |
| ADMIN_PRIV | Global |       |

## Examples

1. Delete a storage policy named policy1

  ```sql
  DROP STORAGE POLICY policy1
  ```