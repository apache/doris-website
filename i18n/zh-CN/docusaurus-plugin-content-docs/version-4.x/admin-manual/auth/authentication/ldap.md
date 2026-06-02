---
{
    "title": "LDAP",
    "language": "zh-CN",
    "description": "通过集成 LDAP/LDAPS 为 Apache Doris 配置统一身份验证与组授权，含登录方式、权限映射与常见问题。",
    "keywords": [
        "Doris LDAP",
        "Doris LDAPS",
        "LDAP 认证",
        "LDAP 组授权",
        "统一身份验证",
        "ldap.conf 配置",
        "ldap_default_roles",
        "MysqlClearPasswordPlugin",
        "ldap_admin_password",
        "ldap_use_ssl",
        "SSLHandshakeException",
        "PKIX path building failed",
        "明文密码插件",
        "cleartext plugin"
    ]
}
---

Apache Doris 支持接入第三方 LDAP 服务，将企业内已有的账号体系直接复用为 Doris 的身份与权限来源，避免重复维护用户和密码。LDAP 集成提供两大核心能力：

- **验证登录**：使用 LDAP 密码替代 Doris 密码进行身份认证。
- **组授权**：将 LDAP 中的 `group` 映射为 Doris 中的 `role`，实现统一权限管理。
- **默认角色授权**：为所有通过 LDAP 认证的用户授予配置好的 Doris 角色，无需将所有用户维护到同一个 LDAP 组中。

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 接入企业统一身份 / 集中权限管理 -->

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 企业统一身份认证 | 已有 LDAP/AD 账号体系，希望 Doris 用户直接复用，无需在 Doris 中重复创建账号 |
| 集中化权限管理 | 通过 LDAP 组管理角色成员，调整 LDAP 组成员即可批量调整 Doris 权限 |
| LDAP 用户基础权限 | 通过配置为所有 LDAP 认证用户授予相同的 Doris 角色，同时保留 LDAP 组授权 |
| 临时访问 | 仅在 LDAP 中存在的用户，可基于 LDAP 组权限以临时用户身份登录 Doris |
| 加密链路 | 需要 Doris FE 与 LDAP 服务器之间的连接加密（LDAPS） |

## 前置条件

- 已部署可访问的 LDAP/AD 服务，并掌握以下信息：
    - LDAP 服务的 `host` 与端口（明文 `389`、LDAPS `636`）
    - 管理员账号 `dn` 及密码
    - 用户与组的 `basedn`
    - 用户过滤器（`ldap_user_filter`）
- 已具备 Doris 集群的 FE 配置文件读写权限，可重启 FE。
- 已具备 `root` 或 `admin` 账号用于设置 LDAP 管理员密码。
- 启用 LDAPS 时需要 Doris 版本 **4.0.5** 或更高。

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

## 接入流程总览

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次接入 LDAP -->

1. **配置 Doris FE**：在 `fe.conf` 中切换认证方式，并在 `ldap.conf` 中填写 LDAP 服务连接信息。
2. **设置 LDAP 管理员密码**：登录 Doris 后，通过 SQL 写入 `ldap_admin_password`。
3. **配置客户端**：MySQL Client 或 JDBC Client 启用明文密码插件，以便发送 LDAP 密码。
4. **（可选）启用 LDAPS**：加密 FE 与 LDAP 之间的链路。
5. **（可选）配置组授权**：在 Doris 中创建与 LDAP 组同名的 `role` 并授权。
6. **（可选）配置默认角色**：通过 `ldap_default_roles` 为所有 LDAP 认证用户授予基础 Doris 角色。

## 第一步：配置 Doris FE

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: FE 端 LDAP 接入配置 -->

### 1.1 切换认证方式

在 `fe/conf/fe.conf` 中设置认证方式：

```text
authentication_type=ldap
```

### 1.2 配置 LDAP 连接信息

在 `fe/conf/ldap.conf` 中填写 LDAP 服务的连接信息：

