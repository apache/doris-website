---
{
    "title": "SET PASSWORD",
    "language": "zh-CN",
    "description": "SET PASSWORD 语句用于修改一个用户的登录密码。"
}
---

## 描述

SET PASSWORD 语句用于修改一个用户的登录密码。

## 语法

```sql
SET PASSWORD [FOR <user_identity>] =
    [ PASSWORD(<plain_password>)] | [<hashed_password> ]
```

## 必选参数

**1. `<plain_password>`**

> 输入的是明文密码，以密码 `123456` 为例，直接使用 字符串`123456`。

**2. `<hashed_password>`**

> 输入的是已加密的密码。以密码 `123456` 为例，直接使用字符串`*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`, 字符串为函数 `PASSWORD('123456')` 的返回值。

## 可选参数

**1. `<user_identity>`**

> 必须完全匹配在使用 CREATE USER 创建用户时指定的 user_identity，否则会报错用户不存在。如果不指定 user_identity，则当前用户为 'username'@'ip'，这个当前用户，可能无法匹配任何 user_identity。可以通过 SHOW GRANTS 查看当前用户。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能修改所有用户的密码，否则只能修改当前用户的密码 |

## 注意事项

- 如果 `FOR user_identity` 字段不存在，那么修改当前用户的密码。

## 示例
- 修改当前用户的密码

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 修改指定用户密码

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```
