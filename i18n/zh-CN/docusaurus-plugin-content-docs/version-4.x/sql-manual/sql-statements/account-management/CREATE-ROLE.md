---
{
    "title": "CREATE ROLE",
    "language": "zh-CN",
    "description": "CREATE ROLE 语句用于创建一个无权限的角色，后续可以通过 GRANT 命令赋予该角色权限。"
}
---

## 描述

CREATE ROLE 语句用于创建一个无权限的角色，后续可以通过 GRANT 命令赋予该角色权限。

## 语法

```sql
 CREATE ROLE <role_name> [<comment>];
```

## 必选参数

**1. `<role_name>`**：

> 指定角色名称。

## 可选参数

**2. `<comment>`**

> 指定角色注释。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 创建一个角色

```sql
CREATE ROLE role1;
```

- 创建一个角色并添加注释
    
```sql
CREATE ROLE role2 COMMENT "this is my first role";
```