```text
ldap_authentication_enabled = true
ldap_host = ladp-host
ldap_port = 389
ldap_admin_name = uid=admin,o=emr
ldap_user_basedn = ou=people,o=emr
ldap_user_filter = (&(uid={login}))
ldap_group_basedn = ou=group,o=emr
ldap_default_roles = ldap_readonly,ldap_query_user
```

各配置项含义如下：

| 配置项 | 说明 |
| --- | --- |
| `ldap_authentication_enabled` | 是否启用 LDAP 认证，必须为 `true` |
| `ldap_host` | LDAP 服务器地址 |
| `ldap_port` | LDAP 服务端口，明文 LDAP 默认 `389`，LDAPS 默认 `636` |
| `ldap_admin_name` | LDAP 管理员 `dn`，Doris 使用该账号去查询用户和组信息 |
| `ldap_user_basedn` | 用户搜索的基准 `dn` |
| `ldap_user_filter` | 用户匹配过滤器，`{login}` 会被替换为登录用户名 |
| `ldap_group_basedn` | 组搜索的基准 `dn`，用于组授权 |
| `ldap_default_roles` | 可选。为所有 LDAP 认证用户授予的 Doris 角色，多个角色用逗号分隔。这些角色会在 LDAP 组角色之外额外授予（自 4.0.7、4.1.3 版本开始支持） |

