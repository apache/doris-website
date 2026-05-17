---
{
    "title": "SET LDAP_ADMIN_PASSWORD",
    "language": "zh-CN",
    "description": "SET LDAPADMINPASSWORD 命令用于设置 LDAP 管理员密码。使用 LDAP 认证时，doris 需使用管理员账户和密码来向 LDAP 服务查询登录用户的信息。"
}
---

## 描述

 `SET LDAP_ADMIN_PASSWORD` 命令用于设置 LDAP 管理员密码。使用 LDAP 认证时，doris 需使用管理员账户和密码来向 LDAP 服务查询登录用户的信息。

## 语法

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('<plain_password>')
```

## 必选参数

**1. `<plain_password>`**

LDAP 管理员密码

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ADMIN_PRIV        | 用户（User）或 角色（Role）    | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 设置 LDAP 管理员密码
  ```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
  ```
