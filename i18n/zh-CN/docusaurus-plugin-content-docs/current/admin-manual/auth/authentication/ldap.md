---
{
    "title": "LDAP",
    "language": "zh-CN",
    "description": "详解 Apache Doris 联邦认证：通过集成 LDAP/LDAPS 实现统一身份验证与组授权，涵盖配置步骤、登录方式、权限映射规则及常见问题排查。"
}
---

Doris 支持接入第三方 LDAP 服务，提供验证登录和组授权两大核心功能：

- **验证登录**：使用 LDAP 密码替代 Doris 密码进行身份认证。
- **组授权**：将 LDAP 中的 `group` 映射为 Doris 中的 `role`，实现统一权限管理。

## LDAP 基础概念

在 LDAP 中，数据按照树型结构组织。以下是一个典型的 LDAP 目录树示例：

```text
- dc=example,dc=com
    - ou = ou1
        - cn = group1
        - cn = user1
    - ou = ou2
        - cn = group2
            - cn = user2
    - cn = user3
```

### 名词解释

| 名词 | 全称 | 说明 |
| --- | --- | --- |
| `dc` | Domain Component | 组织的域名，作为树的根结点 |
| `dn` | Distinguished Name | 唯一名称。例如 user1 的 `dn` 为 `cn=user1,ou=ou1,dc=example,dc=com`，user2 的 `dn` 为 `cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | `dn` 的一部分。user1 的四个 `rdn` 为 `cn=user1`、`ou=ou1`、`dc=example` 和 `dc=com` |
| `ou` | Organization Unit | 子组织。`user` 可以放在 `ou` 中，也可以直接放在 example.com 域中 |
| `cn` | Common Name | 名字 |
| `group` | - | 组，对应 Doris 的角色 |
| `user` | - | 用户，与 Doris 的用户等价 |
| `objectClass` | - | 数据的类型。用于区分节点是 `group` 还是 `user`。`group` 要求有 `cn` 和 `member`（`user` 列表）属性，`user` 要求有 `cn`、`password`、`uid` 等属性 |

## 快速开始

### 第一步：配置 Doris

1. 在 `fe/conf/fe.conf` 中设置认证方式：`authentication_type=ldap`。
2. 在 `fe/conf/ldap.conf` 中配置 LDAP 服务的连接信息：

    ```
    ldap_authentication_enabled = true
    ldap_host = ladp-host
    ldap_port = 389
    ldap_admin_name = uid=admin,o=emr
    ldap_user_basedn = ou=people,o=emr
    ldap_user_filter = (&(uid={login}))
    ldap_group_basedn = ou=group,o=emr
    ```

    > 如需启用 LDAPS（加密连接至 LDAP 服务器），请参阅下文 [LDAPS（加密连接）](#ldaps加密连接) 章节。

3. 启动 `fe` 后，使用 `root` 或 `admin` 账号登录 Doris，设置 LDAP 管理员密码：

    ```sql
    set ldap_admin_password = password('<ldap_admin_password>');
    ```

### 第二步：客户端连接

LDAP 认证要求客户端以明文方式发送密码，因此需要启用明文验证插件。

**MySQL Client**

可以通过以下任一方式启用明文验证插件：

- **方式一**：设置环境变量（永久生效）

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **方式二**：登录时添加参数（单次生效）

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

**JDBC Client**

1. Doris 未开启 SSL

    Doris 未开启 SSL 的情况下，使用 JDBC 连接时，需要自定义认证插件以绕过 SSL 限制：

    1. 创建自定义插件类，继承 `MysqlClearPasswordPlugin` 并重写 `requiresConfidentiality()` 方法：

        ```java
        public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
            @Override
            public boolean requiresConfidentiality() {
                return false;
            }
        }
        ```

    2. 在 JDBC 连接 URL 中配置自定义插件（将 `xxx` 替换为实际的包名）：

        ```sql
        jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
        ```

        需要配置的三个属性说明：

        | 属性 | 说明 |
        | --- | --- |
        | `authenticationPlugins` | 注册自定义的明文认证插件 |
        | `defaultAuthenticationPlugin` | 将自定义插件设为默认认证插件 |
        | `disabledAuthenticationPlugins` | 禁用原始的明文认证插件（该插件强制要求 SSL） |

    > 可以参考[该代码库](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test) 中的相关示例。或执行 `build-auth-plugin.sh` 可直接生成上述插件 jar 包。然后放置到客户端指定位置。

2. Doris 开启 SSL

    Doris 开启 SSL 的情况下（`fe.conf` 中添加 `enable_ssl=true`）：

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
    ```

