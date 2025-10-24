---
{
    "title": "SHOW PROPERTY",
    "language": "en"
}
---

## Description

This statement is used to view the attributes of the user.

## Syntax

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```

## Optional Parameters
**1. `[ALL PROPERTIES]`**

   Whether to view all user attributes.

**2. `<user_name>`**

   View the attributes of the specified user. If not specified, check the current user's.

**3. `<key>`**

   Fuzzy matching can be done by attribute name.

## Return Value
- If the statement uses `PROPERTY`

   | Column | Description |
   | -- | -- |
   | Key | Attribute name |
   | Value | Attribute value |

- If the statement uses `PROPERTIES`

   | Column | Description |
   | -- | -- |
   | User | User name |
   | Properties | Corresponding user each `property` `key:value` |

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | User or role has `GRANT_PRIV` permission to view all user properties, `SHOW PROPERTY` does not require `GRANT_PRIV` permission to view the current user's properties |

## Usage Notes
-  `SHOW ALL PROPERTIES` can be used to view all users' properties.
- If the `user_name` is specified, view the attributes of the specified user.
- If the `user_name` is not specified, view the attributes of the current user.
- `SHOW PROPERTY` does not require `GRANT_PRIV` permission to view the current user's properties.

## Examples

- View the attributes of the jack user

   ```sql
   SHOW PROPERTY FOR 'jack';
   ```
   ```text
   +-------------------------------------+--------+
   | Key                                 | Value  |
   +-------------------------------------+--------+
   | cpu_resource_limit                  | -1     |
   | default_load_cluster                |        |
   | default_workload_group              | normal |
   | exec_mem_limit                      | -1     |
   | insert_timeout                      | -1     |
   | max_query_instances                 | 3000   |
   | max_user_connections                | 1000   |
   | parallel_fragment_exec_instance_num | -1     |
   | query_timeout                       | -1     |
   | resource_tags                       |        |
   | sql_block_rules                     |        |
   +-------------------------------------+--------+
   ```

- View the limit-related properties of the user jack

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%limit%';
   ```

   ```text
   +--------------------+-------+
   | Key                | Value |
   +--------------------+-------+
   | cpu_resource_limit | -1    |
   | exec_mem_limit     | -1    |
   +--------------------+-------+
   ```

- View all users limit related properties

   ```sql
   SHOW ALL PROPERTIES LIKE '%limit%';
   ```

   ```text
   +-------+------------------------------------------------------------+
   | User  | Properties                                                 |
   +-------+------------------------------------------------------------+
   | root  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | admin | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | jack  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   +-------+------------------------------------------------------------+
   ```

