---
{
    "title": "基于 LDAP 的用户认证",
    "language": "zh-CN",
    "description": "接入第三方 LDAP 服务为 Doris 提供验证登录和组授权服务。"
}
---

# LDAP

接入第三方 LDAP 服务为 Doris 提供验证登录和组授权服务。

LDAP 验证登录指的是接入 LDAP 服务的密码验证来补充 Doris 的验证登录。Doris 优先使用 LDAP 验证用户密码，如果 LDAP 服务中不存在该用户则继续使用 Doris 验证密码，如果 LDAP 密码正确但是 Doris 中没有对应账户则创建临时用户登录 Doris。

LDAP 组授权是将 LDAP 中的 group 映射到 Doris 中的 Role，如果用户在 LDAP 中属于多个用户组，登录 Doris 后用户将获得所有组对应 Role 的权限，要求组名与 Role 名字相同。

## 名词解释

- LDAP：轻量级目录访问协议，能够实现账号密码的集中管理。
- 权限 Privilege：权限作用的对象是节点、数据库或表。不同的权限代表不同的操作许可。
- 角色 Role：Doris 可以创建自定义命名的角色。角色可以被看做是一组权限的集合。

## LDAP 相关概念

在 LDAP 中，数据是按照树型结构组织的。

### 示例（下文的介绍都将根据这个例子进行展开）

```
- dc=example,dc=com
 - ou = ou1
   - cn = group1
   - cn = user1
 - ou = ou2
   - cn = group2
     - cn = user2
 - cn = user3
```

### LDAP 名词解释

- dc(Domain Component): 可以理解为一个组织的域名，作为树的根结点
- dn(Distinguished Name): 相当于唯一名称，例如 user1 的 dn 为 cn=user1,ou=ou1,dc=example,dc=com user2 的 dn 为 cn=user2,cn=group2,ou=ou2,dc=example,dc=com
- rdn(Relative Distinguished Name): dn 的一部分，user1 的四个 rdn 为 cn=user1 ou=ou1 dc=example 和 dc=com
- ou(Organization Unit): 可以理解为子组织，user 可以放在 ou 中，也可以直接放在 example.com 域中
- cn(common name):名字
- group: 组，可以理解为 doris 的角色
- user: 用户，和 doris 的用户等价
- objectClass：可以理解为每行数据的类型，比如怎么区分 group1 是 group 还是 user，每种类型的数据下面要求有不同的属性，比如 group 要求有 cn 和 member（user 列表），user 要求有 cn,password,uid 等

## 启用 LDAP 认证

### server 端配置

在 `fe/conf/fe.conf` 文件中配置认证方式为 ldap `authentication_type=ldap`。

在 `fe/conf/ldap.conf` 文件中配置 LDAP 基本信息，

另有 LDAP 管理员密码需要使用 sql 语句进行设置。

#### 配置 `fe/conf/ldap.conf` 文件

- `ldap_host = 127.0.0.1`

  LDAP 服务 ip。

- `ldap_port = 389`

  LDAP 服务端口，默认明文传输端口为 389，目前 Doris 的 LDAP 功能仅支持明文密码传输。

- `ldap_admin_name = cn=admin,dc=domain,dc=com`

  LDAP 管理员账户“Distinguished Name”。当用户使用 LDAP 身份验证 Doris 时，Doris 会绑定该管理员账户在 LDAP 中搜索用户信息。

- `ldap_user_basedn = ou=people,dc=domain,dc=com`

  Doris 在 LDAP 中搜索用户信息时的 base dn，例如只允许上例中的 user2 登陆 Doris，此处配置为 ou=ou2,dc=example,dc=com 如果允许上例中的 user1,user2,user3 都能登陆 Doris，此处配置为 dc=example,dc=com

