---
{
    "title": "ALTER ROLE",
    "language": "en"
}
---

## Description

The `ALTER ROLE` statement is used to modify a role.

## Syntax 

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
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

- Modify the role's comment

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```
