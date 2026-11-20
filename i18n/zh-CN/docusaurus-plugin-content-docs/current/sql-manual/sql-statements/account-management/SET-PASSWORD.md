---
{
    "title": "SET PASSWORD",
    "language": "zh-CN",
    "description": "介绍 Apache Doris SET PASSWORD 的语法、明文与哈希密码用法及权限要求，以及自 4.2.1 起通过 RETAIN CURRENT PASSWORD 保留旧密码的双密码轮换流程。"
}
---

## 描述

SET PASSWORD 语句用于修改一个用户的登录密码。

自 4.2.1 起，Doris 内置密码认证支持通过 `RETAIN CURRENT PASSWORD` 和 `DISCARD OLD PASSWORD` 管理双密码。

## 语法

```sql
SET PASSWORD [FOR <user_identity>] =
    { PASSWORD(<plain_password>) | <hashed_password> }
    [RETAIN CURRENT PASSWORD]
```

## 必选参数

**1. `<plain_password>`**

> 输入的是明文密码，以密码 `123456` 为例，直接使用 字符串`123456`。

**2. `<hashed_password>`**

> 输入的是已加密的密码。以密码 `123456` 为例，直接使用字符串`*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`, 字符串为函数 `PASSWORD('123456')` 的返回值。

## 可选参数

**1. `<user_identity>`**

> 显式指定 `FOR` 时，必须与 `CREATE USER` 创建的账号身份完全匹配，包括 host 部分。省略 `FOR` 时，Doris 使用 `CURRENT_USER()` 返回的当前认证账号，而不是 `USER()` 返回的客户端 IP 身份。可通过 `SHOW GRANTS` 查看当前账号。

**2. `RETAIN CURRENT PASSWORD`（自 4.2.1 起支持）**

> 将原主密码保留为次密码，并将指定的新密码设为主密码，两者均可登录；更早保留的次密码会被替换。需要全局 `GRANT_PRIV` 或 `ADMIN_PRIV`，即使修改的是自己的密码。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象         | 说明            |
|:------------|:------------|:--------------|
| 无额外权限 | 当前用户 | 不带 RETAIN 的普通自助改密不需要额外权限。 |
| GRANT_PRIV 或 ADMIN_PRIV | 全局 | 修改其他用户的密码，或使用 RETAIN CURRENT PASSWORD（包括自己的账号），均需要此权限。 |

## 注意事项

自 4.1.5 版本起，特殊 root 身份仅指 `'root'@'%'`。例如 `'root'@'localhost'` 仍是普通用户身份，不会仅因用户名为 root 而获得修改真正 root 账号的特权；真正 root 的保护也不会错误地套用到其他同名用户。

- 如果 `FOR user_identity` 字段不存在，那么修改当前用户的密码。

### 双密码（自 4.2.1 起支持）

- 普通的非空改密语句如果不带 RETAIN，已有次密码保持不变。
- 当前主密码为空时，RETAIN 会失败。新密码为空时，即使指定 RETAIN，也会清除两份密码。
- 设置明文密码时使用 `PASSWORD('<new_password>')`；直接填写字符串时必须使用已经计算好的密码哈希。
- 撤销次密码需要使用 `ALTER USER ... DISCARD OLD PASSWORD`，SET PASSWORD 没有 DISCARD 子句。

完整流程和升级限制见[双密码](../../../admin-manual/auth/authentication/internal#双密码)。这些子句适用于内置密码认证。

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

- 在轮换期间同时保留新旧密码（自 4.2.1 起支持）

由具有全局 `GRANT_PRIV` 或 `ADMIN_PRIV` 的管理员执行：

```sql
CREATE USER 'rotation_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
SET PASSWORD FOR 'rotation_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD;
```

`OldPwd_2026!` 和 `NewPwd_2026!` 均可登录。客户端迁移完成后，撤销旧凭据：

```sql
ALTER USER 'rotation_user'@'%' DISCARD OLD PASSWORD;
```

此后只有 `NewPwd_2026!` 可以登录。