:::tip
如需启用 LDAPS（加密连接至 LDAP 服务器），请参阅下文 [LDAPS（加密连接）](#ldaps加密连接) 章节。
:::

### 1.3 设置 LDAP 管理员密码

启动 FE 后，使用 `root` 或 `admin` 账号登录 Doris，写入 LDAP 管理员密码：

```sql
set ldap_admin_password = password('<ldap_admin_password>');
```

该密码即 `ldap_admin_name` 对应账号的密码，Doris 使用它向 LDAP 服务发起查询。

## 第二步：客户端连接

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 客户端启用明文密码插件 -->

LDAP 认证要求客户端以明文方式发送密码，因此需要启用明文验证插件。

### 2.1 MySQL Client

可以通过以下任一方式启用明文验证插件：

- **方式一**：设置环境变量（永久生效）

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **方式二**：登录时添加参数（单次生效）

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

### 2.2 JDBC Client

JDBC 默认要求明文密码插件在 SSL 之上使用。是否开启 SSL 决定了 JDBC URL 的写法：

#### 场景 A：Doris 未开启 SSL

需要自定义认证插件以绕过 SSL 限制：

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

:::tip
可以参考[该代码库](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test) 中的相关示例。执行 `build-auth-plugin.sh` 可直接生成上述插件 jar 包，然后放置到客户端指定位置。
:::

#### 场景 B：Doris 开启 SSL

在 `fe.conf` 中添加 `enable_ssl=true` 后，JDBC URL 可直接使用 MySQL 原生的明文密码插件：

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
```

## 验证登录

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 用户认证优先级理解 -->

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

:::info 关于临时用户

- 临时账户仅对当前连接有效，连接断开后自动销毁。
- Doris 不会为临时用户创建持久化的用户元数据。
- 临时用户的权限由 LDAP 组授权和 `ldap_default_roles` 决定（详见下文"组授权"和"LDAP 用户默认角色"章节）。
- 如果临时用户没有对应的组权限，也没有配置的默认角色，则默认拥有 `information_schema` 的 `select_priv` 权限。

:::

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

使用 LDAP 密码登录，Doris 自动创建临时用户 `jack@'%'` 并登录。如果存在可用角色，临时用户会获得 LDAP 组角色和配置的默认角色。如果没有匹配角色，则具有基本权限 `DatabasePrivs`：`Select_priv`，断开连接后自动销毁：

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

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: LDAP 组到 Doris role 的映射 -->

LDAP 组授权是将 LDAP 中的 `group` 映射到 Doris 中的 `role`，从而实现集中化的权限管理。其核心机制为：

- 如果 LDAP 用户的 `dn` 出现在某个 LDAP 组节点的 `member` 属性中，则 Doris 认为该用户属于该组。
- 用户登录时，Doris 自动授予其所属 LDAP 组对应的 `role` 权限。
- 如果配置了 `ldap_default_roles`，Doris 也会为该用户授予这些默认角色。
- 用户退出登录后，Doris 自动撤销这些 `role` 权限。

:::caution 前提条件
使用 LDAP 组授权前，需要先在 Doris 中创建与 LDAP `group` 同名的 `role`，并为 `role` 授权。
:::

### 权限合并规则

登录用户的最终权限取决于其在 LDAP 和 Doris 中的状态：

| LDAP 用户 | Doris 用户 | 最终权限                       |
| --------- | ---------- | ------------------------------ |
| 存在      | 存在       | LDAP 组权限 + 配置的默认角色 + Doris 用户权限 |
| 不存在    | 存在       | Doris 用户权限                 |
| 存在      | 不存在     | LDAP 组权限 + 配置的默认角色   |

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

:::note 注意

- `user` 属于哪个 `group` 与 LDAP 树的组织结构无关。上文示例中的 `user2` 并不一定属于 `group2`。
- 若想让 `user2` 属于 `group2`，需要在 `group2` 的 `member` 属性中显式添加 `user2`。

:::

## LDAP 用户默认角色

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 为所有 LDAP 认证用户授予基础 Doris 权限 -->

:::info 自 4.0.7、4.1.3 版本开始支持
:::

`ldap_default_roles` 用于为所有通过 LDAP 认证的用户授予基础 Doris 角色。当所有 LDAP 用户都需要一组相同的基础权限，但不适合在 LDAP 中维护一个包含所有用户的专用组时，可以使用该配置。

`ldap_default_roles` 不会替代 LDAP 组授权。LDAP 用户登录后，Doris 会合并以下权限：

- 用户所属 LDAP 组映射得到的 Doris 角色。
- `ldap_default_roles` 中配置的 Doris 角色。
- 如果 Doris 中也存在同名账号，则保留该 Doris 用户已有的权限。
- 内置的 `ldapDefaultRole`，用于提供 `information_schema` 上的 `select_priv` 权限。

:::caution 前提条件
`ldap_default_roles` 中列出的角色必须已经存在于 Doris 中。如果配置的角色不存在，Doris 会忽略该角色并记录 warning 日志。
:::

### 配置默认角色

先创建角色并为角色授权：

```sql
CREATE ROLE ldap_readonly;
CREATE ROLE ldap_query_user;

GRANT SELECT_PRIV ON internal.example_db.* TO ROLE 'ldap_readonly';
GRANT SELECT_PRIV ON internal.example_db.example_table TO ROLE 'ldap_query_user';
```

在 `fe/conf/ldap.conf` 中配置角色列表：

```text
ldap_default_roles = ldap_readonly,ldap_query_user
```

也可以在线修改该配置：

```sql
ADMIN SET FRONTEND CONFIG ("ldap_default_roles" = "ldap_readonly,ldap_query_user");
```

在线修改 `ldap_default_roles` 后，Doris 会自动刷新 LDAP 用户缓存，后续 LDAP 登录即可使用新的默认角色。

## LDAPS（加密连接）

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 加密 FE 与 LDAP 服务器之间的链路 -->

:::info 自 4.0.5 版本开始支持
:::

默认情况下，Doris 通过明文 LDAP 协议与 LDAP 服务器通信。自 4.0.5 版本起，Doris 支持 LDAPS（LDAP over SSL/TLS），用于加密 Doris FE 与 LDAP 服务器之间的连接。

### 启用 LDAPS

在 `fe/conf/ldap.conf` 中将端口更新为 LDAPS 端口（通常为 `636`），并启用 SSL：

```text
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

当 `ldap_use_ssl` 设置为 `true` 时，Doris 使用 `ldaps://` 协议连接 LDAP 服务器。

### 配置证书信任

使用 LDAPS 时，LDAP 服务器的 SSL 证书必须被 Doris FE 的 JVM 所信任：

- 如果 LDAP 服务器使用的证书由知名公共 CA 签发，则无需额外配置。
- 如果使用自定义或自签名 CA，需要将 CA 证书导入 Java trustStore，并配置 JVM 使用该 trustStore。

在 `fe/conf/fe.conf` 的 `JAVA_OPTS` 中添加 trustStore 参数，示例如下：

```text
# JDK 17 示例
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

导入自签名 CA 证书的完整步骤：

1. 获取 CA 证书文件（例如 `ca.crt`）。
2. 使用 `keytool` 将其导入 Java trustStore：

    ```shell
    keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
    ```

3. 按上述方式在 `JAVA_OPTS` 中配置 trustStore 路径。
4. 重启 Doris FE 使配置生效。

## 缓存管理

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: LDAP 信息变更后强制刷新 -->

为了避免频繁访问 LDAP 服务，Doris 会将 LDAP 信息缓存到内存中。

| 配置项 | 说明 | 默认值 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAP 用户信息的缓存时间（秒） | 43200（12 小时） |

在以下场景中，可能需要手动刷新缓存以使变更立即生效：

- 修改了 LDAP 服务中的用户或组信息。
- 修改了 Doris 中 LDAP 用户组对应的 `Role` 权限。

在线修改 `ldap_default_roles` 时，Doris 会自动刷新 LDAP 用户缓存。仅修改该配置时，不需要额外执行 `refresh ldap`。

可以通过 `refresh ldap` 语句刷新缓存，详细查看 [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)。

## 已知限制

- Doris 的 LDAP 功能在客户端到 FE 的链路上仅支持明文密码验证，即用户登录时，密码在 `client` 与 `fe` 之间以明文形式传输。客户端与 Doris FE 之间的 SSL/TLS 加密需要单独配置（详见[客户端连接](#第二步客户端连接)）。
- FE 到 LDAP 服务器的链路默认使用明文传输（`ldap_use_ssl = false`）。如需加密该链路，请设置 `ldap_use_ssl = true` 以启用 LDAPS（详见 [LDAPS（加密连接）](#ldaps加密连接)）。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 登录失败 / 角色缺失 / LDAPS 握手失败 -->

### Q: 如何查看 LDAP 用户在 Doris 中拥有哪些角色？

使用 LDAP 用户登录 Doris 后，执行 `show grants;` 即可查看当前用户的所有角色。其中 `ldapDefaultRole` 是每个 LDAP 用户都拥有的默认角色。

`ldapDefaultRole` 是 Doris 内置的临时角色，用于提供 `information_schema` 上的 `select_priv` 权限。它与 `ldap_default_roles` 中配置的角色不是同一个概念。

### Q: LDAP 用户在 Doris 中的角色比预期少，如何排查？

按以下步骤逐项检查：

1. 执行 `show roles;` 确认预期的角色在 Doris 中是否存在。如果不存在，需要通过 `CREATE ROLE role_name;` 创建。
2. 检查预期的 `group` 是否位于 `ldap_group_basedn` 对应的组织结构下。
3. 检查预期的 `group` 是否包含 `member` 属性。
4. 检查预期 `group` 的 `member` 属性中是否包含当前用户的 `dn`。
5. 如果缺少的是 `ldap_default_roles` 中配置的角色，检查角色名是否拼写正确，以及该角色是否已经在 Doris 中创建。

### Q: LDAPS 连接失败，如何排查？

按以下步骤逐项检查：

1. 确认 `fe/conf/ldap.conf` 中已设置 `ldap_use_ssl = true`。
2. 确认 `ldap_port` 已设置为正确的 LDAPS 端口（通常为 `636`）。
3. 检查 LDAP 服务器的 SSL 证书是否被 JVM 信任。查看 `fe.log` 中是否有 `SSLHandshakeException` 或 `PKIX path building failed` 等 SSL 握手错误。
4. 如果使用自签名 CA，确认 CA 证书已导入 trustStore，且 `JAVA_OPTS` 中的 trustStore 路径配置正确。
