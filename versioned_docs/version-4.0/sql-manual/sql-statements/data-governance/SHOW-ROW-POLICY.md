---
{
    "title": "SHOW ROW POLICY",
    "language": "en"
}
---

## Description

View row security policies. For details on row security policies, refer to the "Security Policies" chapter

## Syntax

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```
## Optional Parameters

**<user_name>**

> User name

**<role_name>**

> Role name

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## Examples

1. View all security policies


  ```sql
  SHOW ROW POLICY;
  ```

1. Query by specifying a user name

  ```sql
  SHOW ROW POLICY FOR user1;
  ```

1. Query by specifying a role name

  ```sql
  SHOW ROW POLICY for role role1;
  ```