- `ldap_user_filter = (&(uid={login}))`

  Doris 在 LDAP 中搜索用户信息时的过滤条件，占位符 `{login}` 会被替换为登录用户名。必须保证通过该过滤条件搜索的用户唯一，否则 Doris 无法通过 LDAP 验证密码，登录时会出现 `ERROR 5081 (42000): user is not unique in LDAP server.` 的错误信息。

  例如使用 LDAP 用户节点 uid 属性作为登录 Doris 的用户名可以配置该项为：

  `ldap_user_filter = (&(uid={login}))`

  使用 LDAP 用户邮箱前缀作为用户名可配置该项：

  `ldap_user_filter = (&(mail={login}@baidu.com))`

- `ldap_group_basedn = ou=group,dc=domain,dc=com`

  Doris 在 LDAP 中搜索组信息时的 base dn。如果不配置该项，将不启用 LDAP 组授权。同 `ldap_user_basedn` 类似，限制 doris 搜索 group 时的范围。

#### 设置 LDAP 管理员密码

配置好 ldap.conf 文件后启动 fe，使用 root 或 admin 账号登录 Doris，执行 sql：

```sql
set ldap_admin_password = password('ldap_admin_password');
```

### Client 端配置

#### MySql Client

客户端使用 LDAP 验证需要启用 mysql 客户端明文验证插件，使用命令行登录 Doris 可以使用下面两种方式之一启用 mysql 明文验证插件：

- 设置环境变量 `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN` 值 1

  例如在 linux 或者 mac 环境中可以使用：

  ```shell
  echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ～/.bash_profile && source ～/.bash_profile
  ```

- 每次登录 Doris 时添加参数 `--enable-cleartext-plugin`

  ```shell
  mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
  
  输入 ldap 密码
  ```
#### Jdbc Client

使用 Jdbc Client 登录 Doris 时，需要自定义 plugin。

首先，创建一个名为 MysqlClearPasswordPluginWithoutSSL 的类，继承自 MysqlClearPasswordPlugin。在该类中，重写 requiresConfidentiality() 方法，并返回 false。

``` java
public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
@Override  
public boolean requiresConfidentiality() {
    return false;
  }
}
```
在获取数据库连接时，需要将自定义的 plugin 配置到属性中

即（xxx 为自定义类的包名）
- authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL 
- defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
- disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin

eg:
```sql
 jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";

```

## LDAP 认证详解

LDAP 密码验证和组授权是 Doris 密码验证和授权的补充，开启 LDAP 功能并不能完全替代 Doris 的密码验证和授权，而是与 Doris 密码验证和授权并存。

### LDAP 验证登录详解

开启 LDAP 后，用户在 Doris 和 LDAP 中存在以下几种情况：

| LDAP 用户 | Doris 用户 | 密码      | 登录情况 | 登录 Doris 的用户 |
| -------- | --------- | --------- | -------- | --------------- |
| 存在     | 存在      | LDAP 密码  | 登录成功 | Doris 用户       |
| 存在     | 存在      | Doris 密码 | 登录失败 | 无              |
| 不存在   | 存在      | Doris 密码 | 登录成功 | Doris 用户       |
| 存在     | 不存在    | LDAP 密码  | 登录成功 | Ldap 临时用户    |

开启 LDAP 后，用户使用 mysql client 登录时，Doris 会先通过 LDAP 服务验证用户密码，如果 LDAP 存在用户且密码正确，Doris 则使用该用户登录；此时 Doris 若存在对应账户则直接登录该账户，如果不存在对应账户则为用户创建临时账户并登录该账户。临时账户具有具有相应对权限（参见 LDAP 组授权），仅对当前连接有效，Doris 不会创建该用户，也不会产生创建用户对元数据。
如果 LDAP 服务中不存在登录用户，则使用 Doris 进行密码认证。

以下假设已开启 LDAP 认证，配置 ldap_user_filter = (&(uid={login}))，且其他配置项都正确，客户端设置环境变量 LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1

例如：

1. Doris 和 LDAP 中都存在账户：

    存在 Doris 账户：`jack@'172.10.1.10'`，密码：`123456`

    LDAP 用户节点存在属性：`uid: jack` 用户密码：`abcdef`

    使用以下命令登录 Doris 可以登录 `jack@'172.10.1.10'` 账户：

    ```shell
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```

    使用以下命令将登录失败：
    
    ```shell
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```