## 验证登录

LDAP 验证登录是指通过 LDAP 服务进行密码验证，以补充 Doris 自身的认证机制。密码验证的优先级如下：

1. Doris 优先使用 LDAP 验证用户密码。
2. 如果 LDAP 中不存在该用户，则回退到 Doris 本地密码验证。
3. 如果 LDAP 密码正确但 Doris 中没有对应账户，则创建临时用户登录。

### 登录行为总览

开启 LDAP 后，不同用户状态下的登录行为如下：

| LDAP 用户 | Doris 用户 | 使用密码    | 登录结果 | 登录身份          |
| --------- | ---------- | ----------- | -------- | ----------------- |
| 存在      | 存在       | LDAP 密码   | 成功     | Doris 用户        |
| 存在      | 存在       | Doris 密码  | 失败     | -                 |
| 不存在    | 存在       | Doris 密码  | 成功     | Doris 用户        |
| 存在      | 不存在     | LDAP 密码   | 成功     | LDAP 临时用户     |

> **关于临时用户：**
>
> - 临时账户仅对当前连接有效，连接断开后自动销毁。
> - Doris 不会为临时用户创建持久化的用户元数据。
> - 临时用户的权限由 LDAP 组授权决定（详见下文"组授权"章节）。
> - 如果临时用户没有对应的组权限，则默认拥有 `information_schema` 的 `select_priv` 权限。

### 登录示例

以下示例假设已开启 LDAP 认证，配置 `ldap_user_filter = (&(uid={login}))`，且客户端已设置 `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`。

**场景一：Doris 和 LDAP 中都存在账户**

- Doris 账户：`jack@'172.10.1.10'`，密码：`123456`
- LDAP 用户属性：`uid: jack`，密码：`abcdef`

使用 LDAP 密码登录，成功：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

使用 Doris 密码登录，失败（开启 LDAP 后，LDAP 用户必须使用 LDAP 密码）：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**场景二：仅 LDAP 中存在用户**

- LDAP 用户属性：`uid: jack`，密码：`abcdef`

使用 LDAP 密码登录，Doris 自动创建临时用户 `jack@'%'` 并登录。临时用户具有基本权限 `DatabasePrivs`：`Select_priv`，断开连接后自动销毁：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**场景三：仅 Doris 中存在账户**

- Doris 账户：`jack@'172.10.1.10'`，密码：`123456`

LDAP 中不存在该用户，回退到 Doris 本地认证，使用 Doris 密码登录成功：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

## 组授权

LDAP 组授权是将 LDAP 中的 `group` 映射到 Doris 中的 `role`，从而实现集中化的权限管理。其核心机制为：

- 如果 LDAP 用户的 `dn` 出现在某个 LDAP 组节点的 `member` 属性中，则 Doris 认为该用户属于该组。
- 用户登录时，Doris 自动授予其所属 LDAP 组对应的 `role` 权限。
- 用户退出登录后，Doris 自动撤销这些 `role` 权限。

> **前提条件：** 使用 LDAP 组授权前，需要先在 Doris 中创建与 LDAP `group` 同名的 `role`，并为 `role` 授权。

### 权限合并规则

登录用户的最终权限取决于其在 LDAP 和 Doris 中的状态：

| LDAP 用户 | Doris 用户 | 最终权限                       |
| --------- | ---------- | ------------------------------ |
| 存在      | 存在       | LDAP 组权限 + Doris 用户权限   |
| 不存在    | 存在       | Doris 用户权限                 |
| 存在      | 不存在     | LDAP 组权限                    |

### 组名映射规则

Doris 会截取 LDAP 组 `dn` 的第一个 `Rdn` 作为组名，并与 Doris 中同名的 `role` 进行映射。

例如用户 `dn` 为 `uid=jack,ou=aidp,dc=domain,dc=com`，所属组信息如下：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

该组 `dn` 的第一个 `Rdn` 为 `cn=doris_rd`，因此组名为 `doris_rd`，对应 Doris 中的 `role` `doris_rd`。

### 组授权示例

假如用户 jack 属于 LDAP 组 `doris_rd`、`doris_qa`、`doris_pm`，同时 Doris 中存在同名的 `role`：`doris_rd`、`doris_qa`、`doris_pm`。那么 jack 登录后，除了拥有其 Doris 账户原有的权限外，还将额外获得这三个 `role` 的权限。

