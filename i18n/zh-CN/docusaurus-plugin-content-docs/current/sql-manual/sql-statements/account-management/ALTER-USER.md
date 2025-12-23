---
{
    "title": "ALTER USER",
    "language": "zh-CN",
    "description": "ALTER USER 语句用于修改一个用户的账户属性，包括密码、和密码策略等"
}
---

## 描述

ALTER USER 语句用于修改一个用户的账户属性，包括密码、和密码策略等

## 语法

```sql
ALTER USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
    5. ACCOUNT_UNLOCK
```

## 必选参数

**1. `<user_identity`>**

> 一个用户的唯一标识，语法为：'user_name'@'host'
> `user_identity` 由两部分组成，user_name 和 host，其中 username 为用户名。host 标识用户端连接所在的主机地址。host 部分可以使用 % 进行模糊匹配。如果不指定 host，默认为 '%'，即表示该用户可以从任意 host 连接到 Doris。
> host 部分也可指定为 domain，，即使用中括号包围，则 Doris 会认为这个是一个 domain，并尝试解析其 ip 地址。

## 可选参数

**1. `<password>`**

> 指定用户密码

**2. `<password_policy>`**

> 用于指定密码认证登录相关策略的子句，目前支持以下策略：
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> 是否允许当前用户重置密码时使用历史密码。如 `PASSWORD_HISTORY 10` 表示禁止使用过去 10 次设置过的密码为新密码。如果设置为 `PASSWORD_HISTORY DEFAULT`，则会使用全局变量 `password_history` 中的值。`0` 表示不启用这个功能。默认为 0。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> 设置当前用户密码的过期时间。如 `PASSWORD_EXPIRE INTERVAL 10 DAY` 表示密码会在 10 天后过期。`PASSWORD_EXPIRE NEVER` 表示密码不过期。如果设置为 `PASSWORD_EXPIRE DEFAULT`，则会使用全局变量 `default_password_lifetime` 中的值。默认为 NEVER（或 0），表示不会过期。
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
> 
> 设置当前用户登录时，如果使用错误的密码登录 n 次后，账户将被锁定。如 `FAILED_LOGIN_ATTEMPTS 3` 表示如果 3 次错误登录，则账户会被锁定。
> 被锁定的账户可以通过 ALTER USER 语句主动解锁。
>  
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> 设置如果账户被锁定，将设置锁定时间。如 `PASSWORD_LOCK_TIME 1 DAY` 表示账户会被锁定一天。
>
> `ACCOUNT_UNLOCK` 
>
> 解锁用户

**3. `<comment>`**

> 指定用户注释

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 注意事项

1. 从 2.0 版本开始，此命令不再支持修改用户角色，相关操作请使用[GRANT](./GRANT-TO.md)和[REVOKE](./REVOKE-FROM.md)。

2. 在一个 ALTER USER 命令中，只能同时对以下账户属性中的一项进行修改：
- 修改密码
- 修改 PASSWORD_HISTORY
- 修改 PASSWORD_EXPIRE
- 修改 FAILED_LOGIN_ATTEMPTS 和 PASSWORD_LOCK_TIME
- 解锁用户

## 示例

- 修改用户的密码

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```
	
- 修改用户的密码策略

```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```
	
- 解锁一个用户

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- 修改一个用户的注释
    
```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```

