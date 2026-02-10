---
{
    "title": "内置认证",
    "language": "zh-CN",
    "description": "在 Doris 中，一个 useridentity 唯一标识一个用户。useridentity 由两部分组成，username 和 host，其中 username 为用户名。host 标识用户端连接所在的主机地址。host 部分可以使用 % 进行模糊匹配。如果不指定 host，默认为 '%'，"
}
---

## 关键概念
### 用户

在 Doris 中，一个 user_identity 唯一标识一个用户。user_identity 由两部分组成，user_name 和 host，其中 username 为用户名。host 标识用户端连接所在的主机地址。host 部分可以使用 % 进行模糊匹配。如果不指定 host，默认为 '%'，即表示该用户可以从任意 host 连接到 Doris。

#### 用户属性

用户属性直接附属于 user_name，而不是 user_identity，即 user@'192.%' 和 user@['domain'] 都拥有同一组用户属性。该属性属于 user，而不是 user@'192.%' 或 user@['domain']。

用户属性包括但不限于：用户最大连接数、导入集群配置等等。

#### 内置用户

内置用户是 Doris 默认创建的用户，并默认拥有一定的权限，包括 root 和 admin。初始密码都为空，fe 启动后，可以通过修改密码命令进行修改。不支持删除默认用户。

- root@'%'：root 用户，允许从任意节点登录，角色为 operator。
- admin@'%'：admin 用户，允许从任意节点登录，角色为 admin。

### 密码

用户登录的凭据，管理员创建用户时设置，也可以创建后由用户自己更改密码。

#### 密码策略

Doris 支持以下密码策略，可以帮助用户更好的进行密码管理。

- `PASSWORD_HISTORY`

  是否允许当前用户重置密码时使用历史密码。如 `PASSWORD_HISTORY` 10 表示禁止使用过去 10 次设置过的密码为新密码。如果设置为 `PASSWORD_HISTORY DEFAULT`，则会使用全局变量 `password_history` 中的值。0 表示不启用这个功能。默认为 0。

  示例：

  - 设置全局变量：`SET GLOBAL password_history = 10`
  - 为用户设置：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

- `PASSWORD_EXPIRE`

  设置当前用户密码的过期时间。如 `PASSWORD_EXPIRE INTERVAL 10 DAY` 表示密码会在 10 天后过期。`PASSWORD_EXPIRE NEVER` 表示密码不过期。如果设置为 `PASSWORD_EXPIRE DEFAULT`，则会使用全局变量 `default_password_lifetime` 中的值（单位为 天）。默认为 NEVER（或 0），表示不会过期。

  示例：

  - 设置全局变量：`SET GLOBAL default_password_lifetime = 1`
  - 为用户设置：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

- `FAILED_LOGIN_ATTEMPTS` 和 `PASSWORD_LOCK_TIME`

  设置当前用户登录时，如果使用错误的密码登录 n 次后，账户将被锁定，并设置锁定时间。如 `FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` 表示如果 3 次错误登录，则账户会被锁定一天。管理员可以通过 ALTER USER 语句主动解锁被锁定的账户。

  示例：

  - 为用户设置：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

- 密码强度

  该功能由全局变量 `validate_password_policy` 控制。默认为 NONE/0，即不检查密码强度。如果设置为 STRONG/2，则密码必须包含“大写字母”，“小写字母”，“数字”和“特殊字符”中的 3 项，并且长度必须大于等于 8。

  示例：

    - `SET validate_password_policy=STRONG`

以上策略设置后，可以通过如下命令查看：

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

注意，需要使用单引号分别包裹 user 和 host 部分。比如：

```
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 认证机制

1. 客户端认证信息发送：客户端将用户的信息（如用户名、密码、数据库等）打包发送给 Doris 服务器。这些信息用于证明客户端的身份和请求访问的数据库。

2. 服务器认证：Doris 收到客户端的认证信息后，会进行验证。如果用户名、密码以及客户端的 IP 正确，并且该用户具有访问所选数据库的权限，则认证成功，Doris 会将用户个体映射到系统内的用户标识（User Identity）上。否则，认证失败，并返回相应的错误消息给客户端。

## 黑白名单

Doris 本身不支持黑名单，只有白名单功能，但我们可以通过某些方式来模拟黑名单。假设先创建了名为 `user@'192.%'` 的用户，表示允许来自 `192.*` 的用户登录。此时如果想禁止来自 `192.168.10.1` 的用户登录，则可以再创建一个用户 `cmy@'192.168.10.1'`，并设置一个新的密码。因为 `192.168.10.1` 的优先级高于 `192.%`，所以来自 `192.168.10.1` 的用户将不能再使用旧密码进行登录。

## 相关命令

- 创建用户：[CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER)
- 查看用户：[SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- 修改用户：[ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER)
- 修改密码：[SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)
- 删除用户：[DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER)
- 设置用户属性：[SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY)
- 查看用户属性：[SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY)

## 其它说明

1. 登录时 user_identity 优先级选择问题

    如上文介绍，`user_identity` 由 `user_name` 和 `host` 组成，但是用户登录的时候，只需要输入 `user_name`，所以由 Doris 根据客户端的 IP 来匹配相应的 `host`，从而决定使用哪个 `user_identity` 登录。

    如果 根据 客户端 ip 只能匹配到一个 `user_identity`，那么毫无疑问会匹配到这个 `user_identity`，但是当能够匹配到多个 `user_identity` 时，就会有如下的优先级问题。

    1. 域名与 ip 的优先级：

        假设创建了如下用户：

        ```sql
        CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
        CREATE USER user1@'ip1'IDENTIFIED BY "abcde";
        ```

        domain1 被解析为两个 IP：ip1 和 ip2。

        在优先级上，ip 优先于 域名，因此，当用户 user1 从 ip1 这台机器尝试使用密码 '12345' 登录 Doris 会被拒绝。

    2. 具体 ip 和 范围 ip 的优先级：

      假设创建了如下用户：

      ```sql
      CREATE USER user1@'%' IDENTIFIED BY "12345";
      CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
      ```

      在优先级上，'192.%' 优先于 '%'，因此，当用户 user1 从 192.168.1.1 这台机器尝试使用密码 '12345' 登录 Doris 会被拒绝。

2. 忘记密码

    如果忘记了密码无法登录 Doris，可以在 FE 的 config 文件中添加 skip_localhost_auth_check=true 参数，并且重启 FE，从而无密码在 Fe 本机通过 root 登录 Doris。

    登录后，可以通过 SET PASSWORD 命令重置密码。

3. 任何用户都不能重置 root 用户的密码，除了 root 用户自己。

4. `current_user()` 和 `user()`

    用户可以通过 `SELECT current_user()` 和 `SELECT user()` 分别查看 `current_user` 和 `user`。其中 `current_user` 表示当前用户是以哪种身份通过认证系统的，而 `user` 则是用户当前实际的 User Identity。

    举例说明：

    假设创建了 `user1@'192.%'` 这个用户，然后以为来自 `192.168.10.1` 的用户 `user1` 登录了系统，则此时的 `current_user` 为 `user1@'192.%'`，而 `user` 为 `user1@'192.168.10.1'`。

    所有的权限都是赋予某一个 `current_user` 的，真实用户拥有对应的 `current_user` 的所有权限。
