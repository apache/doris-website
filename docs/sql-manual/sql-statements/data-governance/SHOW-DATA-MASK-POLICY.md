---
{
    "title": "SHOW DATA MASK POLICY",
    "language": "en",
    "description": "View data mask policies. For details on data mask policies, refer to the \"Security Policies\" chapter"
}
---

## Description

View data mask policies. For details on data mask policies, refer to the "Security Policies" chapter

## Syntax

```sql
SHOW DATA MASK POLICY [ FOR { <user_name> | ROLE <role_name> } ];
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

1. View all data mask policies


  ```sql
  SHOW DATA MASK POLICY;
  ```

1. Query by specifying a user name

  ```sql
  SHOW DATA MASK POLICY FOR user1;
  ```

1. Query by specifying a role name

  ```sql
  SHOW DATA MASK POLICY for role role1;
  ```