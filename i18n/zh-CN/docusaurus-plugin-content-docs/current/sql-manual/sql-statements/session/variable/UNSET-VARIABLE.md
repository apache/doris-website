---
{
    "title": "UNSET VARIABLE",
    "language": "zh-CN",
    "description": "该语句主要是用来恢复 Doris 系统变量为默认值，可以是全局也可以是会话级别。"
}
---

## 描述

该语句主要是用来恢复 Doris 系统变量为默认值，可以是全局也可以是会话级别。

## 语法

```sql
UNSET [<effective_scope>] VARIABLE (<variable_name>)
```

## 必选参数
**1. `<variable_name>`**
> 指定变量名称，如果需要 unset 全部变量，可以写一个`ALL`关键字


## 可选参数
**1. `<effective_scope>`**
> 生效范围的取值可以是`GLOBAL`或者`SESSION`或者`LOCAL`之一，如果不指定该值，默认为`SESSION`。`LOCAL`是`SESSION`的一个别名。


## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | unset global variables 需要 admin 权限 |


## 注意事项

- 只有 ADMIN 用户可以设置变量的全局生效
- 使用 `GLOBAL` 恢复变量值时仅在执行命令的当前会话和之后打开的会话中生效，不会恢复当前已有的其它会话中的值。


## 示例


- 恢复时区为默认值东八区

   ```
   UNSET VARIABLE time_zone;
   ```


- 恢复全局的执行内存大小

   ```
   UNSET GLOBAL VARIABLE exec_mem_limit;
   ```

- 从全局范围恢复所有变量的值

   ```
   UNSET GLOBAL VARIABLE ALL;
   ```

