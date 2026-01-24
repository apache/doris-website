---
{
    "title": "SHOW VARIABLES",
    "language": "zh-CN",
    "description": "该语句是用来显示 Doris 系统变量，可以通过条件查询"
}
---

## 描述

该语句是用来显示 Doris 系统变量，可以通过条件查询

## 语法

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where>]
```

## 可选参数
**1. `<effective_scope>`**
> 生效范围的取值可以是`GLOBAL`或者`SESSION`或者`LOCAL`之一，如果不指定该值，默认为`SESSION`。`LOCAL`是`SESSION`的一个别名。

**2. `<like_pattern>`**
> 使用 like 语句去匹配和过滤最终结果

**3. `<where>`**
> 使用 where 语句去匹配和过滤最终结果

## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| Any_PRIV | Session  | SHOW VARIABLES 命令不需要任何权限 |


## 返回值
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |

## 注意事项

- show variables 主要是用来查看系统变量的值。
- 执行 SHOW VARIABLES 命令不需要任何权限，只要求能够连接到服务器就可以。
- 返回值部分中的`Changed`列，0 表示没有改变过，1 表示改变过。
- 使用`SHOW`语句的一些限制：
  - where 语法中不能使用`or`语句
  - 列名在等值左侧
  - 只支持等值连接
  - 使用 like 语句表示用 variable_name 进行匹配。
  - %百分号通配符可以用在匹配模式中的任何位置。


## 示例


- 这里默认的就是对 Variable_name 进行匹配，这里是准确匹配

   ```sql
   show variables like 'max_connections'; 
   ```
   

- 通过百分号 (%) 这个通配符进行匹配，可以匹配多项

   ```sql
   show variables like '%connec%';
   ```


- 使用 Where 子句进行匹配查询

   ```sql
   show variables where variable_name = 'version';
   ```
