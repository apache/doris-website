---
{
    "title": "LDAP",
    "language": "zh-CN"
}
---

## LDAP

### Name

LDAP

## 描述

SET LDAP_ADMIN_PASSWORD

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('plain password')
```

 SET LDAP_ADMIN_PASSWORD 命令用于设置LDAP管理员密码。使用LDAP认证时，doris需使用管理员账户和密码来向LDAP服务查询登录用户的信息。

## 举例

1. 设置LDAP管理员密码
```sql
SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
```

### Keywords

    LDAP, PASSWORD, LDAP_ADMIN_PASSWORD

### Best Practice