> **注意：**
>
> - `user` 属于哪个 `group` 与 LDAP 树的组织结构无关。上文示例中的 `user2` 并不一定属于 `group2`。
> - 若想让 `user2` 属于 `group2`，需要在 `group2` 的 `member` 属性中显式添加 `user2`。

## LDAPS（加密连接）

:::info 自 4.0.5 版本开始支持
:::

默认情况下，Doris 通过明文 LDAP 协议与 LDAP 服务器通信。自 4.0.5 版本起，Doris 支持 LDAPS（LDAP over SSL/TLS），用于加密 Doris FE 与 LDAP 服务器之间的连接。

### 启用 LDAPS

在 `fe/conf/ldap.conf` 中添加以下配置以启用 LDAPS：

```
ldap_use_ssl = true
```

当 `ldap_use_ssl` 设置为 `true` 时，Doris 使用 `ldaps://` 协议连接 LDAP 服务器。同时应将端口更新为标准 LDAPS 端口（通常为 `636`）：

```
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

### 配置证书信任

使用 LDAPS 时，LDAP 服务器的 SSL 证书必须被 Doris FE 的 JVM 所信任。如果 LDAP 服务器使用的证书由知名公共 CA 签发，则无需额外配置。

如果使用自定义或自签名 CA，需要将 CA 证书导入 Java trustStore，并配置 JVM 使用该 trustStore。在 `fe/conf/fe.conf` 的 `JAVA_OPTS` 中添加以下参数：

```
# JDK 17 示例
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

> **导入自签名 CA 证书的步骤：**
>
> 1. 获取 CA 证书文件（例如 `ca.crt`）。
> 2. 使用 `keytool` 将其导入 Java trustStore：
>
>     ```shell
>     keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
>     ```
>
> 3. 按上述方式在 `JAVA_OPTS` 中配置 trustStore 路径。
> 4. 重启 Doris FE 使配置生效。

## 缓存管理

为了避免频繁访问 LDAP 服务，Doris 会将 LDAP 信息缓存到内存中。

| 配置项 | 说明 | 默认值 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAP 用户信息的缓存时间（秒） | 43200（12 小时） |

在以下场景中，可能需要手动刷新缓存以使变更立即生效：

- 修改了 LDAP 服务中的用户或组信息。
- 修改了 Doris 中 LDAP 用户组对应的 `Role` 权限。

可以通过 `refresh ldap` 语句刷新缓存，详细查看 [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)。

## 已知限制

- Doris 的 LDAP 功能在客户端到 FE 的链路上仅支持明文密码验证，即用户登录时，密码在 `client` 与 `fe` 之间以明文形式传输。客户端与 Doris FE 之间的 SSL/TLS 加密需要单独配置（详见[客户端连接](#第二步客户端连接)）。
- FE 到 LDAP 服务器的链路默认使用明文传输（`ldap_use_ssl = false`）。如需加密该链路，请设置 `ldap_use_ssl = true` 以启用 LDAPS（详见 [LDAPS（加密连接）](#ldaps加密连接)）。

## 常见问题

**Q：如何查看 LDAP 用户在 Doris 中拥有哪些角色？**

使用 LDAP 用户登录 Doris 后，执行 `show grants;` 即可查看当前用户的所有角色。其中 `ldapDefaultRole` 是每个 LDAP 用户都拥有的默认角色。

**Q：LDAP 用户在 Doris 中的角色比预期少，如何排查？**

按以下步骤逐项检查：

1. 执行 `show roles;` 确认预期的角色在 Doris 中是否存在。如果不存在，需要通过 `CREATE ROLE role_name;` 创建。
2. 检查预期的 `group` 是否位于 `ldap_group_basedn` 对应的组织结构下。
3. 检查预期的 `group` 是否包含 `member` 属性。
4. 检查预期 `group` 的 `member` 属性中是否包含当前用户的 `dn`。

**Q：LDAPS 连接失败，如何排查？**

按以下步骤逐项检查：

1. 确认 `fe/conf/ldap.conf` 中已设置 `ldap_use_ssl = true`。
2. 确认 `ldap_port` 已设置为正确的 LDAPS 端口（通常为 `636`）。
3. 检查 LDAP 服务器的 SSL 证书是否被 JVM 信任。查看 `fe.log` 中是否有 `SSLHandshakeException` 或 `PKIX path building failed` 等 SSL 握手错误。
4. 如果使用自签名 CA，确认 CA 证书已导入 trustStore，且 `JAVA_OPTS` 中的 trustStore 路径配置正确。
