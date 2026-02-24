---
{
    "title": "DROP USER",
    "language": "en",
    "description": "The DROP USER statement is used to delete a user."
}
---

## Description

The `DROP USER` statement is used to delete a user.

## Syntax 

```sql
  DROP USER '<user_identity>'
```

## Required Parameters

**1. `<user_identity>`**

> The specified user identity.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Example

- Delete user jack@'192.%'

```sql
DROP USER 'jack'@'192.%'
```
