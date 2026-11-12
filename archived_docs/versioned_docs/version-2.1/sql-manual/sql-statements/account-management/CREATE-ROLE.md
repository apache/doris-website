---
{
    "title": "CREATE ROLE",
    "language": "en",
    "description": "The CREATE ROLE statement is used to create an unprivileged role, which can be subsequently granted with the GRANT command."
}
---

## Description

The `CREATE ROLE` statement is used to create an unprivileged role, which can be subsequently granted with the GRANT command.

## Syntax 

```sql
 CREATE ROLE <role_name> [<comment>];
```

## Required Parameters

**1. `<role_name>`**

> The name of the role. 

## Optional Parameters

**1. `<comment>`**

> The comment of the role.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with ADMIN_PRIV permissions  |

## Example

- Create a role

```sql
CREATE ROLE role1;
```

- Create a role with comment

```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
