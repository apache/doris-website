---
{
    "title": "内置认证",
    "language": "zh-CN",
    "description": "Apache Doris 内置认证机制详解：用户标识 user_identity 组成、密码策略（历史密码、过期、登录失败锁定、强度校验）、IP 匹配优先级、黑白名单模拟与常见问题排查。"
}
---

<!-- 知识类型: 概念说明 + 配置参数 + 故障排查 -->
<!-- 适用场景: 用户与权限管理 / 登录认证排错 / 密码策略配置 -->

Apache Doris 提供内置的用户认证机制，管理员通过 SQL 命令创建用户、设置密码并控制访问来源。本文介绍 Doris 用户标识的组成方式、密码策略、IP 匹配优先级，以及常见的运维场景与排查方法。

## 适用场景

| 场景 | 推荐章节 |
| --- | --- |
| 新建账号、删除账号、重置密码 | [核心概念](#核心概念)、[常用运维命令](#常用运维命令) |
| 配置企业级密码策略（过期 / 历史 / 强度 / 锁定） | [密码策略](#密码策略) |
| 同一用户名匹配多个 `user_identity`，登录被拒 | [用户身份匹配优先级](#用户身份匹配优先级) |
| 限制特定 IP 不能登录（模拟黑名单） | [使用白名单模拟黑名单](#使用白名单模拟黑名单) |
| 忘记 root 密码、`current_user()` 与 `user()` 不一致 | [常见问题](#常见问题) |

## 核心概念

<!-- 知识类型: 概念说明 -->

### 用户（user_identity）

在 Doris 中，一个 `user_identity` 唯一标识一个用户，由两部分组成：

- `user_name`：用户名。
- `host`：用户端连接所在的主机地址，支持使用 `%` 进行模糊匹配。

如果不指定 `host`，默认为 `'%'`，即该用户可以从任意 host 连接到 Doris。

### 用户属性

用户属性直接附属于 `user_name`，而不是 `user_identity`。即 `user@'192.%'` 和 `user@['domain']` 都拥有同一组用户属性。该属性属于 user，而不是 `user@'192.%'` 或 `user@['domain']`。

用户属性包括但不限于：用户最大连接数、导入集群配置等等。

### 内置用户

内置用户是 Doris 默认创建的用户，并默认拥有一定的权限，包括 root 和 admin。初始密码都为空，FE 启动后，可以通过修改密码命令进行修改。**不支持删除默认用户**。

| 用户 | 允许登录来源 | 默认角色 |
| --- | --- | --- |
| `root@'%'` | 任意节点 | operator |
| `admin@'%'` | 任意节点 | admin |

### 密码

密码是用户登录的凭据，由管理员创建用户时设置，也可以在创建后由用户自己更改。

## 认证机制

<!-- 知识类型: 流程说明 -->

Doris 的认证流程分为以下两步：

1. **客户端发送认证信息**：客户端将用户的信息（用户名、密码、数据库等）打包发送给 Doris 服务器，用于证明客户端的身份和请求访问的数据库。
2. **服务器验证身份**：Doris 收到认证信息后进行验证。如果用户名、密码以及客户端 IP 都正确，并且该用户具有访问所选数据库的权限，则认证成功，Doris 将用户个体映射到系统内的用户标识（User Identity）上；否则认证失败，并返回相应错误消息给客户端。

## 密码策略

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 企业安全合规 / 密码生命周期管理 -->

Doris 支持以下密码策略，帮助管理员进行密码生命周期与安全管理。

| 策略 | 作用 | 默认值 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 禁止使用最近 N 次设置过的密码 | 0（不启用） |
| `PASSWORD_EXPIRE` | 设置密码过期时间 | NEVER（不过期） |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | 连续错误登录后锁定账户 | 不启用 |
| `validate_password_policy` | 校验密码强度 | NONE/0（不校验） |

### PASSWORD_HISTORY

是否允许当前用户重置密码时使用历史密码。如 `PASSWORD_HISTORY 10` 表示禁止使用过去 10 次设置过的密码作为新密码。如果设置为 `PASSWORD_HISTORY DEFAULT`，则会使用全局变量 `password_history` 中的值。0 表示不启用此功能，默认为 0。

示例：

- 设置全局变量：`SET GLOBAL password_history = 10`
- 为用户设置：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE

设置当前用户密码的过期时间。如 `PASSWORD_EXPIRE INTERVAL 10 DAY` 表示密码会在 10 天后过期。`PASSWORD_EXPIRE NEVER` 表示密码不过期。如果设置为 `PASSWORD_EXPIRE DEFAULT`，则会使用全局变量 `default_password_lifetime` 中的值（单位为天）。默认为 NEVER（或 0），表示不会过期。

示例：

- 设置全局变量：`SET GLOBAL default_password_lifetime = 1`
- 为用户设置：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS 与 PASSWORD_LOCK_TIME

设置当前用户登录时，如果使用错误的密码登录 n 次后，账户将被锁定，并设置锁定时间。如 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` 表示如果 3 次错误登录，则账户会被锁定一天。管理员可以通过 ALTER USER 语句主动解锁被锁定的账户。

示例：

- 为用户设置：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### 密码强度

该功能由全局变量 `validate_password_policy` 控制。默认为 NONE/0，即不检查密码强度。如果设置为 STRONG/2，则密码必须包含"大写字母"、"小写字母"、"数字"和"特殊字符"中的 3 项，并且长度必须大于等于 8。

示例：

- `SET validate_password_policy = STRONG`

### 查看密码策略

以上策略设置后，可以通过如下命令查看：

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

注意，需要使用单引号分别包裹 user 和 host 部分。例如：

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 用户身份匹配优先级

<!-- 知识类型: 规则说明 -->
<!-- 适用场景: 登录被拒排查 / 多 user_identity 冲突 -->

`user_identity` 由 `user_name` 和 `host` 组成，但是用户登录的时候只需要输入 `user_name`，所以由 Doris 根据客户端的 IP 来匹配相应的 `host`，从而决定使用哪个 `user_identity` 登录。

如果根据客户端 IP 只能匹配到一个 `user_identity`，那么毫无疑问会匹配到这个 `user_identity`。但是当能够匹配到多个 `user_identity` 时，会按以下优先级匹配：

| 比较场景 | 优先级 |
| --- | --- |
| 具体 IP vs 域名 | 具体 IP 优先于域名 |
| 具体 IP vs 范围 IP | 更精确的 IP 范围优先（如 `192.%` 优先于 `%`） |

### 示例 1：IP 优先于域名

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

假设 `domain1` 被解析为两个 IP：`ip1` 和 `ip2`。在优先级上，IP 优先于域名，因此当用户 `user1` 从 `ip1` 这台机器尝试使用密码 `'12345'` 登录 Doris 时会被拒绝（应使用 `'abcde'`）。

### 示例 2：精确 IP 范围优先

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

在优先级上，`'192.%'` 优先于 `'%'`，因此当用户 `user1` 从 `192.168.1.1` 这台机器尝试使用密码 `'12345'` 登录 Doris 时会被拒绝（应使用 `'abcde'`）。

## 使用白名单模拟黑名单

<!-- 知识类型: 操作技巧 -->
<!-- 适用场景: 拦截特定 IP 登录 -->

Doris 本身不支持黑名单，只有白名单功能，但我们可以利用[用户身份匹配优先级](#用户身份匹配优先级)来模拟黑名单。

例如：先创建了名为 `user@'192.%'` 的用户，表示允许来自 `192.*` 的用户登录。此时如果想禁止来自 `192.168.10.1` 的用户登录，则可以再创建一个用户 `cmy@'192.168.10.1'`，并设置一个新的密码。因为 `192.168.10.1` 的优先级高于 `192.%`，所以来自 `192.168.10.1` 的用户将不能再使用旧密码进行登录。

## 常用运维命令

<!-- 知识类型: 命令索引 -->

| 操作 | 命令 |
| --- | --- |
| 创建用户 | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| 查看用户授权 | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| 修改用户 | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| 修改密码 | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| 删除用户 | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| 设置用户属性 | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| 查看用户属性 | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 登录失败 / 身份混淆 / 密码遗忘 -->

### Q: 忘记密码如何重置？

如果忘记了密码无法登录 Doris，可以按如下步骤恢复：

1. 在 FE 的 config 文件中添加参数：

    ```text
    skip_localhost_auth_check = true
    ```

2. 重启 FE。
3. 在 FE 本机通过 root 用户无密码登录 Doris。
4. 登录后通过 `SET PASSWORD` 命令重置密码。

### Q: root 用户的密码可以被其他用户重置吗？

不可以。**任何用户都不能重置 root 用户的密码，除了 root 用户自己**。

### Q: `current_user()` 和 `user()` 有什么区别？

用户可以通过 `SELECT current_user()` 和 `SELECT user()` 分别查看 `current_user` 和 `user`：

- `current_user`：当前用户是以哪种身份通过认证系统的（对应创建用户时的 `user_identity`）。
- `user`：用户当前实际的 User Identity（包含真实客户端 IP）。

举例说明：假设创建了 `user1@'192.%'` 这个用户，然后来自 `192.168.10.1` 的用户 `user1` 登录了系统，则此时的 `current_user` 为 `user1@'192.%'`，而 `user` 为 `user1@'192.168.10.1'`。

所有权限都是赋予某一个 `current_user` 的，真实用户拥有对应的 `current_user` 的所有权限。

### Q: 用户登录被拒，但密码确认正确？

通常是命中了[用户身份匹配优先级](#用户身份匹配优先级)规则——客户端 IP 匹配到了一个更精确的 `user_identity`，应使用该 `user_identity` 对应的密码登录。可通过以下命令确认实际匹配到的身份：

```sql
SELECT current_user();
```
