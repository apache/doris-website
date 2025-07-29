---
{
    "title": "SET PROPERTY",
    "language": "en"
}

---

## Description

Set user attributes, including resources assigned to users, importing clusters, etc.

**Related Commands**

- [CREATE USER](./CREATE-USER.md)
- [SHOW PROPERTY](./SHOW-PROPERTY.md)

## Syntax

```sql
SET PROPERTY [ FOR '<user_name>' ] '<key_1>' = '<value_1>' [, '<key_2>' = '<value_2>', ...];
```

## Required Parameters
**1. `<key_n>`**

Super user privileges:

 - `max_user_connections`: The maximum number of connections.
 - `max_query_instances`: The number of instances that a user can use to execute a query at the same time.
 - `sql_block_rules`: Set sql block rules. Once set, queries sent by this user will be rejected if they match the rules.
 - `cpu_resource_limit`: Limit the cpu resources for queries. See the introduction to the session variable `cpu_resource_limit` for details. -1 means not set.
 - `exec_mem_limit`: Limit the memory usage of the query. See the introduction to the session variable `exec_mem_limit` for details. -1 means not set.
 - `resource_tags`: Specifies the user's resource tag permissions.
 - `query_timeout`: Specifies the user's query timeout permissions.
 - `default_workload_group`: Specifies the user's default workload group.

Note: If the attributes `cpu_resource_limit`, `exec_mem_limit` are not set, the value in the session variable will be used by default.

**2. `<value_n>`**

The value set for the specified key.

## Optional Parameters

**1. `<user_name>`**

The username of the user whose properties are to be set. If omitted, the properties will be set for the current user.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | User or Role    | This `SET PROPERTY` operation can only be performed by users or roles with `ADMIN_PRIV` permissions. |

## Usage Notes

- The user attribute set here is for user, not user_identity. That is, if two users 'jack'@'%' and 'jack'@'192.%' are created through the CREATE USER statement, the SET PROPERTY statement can only be used for the user jack, not 'jack'@'% ' or 'jack'@'192.%'

## Examples

- Modify the maximum number of user jack connections to 1000

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```

- Modify the number of available instances for user jack's query to 3000

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```

- Modify the sql block rule of user jack

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```

- Modify the cpu usage limit of user jack

   ```sql
   SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
   ```

- Modify the user's resource tag permissions

   ```sql
   SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
   ```

- Modify the user's query memory usage limit, in bytes

   ```sql
   SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
   ```

- Modify the user's query timeout limit, in second

   ```sql
   SET PROPERTY FOR 'jack' 'query_timeout' = '500';
   ```

