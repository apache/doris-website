---
{
    "title": "SET-VARIABLE",
    "language": "zh-CN"
}
---

## SET-VARIABLE

### Name

SET VARIABLE

## 描述

该语句主要是用来修改 Doris 系统变量，这些系统变量可以分为全局以及会话级别层面来修改，有些也可以进行动态修改。你也可以通过 `SHOW VARIABLE` 来查看这些系统变量。

语法：

```sql
SET variable_assignment [, variable_assignment] ...
```

说明：

1. variable_assignment:
         user_var_name = expr
       | [GLOBAL | SESSION] system_var_name = expr

> 注意：
>
> 1. 只有 ADMIN 用户可以设置变量的全局生效
> 2. 全局生效的变量不影响当前会话的变量值，仅影响新的会话中的变量。

既支持当前会话生效又支持全局生效的变量包括：

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

只支持全局生效的变量包括：

- `default_rowset_type`

## 举例

1. 设置时区为东八区

   ```
   SET time_zone = "Asia/Shanghai";
   ```

2. 设置全局的执行内存大小

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```

### Keywords

    SET, VARIABLE

### Best Practice

