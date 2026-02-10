---
{
    "title": "SET VARIABLE",
    "language": "zh-CN",
    "description": "该语句主要是用来修改 Doris 系统变量，这些系统变量可以分为全局以及会话级别层面来修改，有些也可以进行动态修改。你也可以通过 SHOW VARIABLE 来查看这些系统变量。"
}
---

## 描述

该语句主要是用来修改 Doris 系统变量，这些系统变量可以分为全局以及会话级别层面来修改，有些也可以进行动态修改。你也可以通过 `SHOW VARIABLE` 来查看这些系统变量。

## 语法
```sql
SET variable_assignment [, variable_assignment] [ ... ]
```
其中
```sql
variable_assignment
  : <user_var_name> = <expr>
  | [ <effective_scope> ] <system_var_name> = <expr>
```

## 必选参数
**1. `<user_var_name>`**
> 指定用户层级的变量，比如：@@your_variable_name 等以`@@`开头的变量名称

**2. `<system_var_name>`**
> 指定系统层级的变量，比如 exec_mem_limit 等

## 可选参数
**1. `<effective_scope>`**

> 生效范围的取值可以是`GLOBAL`或者`SESSION`或者`LOCAL`之一，如果不指定该值，默认为`SESSION`。`LOCAL`是`SESSION`的一个别名。

## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | set global variables 需要 admin 权限 |

## 注意事项

- 只有 ADMIN 用户可以设置变量的全局生效
- 全局生效的变量影响当前会话和此后的新会话，不影响当前已经存在的其他会话。

## 示例


- 设置时区为东八区

   ```
   SET time_zone = "Asia/Shanghai";
   ```


- 设置全局的执行内存大小

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```

- 设置用户变量
   ```
   SET @@your_variable_name = your_variable_value;
   ```

