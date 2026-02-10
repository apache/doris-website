---
{
    "title": "CREATE USER",
    "language": "zh-CN",
    "description": "CREATE USER 语句用于创建一个 Doris 用户。"
}
---

## 描述

CREATE USER 语句用于创建一个 Doris 用户。

## 语法

```sql
CREATE USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[DEFAULT ROLE <role_name>]
[<password_policy>]
[<comment>]  

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
```

## 必选参数

**1. `<user_identity>`**

> 一个用户的唯一标识，语法为：'user_name'@'host' 
> `user_identity` 由两部分组成，user_name 和 host，其中 username 为用户名。host 标识用户端连接所在的主机地址。host 部分可以使用 % 进行模糊匹配。如果不指定 host，默认为 '%'，即表示该用户可以从任意 host 连接到 Doris。
> host 部分也可指定为 domain，，即使用中括号包围，则 Doris 会认为这个是一个 domain，并尝试解析其 ip 地址。

## 可选参数

**1. `<password>`**

> 指定用户密码

**2. `<role_name>`**

> 指定用户角色。
> 如果指定了角色，则会自动将该角色所拥有的权限赋予新创建的这个用户。如果不指定，则该用户默认没有任何权限。指定的 ROLE 必须已经存在。

**3. `<password_policy>`**

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
> 设置当前用户登录时，如果使用错误的密码登录 n 次后，账户将被锁定。如 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` 表示如果 3 次错误登录，则账户会被锁定。
>  
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> 设置如果账户被锁定，将设置锁定时间。如 `PASSWORD_LOCK_TIME 1 DAY` 表示账户会被锁定一天。

**4. `<comment`>**

> 指定用户注释

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| ADMIN_PRIV  | 用户（User）或 角色（Role） | 用户或者角色拥有 ADMIN_PRIV 权限才能进行此操作 |

## 示例

- 创建一个无密码用户（不指定 host，则等价于 jack@'%'）

```sql
CREATE USER 'jack';
```

- 创建一个有密码用户，允许从 '172.10.1.10' 登陆

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- 为了避免传递明文，用例 2 也可以使用下面的方式来创建

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
后面加密的内容可以通过 PASSWORD() 获得到，例如：
SELECT PASSWORD('123456');
```

- 创建一个允许从 '192.168' 子网登陆的用户，同时指定其角色为 example_role

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- 创建一个允许从域名 'example_domain' 登陆的用户

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- 创建一个用户，并指定一个角色

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```

- 创建一个用户，设定密码 10 天后过期，并且设置如果 3 次错误登录则账户会被锁定一天。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- 创建一个用户，并限制不可重置密码为最近 8 次是用过的密码。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- 创建一个用户并添加注释

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```

