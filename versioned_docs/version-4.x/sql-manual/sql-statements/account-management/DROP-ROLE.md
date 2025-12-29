---
{
    "title": "DROP ROLE",
    "language": "en",
    "description": "The DROP ROLE statement is used to removes a role."
}
---

## Description

The `DROP ROLE` statement is used to removes a role.

## Syntax 

```sql
  DROP ROLE [IF EXISTS] <role_name>;
```

## Required Parameters

**1. `<role_name>`**：

> The name of the role. 

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Usage Notes

- Deleting a role does not affect the permissions of users who previously belonged to the role. It is only equivalent to decoupling the role from the user. The permissions that the user has obtained from the role will not change.

## Example

- Drop a role1

```sql
DROP ROLE role1;
```
