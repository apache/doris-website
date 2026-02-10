---
{
    "title": "SET-PROPERTY",
    "language": "en"
}
---

## SET-PROPERTY

### Name

SET PROPERTY

### Description

Set user attributes, including resources assigned to users, importing clusters, etc.

```sql
SET PROPERTY [FOR 'user'] 'key' = 'value' [, 'key' = 'value']
```

The user attribute set here is for user, not user_identity. That is, if two users 'jack'@'%' and 'jack'@'192.%' are created through the CREATE USER statement, the SET PROPERTY statement can only be used for the user jack, not 'jack'@'% ' or 'jack'@'192.%'

key:

Super user privileges:

 max_user_connections: The maximum number of connections.

 max_query_instances: The number of instances that a user can use to execute a query at the same time.

 sql_block_rules: Set sql block rules. Once set, queries sent by this user will be rejected if they match the rules.

 cpu_resource_limit: Limit the cpu resources for queries. See the introduction to the session variable `cpu_resource_limit` for details. -1 means not set.

 exec_mem_limit: Limit the memory usage of the query. See the introduction to the session variable `exec_mem_limit` for details. -1 means not set.

 resource_tags: Specifies the user's resource tag permissions.

 query_timeout: Specifies the user's query timeout permissions.

    Note: If the attributes `cpu_resource_limit`, `exec_mem_limit` are not set, the value in the session variable will be used by default.

### Example

1. Modify the maximum number of user jack connections to 1000

   ```sql
   SET PROPERTY FOR 'jack' 'max_user_connections' = '1000';
   ```

2. Modify the number of available instances for user jack's query to 3000

   ```sql
   SET PROPERTY FOR 'jack' 'max_query_instances' = '3000';
   ```

3. Modify the sql block rule of user jack

   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'rule1, rule2';
   ```

4. Modify the cpu usage limit of user jack

    ```sql
    SET PROPERTY FOR 'jack' 'cpu_resource_limit' = '2';
    ```

5. Modify the user's resource tag permissions

    ```sql
    SET PROPERTY FOR 'jack' 'resource_tags.location' = 'group_a, group_b';
    ```

6. Modify the user's query memory usage limit, in bytes

    ```sql
    SET PROPERTY FOR 'jack' 'exec_mem_limit' = '2147483648';
    ```

7. Modify the user's query timeout limit, in second

    ```sql
    SET PROPERTY FOR 'jack' 'query_timeout' = '500';
    ```

### Keywords

    SET, PROPERTY

### Best Practice

