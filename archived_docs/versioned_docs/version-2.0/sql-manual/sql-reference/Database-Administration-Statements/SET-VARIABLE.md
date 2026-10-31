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
> 2. The globally effective variable affects the current session and new sessions thereafter, but does not affect other sessions that currently exist.

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

