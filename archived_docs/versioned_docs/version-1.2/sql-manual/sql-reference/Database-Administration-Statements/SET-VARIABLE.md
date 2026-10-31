---
{
    "title": "SET-VARIABLE",
    "language": "en"
}
---

## SET-VARIABLE

### Name

SET VARIABLE

### Description

This statement is mainly used to modify Doris system variables. These system variables can be modified at the global and session level, and some can also be modified dynamically. You can also view these system variables with `SHOW VARIABLE`.

grammar:

```sql
SET variable_assignment [, variable_assignment] ...
```

illustrate:

1. variable_assignment:
         user_var_name = expr
       | [GLOBAL | SESSION] system_var_name = expr

> Note:
>
> 1. Only ADMIN users can set variables to take effect globally
> 2. The globally effective variable does not affect the variable value of the current session, but only affects the variable in the new session.

Variables that support both the current session and the global effect include:

- `time_zone`
- `wait_timeout`
- `sql_mode`
- `enable_profile`
- `query_timeout`
-  `insert_timeout`
- `exec_mem_limit`
- `batch_size`
- `allow_partition_column_nullable`
- `insert_visible_timeout_ms`
- `enable_fold_constant_by_be`

Variables that only support global effects include:

- `default_rowset_type`

### Example

1. Set the time zone to Dongba District

   ```
   SET time_zone = "Asia/Shanghai";
   ```

2. Set the global execution memory size

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```

### Keywords

    SET, VARIABLE

### Best Practice

