---
{
    "title": "DROP USER",
    "language": "zh-CN",
    "description": "DROP USER 语句用于删除一个用户。"
}
---

## 描述

 DROP USER 语句用于删除一个用户。

## 语法

```sql
 DROP USER '<user_identity>'
```

## 必选参数

**1. `<user_identity>`**

> 指定的用户 identity。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

1. 删除用户 jack@'192.%'

```sql
DROP USER 'jack'@'192.%'
```