2. LDAP 中存在用户，Doris 中不存在对应账户：

    LDAP 用户节点存在属性：`uid: jack` 用户密码：`abcdef`

    使用以下命令创建临时用户并登录 jack@'%'，临时用户具有基本权限 DatabasePrivs：Select_priv，用户退出登录后 Doris 将删除该临时用户：
    
    ```shell
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```

3. LDAP 不存在用户：

    存在 Doris 账户：`jack@'172.10.1.10'`，密码：`123456`

    使用 Doris 密码登录账户，成功：
    
    ```shell
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```

### LDAP 组授权详解

LDAP 用户 dn 是 LDAP 组节点的“member”属性则 Doris 认为用户属于该组。LDAP 组授权是将 LDAP 中的 group 映射到 Doris 中的 role，并将所有对应的 role 权限授予登录用户，用户退出登录后 Doris 会撤销对应的 role 权限。在使用 LDAP 组授权前应该在 Doris 中创建相应的 role，并为 role 授权。

登录用户权限跟 Doris 用户和组权限有关，见下表：

| LDAP 用户 | Doris 用户 | 登录用户的权限             |
| -------- | --------- | -------------------------- |
| 存在     | 存在      | LDAP 组权限 + Doris 用户权限 |
| 不存在   | 存在      | Doris 用户权限              |
| 存在     | 不存在    | LDAP 组权限                 |

如果登录的用户为临时用户，且不存在组权限，则该用户默认具有 information_schema 的 select_priv 权限

举例：

LDAP 用户 dn 是 LDAP 组节点的 `member` 属性则认为用户属于该组，Doris 会截取组 dn 的第一个 Rdn 作为组名。

例如用户 dn 为 `uid=jack,ou=aidp,dc=domain,dc=com`，组信息如下：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

则组名为 `doris_rd`。

假如 jack 还属于 LDAP 组 `doris_qa`、`doris_pm`；Doris 存在 role：`doris_rd`、`doris_qa`、`doris_pm`，在使用 LDAP 验证登录后，用户不但具有该账户原有的权限，还将获得 role `doris_rd`、`doris_qa` 和 `doris_pm` 的权限。

>注意：
>
> user 属于哪个 group 和 LDAP 树的组织结构无关，示例部分的 user2 并不一定属于 group2
> 若想让 user2 属于 group2，需要在 group2 的 member 属性中添加 user2

### LDAP 信息缓存

为了避免频繁访问 LDAP 服务，Doris 会将 LDAP 信息缓存到内存中，可以通过 ldap.conf 中的`ldap_user_cache_timeout_s`配置项指定 LDAP 用户的缓存时间，默认为 12 小时；在修改了 LDAP 服务中的信息或者修改了 Doris 中 LDAP 用户组对应的 Role 权限后，可能因为缓存而没有及时生效，可以通过 refresh ldap 语句刷新缓存，详细查看[REFRESH-LDAP](../../sql-manual/sql-statements/account-management/REFRESH-LDAP)。

## LDAP 验证的局限

- 目前 Doris 的 LDAP 功能只支持明文密码验证，即用户登录时，密码在 client 与 fe 之间、fe 与 LDAP 服务之间以明文的形式传输。

## 常见问题

- 怎么判断 LDAP 用户在 Doris 中有哪些角色？
  
  使用 LDAP 用户在 doris 中登录，`show grants;`能查看当前用户有哪些角色。其中 ldapDefaultRole 是每个 ldap 用户在 doris 中都有的默认角色。

- LDAP 用户在 Doris 中的角色比预期少怎么排查？

  1. 通过`show roles;`查看预期的角色在 doris 中是否存在，如果不存在，需要通过` CREATE ROLE role_name;`创建角色。
  2. 检查预期的 group 是否在`ldap_group_basedn`对应的组织结构下。
  3. 检查预期 group 是否包含 member 属性。
  4. 检查预期 group 的 member 属性是否包含当前用户。
