---
{
    "title": "ALTER ROLE",
    "language": "zh-CN",
    "description": "ALTER ROLE 语句用于修改一个角色的注释"
}
---

## 描述

ALTER ROLE 语句用于修改一个角色的注释

## 语法

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
```

## 必选参数

**1. `<role_name>`**

> 指定角色名称。

**2. `<comment>`**

> 指定角色注释。    

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 修改一个角色的注释

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```
