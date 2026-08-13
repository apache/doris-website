---
{
    "title": "Ranger-Hive 鉴权",
    "language": "zh-CN",
    "description": "为 Hive Catalog 配置 Ranger-Hive 鉴权，包括 Ranger 服务、FE 配置文件、Catalog 属性、权限映射、行过滤、数据脱敏、Kerberos、HTTPS 与常见问题。",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog 鉴权",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "行级过滤",
        "数据脱敏",
        "Doris Hive Catalog Ranger 鉴权",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml 找不到",
        "Ranger Hive 策略下载失败",
        "Doris Current Ranger Hive"
    ]
}
---

<!-- 知识类型: 配置指南 / 权限管理 -->
<!-- 适用场景: Hive Catalog 鉴权 / 复用 Ranger Hive 策略 -->

Apache Doris 可以为单个 Hive Catalog 指定 Ranger-Hive Access Controller，使用 Apache Ranger 中已有的 Hive 策略校验该 Catalog 下数据库、表和列的访问权限，并支持 Ranger Row Level Filter、Data Masking 和审计。

如果已经使用 Ranger 管理 Hive，并希望 Doris 查询同一批 Hive 数据时复用这些策略，可以使用此模式。

Ranger-Hive 只接管配置了该 Access Controller 的 Hive Catalog，不会替代 Doris 集群级鉴权，也不会校验底层 HDFS、S3 等存储系统的 Ranger 策略。

## 适用场景

| 场景 | 是否适用 | 说明 |
| --- | --- | --- |
| Doris 查询 Hive 数据时复用已有 Ranger Hive 策略 | 适用 | 为对应 Hive Catalog 配置 Ranger-Hive Access Controller |
| 使用 Ranger 统一管理整个 Doris 集群的权限 | 不适用 | 应使用 Ranger-Doris |
| 校验 HDFS、S3 等底层存储访问 | 不适用 | 应在存储侧配置访问控制和凭据隔离 |
| 为非 Hive/HMS Catalog 配置 Ranger 鉴权 | 不适用 | Ranger-Hive 只适用于 Hive/HMS Catalog |

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: Ranger-Doris 与 Ranger-Hive 选型 / 鉴权边界确认 -->

## Ranger-Doris 与 Ranger-Hive 的区别

Ranger-Doris 和 Ranger-Hive 解决的问题不同：

| 对比项 | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| 主要用途 | 使用 Ranger 集中管理 Doris 集群权限 | 让指定 Hive Catalog 使用 Ranger Hive 策略 |
| 启用位置 | FE 配置项 `access_controller_type=ranger-doris` | `CREATE CATALOG` 属性 `access_controller.class` |
| Ranger 服务类型 | Doris，需要安装 Doris Ranger 插件和服务定义 | Hive，使用 Ranger 自带的 Hive 服务定义 |
| 资源层级 | Global、Catalog、Database、Table、Column 等 Doris 资源 | Database、Table、Column 等 Hive 资源 |
| 影响范围 | Doris 默认 Access Controller，影响整个集群 | 仅影响配置该属性的外部 Catalog |
| 策略是否互通 | 不会自动转换成 Hive 策略 | 不会自动读取 Ranger-Doris 策略 |

同一个 Doris 集群可以同时使用两者。例如，集群默认使用 Ranger-Doris，而 `hive_ctl` 单独使用 Ranger-Hive。只要 Hive Catalog 配置了 Ranger-Hive，权限请求就会按下表路由；表中的“默认 Access Controller”可以是 Doris 内置鉴权，也可以是 Ranger-Doris。

### 鉴权边界

| 权限范围 | 校验方 | 说明 |
| --- | --- | --- |
| Global | 默认 Access Controller | Ranger-Hive 不定义 Doris Global 资源 |
| Catalog | 默认 Access Controller | Ranger Hive 资源模型中没有 Doris Catalog 层级 |
| Database | 当前 Catalog 的 Ranger-Hive | 请求中的资源名为 Hive database |
| Table / View | 当前 Catalog 的 Ranger-Hive | 请求中的资源名为 Hive database + table |
| Column | 当前 Catalog 的 Ranger-Hive | 每个被访问列都会单独校验 |
| Row Level Filter | 当前 Catalog 的 Ranger-Hive | 查询时从 Ranger 获取过滤表达式；`root` 和 `admin` 用户不应用该策略 |
| Data Masking | 当前 Catalog 的 Ranger-Hive | 查询时从 Ranger 获取列脱敏规则；`root` 和 `admin` 用户不应用该策略 |
| Resource、Storage Vault、Compute Group | 默认 Access Controller | 不属于 Ranger-Hive 的资源模型 |
| HDFS、S3 等底层存储 | 不由 Ranger-Hive 校验 | Doris 仍使用 Catalog 中配置的存储凭证读取数据 |

:::warning
默认 Access Controller 授予的对应 Global 权限会使数据库、表和列的最终权限检查通过。验证 Ranger-Hive 拒绝策略时，不要使用 `root`、`admin` 或拥有 Global `SELECT_PRIV` / `ADMIN_PRIV` 的账号。
:::

## 前置条件

- 已部署 Ranger Admin，且每个 Doris FE 都能访问 Ranger Admin 地址。
- Ranger 中已创建 Hive 类型的服务。本文示例中的 Service Name 为 `hive_prod`。
- 已具备创建 Doris 用户和 Catalog 的权限。Ranger 只负责鉴权，不负责创建 Doris 用户或验证用户密码。
- Hive Catalog 本身已具备访问 Hive Metastore 和底层存储的网络、认证与权限配置。
- 所有 FE 节点均可读取 Ranger 配置文件；配置本地策略缓存时，FE 进程用户可创建或写入对应目录。

## 配置流程总览

本文以 Ranger WebUI 中的 Hive 服务 `hive_prod`、Doris Catalog `hive_ctl` 和用户 `alice` 为例，配置步骤如下：

1. 在 Ranger WebUI 中确认或创建 Hive 服务 `hive_prod`。
2. 在所有 FE 上部署 `ranger-hive-security.xml` 和 `ranger-hive-audit.xml`，创建策略缓存目录，然后重启 FE。
3. 在 Doris 中创建用户 `alice` 和启用 Ranger-Hive 的 Hive Catalog `hive_ctl`。
4. 在 Ranger 的 `hive_prod` 服务中为 `alice` 创建访问策略。
5. 使用 `alice` 登录 Doris，分别验证允许和拒绝访问。

Ranger Admin 开启 Kerberos 或 HTTPS 时，先完成基础配置，再按本文对应章节补充安全配置。

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: Ranger-Hive 基础配置 -->

## 配置 Ranger 服务与 FE

### 确认 Ranger Hive 服务

在 Ranger WebUI 的 Service Manager 页面确认或创建一个 Hive 服务：

| Ranger WebUI 字段 | 示例值 | 说明 |
| --- | --- | --- |
| Service Type | `Hive` | 必须使用 Ranger 的 Hive 服务定义，不需要安装 Doris Ranger 插件 |
| Service Name | `hive_prod` | Ranger 中实际保存 Hive 策略的服务实例名称 |

如果 HiveServer2 已经使用 `hive_prod`，Doris 可以读取同一服务中的策略，无需再创建一个名称不同的 Hive 服务。

### 在所有 FE 上准备配置文件

在每个 FE 的 `fe/conf/` 目录中放置以下文件：

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # 仅 Ranger Admin 使用 HTTPS/双向 TLS 时需要
```

`ranger-hive-security.xml` 和 `ranger-hive-audit.xml` 需要成对部署。即使不需要审计，也应保留 `ranger-hive-audit.xml` 并显式关闭审计，以避开 Ranger 2.7 的旧审计配置回退问题，详见常见问题。`ranger-policymgr-ssl.xml` 仅在 Ranger Admin 使用 HTTPS 且需要自定义信任库或客户端证书时使用。

#### 配置 ranger-hive-security.xml

本文已经提供可直接使用的模板。将下列 XML 分别保存到每个 FE 的 `fe/conf/` 目录，再替换其中的地址、服务名和路径。

`ranger-hive-security.xml` 示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- Ranger WebUI 中实际的 Hive Service Name -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <!-- 使用 HTTPS 时填写 ranger-policymgr-ssl.xml 的绝对路径，否则留空 -->
    <property>
        <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
        <value></value>
    </property>
</configuration>
```

上述 `ranger-hive-security.xml` 配置项说明如下：

| 配置项 | 是否必需 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | 必需 | 无 | `<value>` 必须与 Ranger WebUI 中 Hive 服务的实际 Service Name 完全一致，例如 `hive_prod` |
| `ranger.plugin.hive.policy.source.impl` | 可选 | Ranger Admin REST Client | 指定从 Ranger Admin REST API 拉取策略的实现 |
| `ranger.plugin.hive.policy.rest.url` | 必需 | 无 | Ranger Admin 根地址，不包含策略 API 路径 |
| `ranger.plugin.hive.policy.cache.dir` | 本文生产配置中必需 | 不使用本地缓存 | 模板设置了示例路径；目录必须预先创建，并允许 FE 进程用户写入。本地缓存有利于 FE 重启后的策略恢复和运维检查 |
| `ranger.plugin.hive.policy.pollIntervalMs` | 可选 | `30000` 毫秒 | 策略轮询间隔 |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | 可选 | `120000` 毫秒 | 连接 Ranger Admin 的超时时间；模板覆盖为 `60000` 毫秒 |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | 可选 | `30000` 毫秒 | 读取 Ranger Admin 响应的超时时间；模板覆盖为 `60000` 毫秒 |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | 使用自定义 HTTPS 证书时必需 | 空 | `ranger-policymgr-ssl.xml` 的绝对路径 |

#### 创建策略缓存目录

Ranger-Doris 和 Ranger-Hive 应使用不同的 `policy.cache.dir`，例如分别使用 `/var/lib/doris/ranger/doris_prod/policy-cache` 和 `/var/lib/doris/ranger/hive_prod/policy-cache`。多个 Catalog 复用同一个 Ranger Hive Service 时，会读取同一份 Hive 配置和缓存。

上面示例将 `ranger.plugin.hive.policy.cache.dir` 配置为 `/var/lib/doris/ranger/hive_prod/policy-cache`。在每个 FE 上以 `root` 用户执行，或为以下命令添加 `sudo`：

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

示例假设 FE 由 `doris:doris` 用户和用户组运行；实际环境不同时，应替换 `chown` 参数。执行后可使用 `sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache` 检查 FE 用户是否可写；没有 `sudo` 时，应切换为 FE 运行用户执行等价检查。

#### 配置 ranger-hive-audit.xml

本文默认关闭 Ranger 审计。即使关闭审计，也要在每个 FE 上保存以下 `fe/conf/ranger-hive-audit.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` 表示不输出 Ranger 鉴权审计。生产环境需要审计时，应基于所用 Ranger 版本的 Hive audit 模板配置 Solr、HDFS、Kafka 等集中式后端，并将该项改为 `true`。本文不推荐将 Log4j 作为生产审计目标，因为审计量与 FE 普通日志共用日志滚动策略，难以单独控制审计日志的保留时间和总大小。

#### 重启 FE

完成 XML 和缓存目录配置后，重启所有 FE，再继续创建 Catalog。Ranger 配置在 Access Controller 初始化时加载，所有 FE 必须使用相同文件和路径。

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 创建启用 Ranger-Hive 的 Hive Catalog -->

## 创建用户和 Hive Catalog

### 创建 Doris 用户

先创建与 Ranger 用户同名的 Doris 登录用户：

```sql
CREATE USER 'alice' IDENTIFIED BY 'R8!mQ2#vL7@k';
```

### 创建启用 Ranger-Hive 的 Hive Catalog

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger-Hive 不管理 Doris Catalog 级权限。在 `skip_catalog_priv_check` 保持默认值 `false` 时，还需要通过默认 Access Controller 让用户能够看到和使用已经创建的 `hive_ctl`。如果默认使用 Doris 内置鉴权，执行：

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

该授权只用于通过 Doris 的 Catalog 级检查；`hive_ctl` 内的数据库、表和列仍由该 Catalog 的 Ranger-Hive Access Controller 校验。

Current 版本也可以在 `fe.conf` 中设置 `skip_catalog_priv_check=true`，跳过带自定义 Access Controller 的外部 Catalog 的 `SHOW` / `SELECT` Catalog 级检查。该配置不会跳过数据库、表和列的 Ranger-Hive 检查，也不会跳过 `CREATE`、`LOAD`、`ALTER` 等 Catalog 级检查。

三个容易混淆的名称含义如下：

| 配置位置 | 示例值 | 实际含义 |
| --- | --- | --- |
| Catalog 的 `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Ranger-Hive Access Controller 工厂的完整类名。Current 和 4.x 也支持短标识 `ranger-hive`；不要填写 Ranger WebUI Service Name |
| Catalog 的 `access_controller.properties.ranger.service.name` | `hive` | Ranger 插件配置前缀/服务类型。Doris 去掉 `access_controller.properties.` 前缀后，将 `ranger.service.name=hive` 传给插件 |
| 每个 FE 的 `fe/conf/ranger-hive-security.xml` 中的 `ranger.plugin.hive.service.name` | `hive_prod` | 其 `<value>` 填写 Ranger WebUI 中实际保存策略的 Hive Service Name |

:::caution
不要把 Catalog 属性写成 `'access_controller.properties.ranger.service.name'='hive_prod'`。在本文的标准配置方式中，该值必须是 `hive`。Ranger WebUI 中的实际 Service Name 应写在每个 FE 的 `fe/conf/ranger-hive-security.xml` 中，配置项为 `ranger.plugin.hive.service.name`，例如 `<value>hive_prod</value>`。
:::

除上述两个鉴权属性外，Hive Metastore、HDFS 或对象存储的连接属性仍按 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog) 文档配置。若 Ranger Admin 或 HMS/HDFS 开启了 Kerberos，请参见本文后面的 Kerberos 章节；两条连接使用的 principal、keytab 和配置位置不同。

创建 Catalog 时，FE 会实例化 Access Controller 并校验配置；各 FE 在首次处理该 Catalog 的鉴权请求时，再按需初始化正式使用的 Access Controller。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 创建并验证 Ranger Hive 访问策略 -->

## 配置并验证 Ranger 策略

### 在 Ranger 中创建访问策略

在 Ranger WebUI 中打开 Hive 服务 `hive_prod`，创建 Access Policy：

| 字段 | 示例值 |
| --- | --- |
| Policy Name | `alice_read_sales_orders` |
| Database | `sales` |
| Table | `orders` |
| Column | `*` |
| Select User | `alice` |
| Permissions | `select` |

保存策略后等待一个拉取周期，本文示例为最多约 30 秒。

### 验证结果

使用 `alice` 登录 Doris：

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

预期结果：

- `alice` 可以看到 `sales` 并查询 `orders`。
- 查询未授权表（例如 `hive_ctl.sales.customers`）时返回权限不足。
- 启用集中式 Ranger 审计后，可以在配置的审计后端中查询允许和拒绝记录。

<!-- 知识类型: 权限映射 / 行为说明 -->
<!-- 适用场景: Ranger 策略设计 / 权限问题定位 -->

## 鉴权行为

### 权限类型映射

下表是 Current 与 4.x 源码中 `RangerHiveAccessController` 对 Doris 权限谓词的基础映射。两者当前的映射项相同；4.x 还会移除用户名、角色名和数据库名中的 Cluster Namespace 前缀。表中存在映射不代表每个 SQL 语句都一定执行相应检查，具体支持范围还取决于该 Doris 版本中该语句的权限检查路径，应以对应版本的实际验证结果为准。

| Doris 权限谓词 | Ranger 请求中的 access type |
| --- | --- |
| `SHOW` | `ANY_ACCESS`，即资源上存在任意允许权限即可 |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| 其他未映射谓词 | `none` |

Ranger-Hive 资源只包含 `database`、`table` 和 `column`，不包含 Doris Catalog 名称。因此，如果两个 Doris Catalog 都连接到 `hive_prod`，并且都存在 `sales.orders`，同一条 Ranger 策略会同时匹配这两个 Catalog 中的同名资源。

### 用户与角色匹配

- Doris 认证成功后，将当前 Doris 用户名作为 Ranger 请求用户。Ranger 用户名需要与 Doris 用户名完全一致。
- 对配置了 Ranger-Hive 的 Catalog，数据库、表和列权限只由 Ranger-Hive 判断，不会再与 Doris 内部的数据库、表或列授权做并集。Doris 的 Global 权限仍可能使检查提前通过，Catalog 级权限仍由默认 Access Controller 处理。
- Doris 会把当前用户在 Doris 中持有的角色名称作为请求上下文传给 Ranger。Ranger 策略中的 Roles 可以匹配这些名称；这只是 Ranger 策略的匹配条件，不表示 Doris 内部对象权限也参与本次判断。
- Doris 与 Ranger 不会自动同步角色。只有确实需要按角色编写 Ranger 策略时，才需要保证 Doris 请求携带的角色名与 Ranger 策略引用的角色名一致。一般场景直接按 Ranger 用户或用户组授权更容易维护。
- Ranger UserSync 不是 Doris 登录用户同步工具。即使 Ranger 中已有 `alice`，仍需在 Doris 中创建 `alice` 或通过 LDAP 等方式完成认证。
- 用户主机部分用于 Doris 登录匹配和审计客户端 IP，不应写进 Ranger 用户名。例如 Doris 用户 `'alice'@'10.%'` 对应的 Ranger 用户仍为 `alice`。

<!-- 知识类型: 配置示例 -->
<!-- 适用场景: 行级权限控制 / 敏感数据脱敏 -->

## 行级过滤与数据脱敏

### Row Level Filter

在 `hive_prod` 中创建 Row Level Filter Policy：

| 字段 | 示例值 |
| --- | --- |
| Database | `sales` |
| Table | `orders` |
| User | `alice` |
| Row Level Filter | `region = 'CN'` |

同时还必须在 Access Policy 中授予 `alice` 对 `sales.orders` 的 `select` 权限。Row Level Filter 只附加过滤条件，不会替代基础访问授权。

配置完成后：

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

结果只包含 `region = 'CN'` 的行。

### Data Masking

在 `hive_prod` 中创建 Masking Policy：

| 字段 | 示例值 |
| --- | --- |
| Database | `sales` |
| Table | `customers` |
| Column | `phone` |
| User | `alice` |
| Masking Option | Ranger 内置类型或 Custom |
| Custom Expression | `concat(substr({col}, 1, 3), '****')` |

同时授予 `alice` 对该列的 `select` 权限。查询 `phone` 时，Doris 会把 Ranger 返回的 `{col}` 替换为实际列名并应用脱敏表达式。

:::caution
过滤和脱敏表达式最终由 Doris SQL 引擎解析。Ranger 中为 HiveServer2 编写的表达式如果使用 Doris 不支持的 Hive UDF 或语法，需要改写为等价的 Doris SQL 表达式。
:::

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: Ranger Admin 开启 Kerberos / SPNEGO 策略下载 -->

## Ranger Admin 开启 Kerberos 时的配置

本节配置的是 FE 中的 Ranger-Hive 客户端如何通过 HTTP/SPNEGO 认证 Ranger Admin。Ranger Admin Kerberos 与 Hive/HMS Kerberos 不是同一个服务认证。它们可以使用同一 Kerberos Realm，但服务 principal、客户端 principal 和 keytab 应按各自链路配置：

| 连接 | 服务端身份示例 | Doris 客户端身份示例 | 用途与配置位置 |
| --- | --- | --- | --- |
| FE → Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | FE 拉取策略；服务端配置在 Ranger Admin，客户端配置在 `fe/conf/ranger-hive-security.xml` |
| FE → HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | FE 获取元数据；配置在 Hive Catalog 的 `hive.metastore.*` 属性中 |
| FE/BE → HDFS | NameNode/DataNode 的服务 principal | `doris/hive-client.example.com@EXAMPLE.COM` | 读取底层数据；配置在 Hive Catalog 的 `hdfs.authentication.*` 属性中 |

:::caution 版本要求
Doris 4.x 需要使用 **4.0.2 或更高版本**。Doris 4.0.0/4.0.1 内置 Ranger 2.4，不包含本文使用的 Ranger Plugin UGI keytab 登录逻辑；Doris 4.0.2 起升级到 Ranger 2.7。Current 版本使用的 Ranger 版本已包含该能力。
:::

### 1. 确认 Ranger Admin 与 FE 使用的 Kerberos 身份

先在 Ranger Admin 服务器上确认服务端配置。Apache Ranger 通常从已部署 Web 应用的 `WEB-INF/classes/conf/` 目录读取 `core-site.xml` 和 `ranger-admin-site.xml`；不同发行版的实际路径可能不同，应以 Ranger Admin 的启动参数或安装目录为准。检查以下配置项：

| 配置文件 | 配置项 | 含义 |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Ranger Admin 的 SPNEGO 过滤器使用的 Hadoop 认证方式；安全下载接口使用 Kerberos 时应为 `kerberos` |
| `ranger-admin-site.xml` | `ranger.service.host` | Ranger Admin 对外提供服务的主机名，也是 `_HOST` 的替换值 |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | HTTP/SPNEGO 服务 principal，例如 `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Ranger Admin 服务端读取的 SPNEGO keytab 路径 |

`ranger.authentication.method` 控制 Ranger WebUI 的登录方式，不能单独用来判断插件安全下载接口是否启用了 SPNEGO。不同发行版可能封装这些配置，应以 Ranger Admin 实际生效的 `ranger-admin-site.xml` 和启动日志为准。

在 Ranger Admin 服务器上执行 `klist -kt <ranger.spnego.kerberos.keytab 的实际路径>`，确认 keytab 中存在展开 `_HOST` 后的 HTTP principal，例如 `HTTP/ranger-admin.example.com@EXAMPLE.COM`。FE 配置的 `ranger.plugin.hive.policy.rest.url` 必须使用这个 principal 中的主机名。

FE 使用的客户端 principal 和 keytab 不由 Ranger 自动生成。应由 Kerberos 管理员为 FE 创建，例如 `doris/ranger-client.example.com@EXAMPLE.COM`，导出到 `/etc/security/keytabs/doris-ranger.keytab`，部署到每个 FE，并确保 FE 进程用户可读。不要把 Ranger Admin 服务端的 HTTP principal 或 SPNEGO keytab 配给 FE。

下面使用一组完整示例说明配置：

| 配置项 | 示例值 |
| --- | --- |
| Ranger WebUI Hive Service Name | `hive_prod` |
| Ranger Admin URL | `http://ranger-admin.example.com:6080` |
| Kerberos Realm | `EXAMPLE.COM` |
| Ranger Admin HTTP 服务 principal（SPN） | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| FE 拉取策略使用的 principal | `doris/ranger-client.example.com@EXAMPLE.COM` |
| FE 客户端 keytab | `/etc/security/keytabs/doris-ranger.keytab` |

这里的 HTTP SPN 是 Ranger Admin 的服务端身份，不是要写入 FE `ugi.keytab.principal` 的值。FE 的 `ugi.keytab.principal` 应填写客户端身份 `doris/ranger-client.example.com@EXAMPLE.COM`。

### 2. 让 FE 在 Kerberos 模式下初始化 Hadoop UGI

仅在 `ranger-hive-security.xml` 中添加 `ugi.*` 参数还不够。Ranger Plugin 最终调用 Hadoop `UserGroupInformation.loginUserFromKeytab()`，只有全局 Hadoop 认证模式为 `kerberos` 时，keytab 登录才会真正生成 Kerberos 凭据。

在每个 FE 的 `fe/conf/` 目录创建 `core-site.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

Doris 的 `start_fe.sh` 会把 FE 的 `conf` 目录加入 Java classpath，因此推荐直接放在 `fe/conf/core-site.xml`。也可以把 Hadoop 配置集中放在其他目录，并在 `fe.conf` 中设置：

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

此时 `/etc/hadoop/conf/core-site.xml` 必须存在，并在重启 FE 前对 FE 运行用户可读。

### 3. 配置 krb5.conf 与 Ranger Admin HTTP SPN

在每个 FE 的 `/etc/krb5.conf` 中配置 Realm、KDC 和 Ranger Admin URL 主机的 `domain_realm` 映射：

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    EXAMPLE.COM = {
        kdc = kdc.example.com:88
        admin_server = kdc.example.com
    }

[domain_realm]
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`ranger.plugin.hive.policy.rest.url` 中的主机名必须与 Ranger Admin HTTP/SPNEGO keytab 中的 SPN 匹配。例如 URL 使用 `ranger-admin.example.com` 时，Ranger Admin 服务端 keytab 中应包含：

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

不要混用短主机名、FQDN、CNAME、VIP 或 IP。若 URL 使用短主机名，例如 `http://ranger-admin:6080`，除配置 `.example.com` 外，还必须为短名称增加精确映射：

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

以下检查需要安装提供 `kinit`、`klist`、`kdestroy` 和 `kvno` 的 Kerberos 客户端工具。使用 FE 运行用户验证客户端 keytab 和 Ranger Admin HTTP SPN；命令使用独立的临时票据缓存，不会清除该用户已有的 Kerberos 票据。执行前请替换 principal、keytab 和主机名：

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_test_$$
kdestroy 2>/dev/null || true
klist -kt /etc/security/keytabs/doris-ranger.keytab
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM
kvno HTTP/ranger-admin.example.com@EXAMPLE.COM
klist
kdestroy
```

`klist -kt` 应列出 FE 客户端 principal；`kinit` 成功时通常没有输出；`kvno` 成功且最后一个 `klist` 同时显示 `krbtgt/...` 和 Ranger Admin 的 HTTP 服务票据，表示客户端 keytab、Realm 映射和 HTTP SPN 正常。最后一个 `kdestroy` 会删除本次检查的临时票据缓存。

### 4. 配置完整的 ranger-hive-security.xml

在每个 FE 的 `fe/conf/ranger-hive-security.xml` 中同时配置策略服务和 UGI 登录：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- Ranger WebUI 中实际的 Hive Service Name -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <!-- 主机名必须与 Ranger Admin HTTP SPN 匹配 -->
    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.initialize</name>
        <value>true</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.login.type</name>
        <value>keytab</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.principal</name>
        <value>doris/ranger-client.example.com@EXAMPLE.COM</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.file</name>
        <value>/etc/security/keytabs/doris-ranger.keytab</value>
    </property>
</configuration>
```

各 Kerberos 配置项含义如下：

| 配置项 | 说明 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | 初始化 Ranger-Hive Plugin 时执行 Hadoop UGI 登录 |
| `ranger.plugin.hive.ugi.login.type` | 使用 keytab 时固定填写 `keytab` |
| `ranger.plugin.hive.ugi.keytab.principal` | FE 拉取 Ranger 策略所用的客户端 principal，必须存在于 keytab 中 |
| `ranger.plugin.hive.ugi.keytab.file` | 客户端 keytab 的绝对路径，每个 FE 上路径一致且 FE 进程用户可读 |

`ranger.plugin.hive.policy.rest.secure=true` 不是开启 Kerberos 分支的决定条件。Ranger Client 根据 Hadoop UGI 是否启用安全模式、当前登录用户是否持有 Kerberos 凭据来决定是否使用安全下载接口，因此应以 FE 日志中的 `secureMode` 为准。

### 5. 允许 FE 服务身份下载 hive_prod 策略

本步骤配置的是 **FE 拉取策略时使用的服务账号**，不是查询 Doris 的业务用户 `alice`，也不会为该账号授予 Hive 数据访问权限。

Ranger Admin 开启 Kerberos 后，FE 下载策略需要通过两道检查：

1. Ranger Admin 通过 SPNEGO 验证 FE keytab 中的 Kerberos principal。
2. 认证成功后，Ranger Admin 再检查该登录账号是否有权下载 `hive_prod` 的策略。

本文示例中的身份转换关系如下：

| 阶段 | 示例值 | 作用 |
| --- | --- | --- |
| FE keytab 中的 principal | `doris/ranger-client.example.com@EXAMPLE.COM` | 用于 SPNEGO 认证 |
| Ranger Admin 认证后的 login ID | `doris` | principal 经 `auth_to_local` 转换后的账号 |
| Ranger Hive Service 推荐配置 | `policy.download.auth.users=doris` | 允许该 FE 服务账号下载策略和角色数据 |

对于普通 FE 服务账号，推荐使用 Hive Service 的 `policy.download.auth.users` 授予最小下载权限。在 Ranger WebUI 中编辑 Hive Service `hive_prod`，确认其 `configs` 包含：

```text
policy.download.auth.users=doris
```

这里的 `doris` 是 Ranger Admin 当前认证会话的 login ID，不是 Doris 查询用户。Ranger Admin 的 SPNEGO 过滤器使用其 `core-site.xml` 中的 `hadoop.security.auth_to_local` 规则转换 Kerberos principal，因此示例 principal 只有在规则将其映射为 `doris` 时才填写该值。应以 Ranger Admin 认证日志中的实际 login ID 为准，不要直接假定为完整 principal 或固定短用户名。

Apache Ranger 2.7 会把 `policy.download.auth.users` 按逗号拆分，并与会话 login ID 做不区分大小写的精确比较；多个账号应写成不带空格的列表，例如 `doris,hive`。Ranger 管理员以及 `policy.grantrevoke.auth.users` 中的账号也能通过下载授权，但 FE 只需要下载策略，不建议为此授予范围更大的 grant/revoke 权限。

### 6. 重启 FE 并验证安全策略下载

完成上述配置后重启所有 FE。首先检查 FE 日志：

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

然后使用 FE 运行用户和同一 keytab 直接请求安全策略下载接口。执行前确认 `curl --version` 显示支持 GSS-API、Kerberos 或 SPNEGO：

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

以接口返回 HTTP 200 和完整策略 JSON 作为端到端成功标准。`kinit`、`kvno` 和 `secureMode=true` 分别验证其中一段链路，不能代替策略下载结果。

策略加载成功后，示例缓存目录应生成：

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Ranger Admin、HMS 和 HDFS 同时开启 Kerberos

如果 Hive Metastore 和 HDFS 也启用了 Kerberos，应使用下面的 Catalog 定义替代快速开始中的 `CREATE CATALOG hive_ctl`，不要重复创建同名 Catalog。示例中，`doris-ranger.keytab` 只用于 FE 下载 Ranger 策略，`doris-hive.keytab` 用于访问 HMS 和 HDFS：

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'hive.metastore.authentication.type' = 'kerberos',
    'hive.metastore.client.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hive.metastore.client.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'hive.metastore.service.principal' = 'hive/hms.example.com@EXAMPLE.COM',
    'hdfs.authentication.type' = 'kerberos',
    'hdfs.authentication.kerberos.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hdfs.authentication.kerberos.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'fs.defaultFS' = 'hdfs://nameservice1',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

该示例中有两份不同用途的客户端身份：

- `doris-ranger.keytab` 用于 FE 通过 SPNEGO 向 Ranger Admin 拉取策略，只需部署到 FE。
- `doris-hive.keytab` 用于访问 HMS/HDFS。HMS 客户端 keytab 需要部署到所有 FE；HDFS 客户端 keytab 需要部署到实际访问 HDFS 的 FE/BE，并保证相同绝对路径可读。也可以为 HMS 和 HDFS 分配不同客户端身份，此时分别填写对应属性。

HMS 服务端 principal 从 Hive Metastore 的 Kerberos 配置中确认，示例为 `hive/hms.example.com@EXAMPLE.COM`；它不是 Ranger Admin 的 HTTP principal。两条链路的身份可以属于同一 Realm，但不要互换 principal 或 keytab。

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: Ranger Admin 使用 HTTPS / 自定义 CA / 双向 TLS -->

## Ranger Admin 使用 HTTPS

在每个 FE 的 `fe/conf/ranger-hive-security.xml` 中，把 `ranger.plugin.hive.policy.rest.url` 改为 HTTPS 地址，并通过 `ranger.plugin.hive.policy.rest.ssl.config.file` 指定 SSL 配置文件：

```xml
<property>
    <name>ranger.plugin.hive.policy.rest.url</name>
    <value>https://ranger-admin.example.com:6182</value>
</property>
<property>
    <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
    <value>/opt/apache-doris/fe/conf/ranger-policymgr-ssl.xml</value>
</property>
```

下面以 Ranger Admin CA 证书 `/tmp/ranger-admin-ca.pem` 和 FE 运行用户 `doris:doris` 为例。在每个 FE 上准备 truststore 和 JCEKS credential provider；命令需要 JDK 的 `keytool` 和 Hadoop 客户端的 `hadoop credential`：

```shell
sudo install -d -o doris -g doris -m 700 /etc/security/ranger
sudo -u doris keytool -importcert -noprompt \
    -alias ranger-admin-ca \
    -file /tmp/ranger-admin-ca.pem \
    -storetype JKS \
    -keystore /etc/security/ranger/ranger-truststore.jks
sudo -u doris hadoop credential create sslTrustStore \
    -provider jceks://file/etc/security/ranger/ranger-ssl.jceks
sudo chmod 600 /etc/security/ranger/ranger-truststore.jks \
    /etc/security/ranger/ranger-ssl.jceks
```

`keytool` 会提示设置 truststore 密码，`hadoop credential` 会提示输入 `sslTrustStore` 的值；两处必须填写同一个密码。不要使用示例路径中的临时证书文件作为长期配置，部署后还应确认 FE 用户可以读取两个文件。

`ranger-policymgr-ssl.xml` 示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.policymgr.clientssl.truststore</name>
        <value>/etc/security/ranger/ranger-truststore.jks</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.type</name>
        <value>JKS</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.credential.file</name>
        <value>jceks://file/etc/security/ranger/ranger-ssl.jceks</value>
    </property>
</configuration>
```

Ranger 客户端固定使用 JCEKS 中的 `sslTrustStore` alias 读取 truststore 密码。双向 TLS 还需要按 Ranger 模板配置 `xasecure.policymgr.clientssl.keystore`，并在 JCEKS 中创建 `sslKeyStore` alias。不要把 truststore/keystore 明文密码直接提交到 XML。

<!-- 知识类型: 架构限制 / 最佳实践 -->
<!-- 适用场景: 多 Hive Catalog / Ranger-Doris 与 Ranger-Hive 共存 -->

## 多 Catalog 与运行限制

### 多个 Catalog 复用同一套 Hive 策略

如果多个 Catalog 都对应 `hive_prod`，它们可以使用相同配置：

```sql
CREATE CATALOG hive_prod_a PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-a.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);

CREATE CATALOG hive_prod_b PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-b.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

由于 Ranger Hive 资源没有 Catalog 维度，同名数据库、表和列会匹配同一策略。只有在两个 Metastore 的资源命名和权限边界本来就一致时才应这样配置。

### 不同 Ranger Hive 服务实例

标准配置前缀 `hive` 只对应一份 `ranger-hive-security.xml`，因此同一个 FE 中的所有 Ranger-Hive Catalog 都会读取同一个 `ranger.plugin.hive.service.name`。当前 Catalog 配置接口不支持为不同 Catalog 独立选择多个 Ranger Hive Service Name。不要通过把 Catalog 中的 `ranger.service.name` 改为 `hive_prod_a` 等 WebUI Service Name 来尝试切换，这会让 Ranger 改为查找 `ranger-hive_prod_a-security.xml` 和 `ranger.plugin.hive_prod_a.*`，不再是本文所述的标准 Hive 配置。如果必须隔离多套 Ranger Hive 服务，需要使用不同的 Doris 集群，或让这些 Catalog 共用同一套 Ranger Hive 策略。

### 运行限制与最佳实践

- Ranger-Hive 只适用于 Hive/HMS Catalog，不要把它描述或配置为所有外部 Catalog 的通用 Ranger 鉴权方式。
- Ranger-Hive 与 Ranger-Doris 的策略不会自动互通；两者的配置文件和策略缓存目录必须分开。
- 同一个 FE 进程不能为 Ranger-Doris 和 Ranger-Hive 分别维护两套独立审计输出。第一个初始化的 Ranger 插件会确定该 FE 的审计开关和输出目标。两者同时启用时，应把两份 audit XML 配置为相同的开关和集中式审计目标，否则 FE 启动后的实际审计结果会取决于插件初始化顺序。
- Hadoop UGI 登录状态在同一个 FE JVM 内全局共享。同时使用 Ranger-Doris 和 Ranger-Hive，或配置多个启用 Kerberos 的 Ranger Catalog 时，应统一使用同一个 Ranger 客户端 principal 和 keytab；否则后初始化的登录可能覆盖已有身份，导致策略拉取不稳定。
- Ranger-Hive 不会检查 Ranger HDFS、S3 或对象存储策略。底层数据访问权限仍由 Doris 使用的存储凭证决定。
- Ranger Hive 资源没有 Doris Catalog 维度。连接多个 Metastore 时，必须评估同名库表策略冲突。
- 用户和角色不会在 Doris 与 Ranger 之间自动同步。应建立统一命名规范，并通过普通账号做允许和拒绝两类验证。
- 策略首次拉取失败时，插件可能使用本地缓存。生产环境应监控缓存更新时间和 Ranger 审计，避免长期使用旧策略。
- 每个已初始化该 Access Controller 的 FE 都会独立拉取并缓存策略。配置文件、keytab、truststore 和目录权限必须在所有 FE 上保持一致。
- 策略变更不是即时生效，最大延迟通常接近 `policy.pollIntervalMs`，还会受到 Ranger Admin 和网络状态影响。

<!-- 知识类型: FAQ / 故障排查 -->
<!-- 适用场景: 配置文件加载失败 / 策略下载失败 / 权限不生效 -->

## 常见问题

先根据现象定位对应检查点，再查看后续小节中的原因和完整处理方法：

| 现象 | 优先检查 |
| --- | --- |
| 创建 Catalog 后找不到 Access Controller | `access_controller.class` 是否为完整工厂类名或 `ranger-hive` |
| 日志提示找不到 `ranger-hive-security.xml` | Catalog 中的配置前缀是否固定为 `hive`，文件是否位于所有 FE 的 `fe/conf/` |
| 未启用审计时 security XML 仍未生效 | 是否同时部署 `ranger-hive-audit.xml` 并显式关闭审计 |
| 能访问 Ranger Admin，但没有策略 | Service Name、REST URL、网络、缓存目录和策略状态 |
| Kerberos 开启后策略下载失败 | UGI 安全模式、HTTP SPN、下载授权、HTTP 状态和策略缓存 |
| Ranger 已授权，但看不到 Catalog | 默认 Access Controller 的 Catalog 级权限 |
| Ranger 拒绝策略没有生效 | 用户是否持有 Global 权限或使用 `root`、`admin` 测试 |
| HiveServer2 生效，Doris 不生效 | Service Name、用户名、角色名和策略表达式兼容性 |
| 用户可以直接读取 HDFS 或 S3 | Ranger-Hive 不负责底层存储访问控制 |

### 创建 Catalog 后提示找不到 Access Controller

确认使用当前版本的完整工厂类名：

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current 和 4.x 也支持短标识：

```sql
'access_controller.class' = 'ranger-hive'
```

不要填写 `hive`、`hive_prod`，也不要使用旧类名 `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory`。检查所有 FE 是否运行同一 Doris 版本，并在 FE 日志中搜索 `Access Controller Plugin Factory`。

### 日志提示无法找到 ranger-hive-security.xml

这里有两个容易混淆的配置：

- Catalog 中的 `'access_controller.properties.ranger.service.name' = 'hive'` 表示使用 Ranger Hive 插件，必须固定填写 `hive`。Doris 会根据该值查找 `ranger-hive-security.xml`，并读取其中的 `ranger.plugin.hive.*` 配置。
- `ranger-hive-security.xml` 中的 `ranger.plugin.hive.service.name` 才是 Ranger WebUI 中实际创建的 Hive Service Name，例如 `hive_prod`。

如果把 `hive_prod` 错填到 Catalog 中，Doris 会查找 `ranger-hive_prod-security.xml`，因此出现配置文件不存在的错误。请确认每个 FE 的 `fe/conf/` 目录中都有 `ranger-hive-security.xml`，修改后重启所有 FE。

### 为什么未启用审计也要配置 ranger-hive-audit.xml

Ranger 2.7 找不到 `ranger-hive-audit.xml` 时会进入旧版回退，查找 `hive-site.xml`、`hbase-site.xml` 或 `hdfs-site.xml`，再尝试加载同目录下的 `xasecure-audit.xml`。如果该文件不存在，后续的 `ranger-hive-security.xml` 也可能没有生效。为避免加载结果依赖 FE classpath 中的其他 Hadoop 配置，部署时应始终同时提供 `ranger-hive-security.xml` 和 `ranger-hive-audit.xml`；不需要审计时，在 audit XML 中显式设置 `xasecure.audit.is.enabled=false`。`core-site.xml` 不在这个旧版 audit 文件查找列表中，不是该问题的直接触发条件。

### 能连接 Ranger Admin，但拉不到策略

依次检查：

1. `ranger.plugin.hive.service.name` 是否与 Ranger WebUI 的 Service Name `hive_prod` 完全一致。
2. `ranger.plugin.hive.policy.rest.url` 是否为 Ranger Admin 根地址。
3. FE 到 Ranger Admin 的网络、DNS 和 HTTPS truststore 是否正常。
4. 缓存路径是否可创建，目录已存在时 FE 用户是否可写。
5. Ranger Admin 中该服务是否启用，策略是否已保存。

Ranger Admin 开启 Kerberos 时，按下一节继续检查认证和下载授权。

### Ranger Admin 开启 Kerberos 后无法下载策略

按策略下载链路依次检查：

1. **确认 FE 已进入 Kerberos 模式。** FE 日志应包含 `secureMode=true` 和 `(auth:KERBEROS)`。如果日志显示 `secureMode=false` 或 `(auth:SIMPLE)`，确认 `core-site.xml` 中已设置 `hadoop.security.authentication=kerberos`，并且文件位于 `fe/conf/` 或 `HADOOP_CONF_DIR` 指向的 classpath 目录，然后重启所有 FE。不要只把文件放在 `hadoop_config_dir` 默认指向的 `plugins/hadoop_conf/`；该目录主要用于 Catalog/Hadoop 连接配置，不保证 Ranger Plugin 初始化全局 UGI 时可见。4.x 还需确认版本不低于 4.0.2，并检查是否误设了 `ranger.plugin.hive.forceNonKerberos=true`。

2. **确认 HTTP 服务票据可获取。** 使用 FE 运行用户执行主流程中的 `kinit` 和 `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM`。出现 `Server not found in Kerberos database`、`No service creds` 或请求错误的 `krbtgt/<REALM>` 时，检查 `ranger.plugin.hive.policy.rest.url` 使用的主机名、Ranger Admin SPNEGO keytab 中的 HTTP SPN、DNS 和 `/etc/krb5.conf` 的 `[domain_realm]`。URL 与 SPN 必须使用同一个精确主机名。

3. **确认登录账号有权下载策略。** principal 通过 SPNEGO 认证后，确认 Ranger Admin 日志中的实际 login ID。对于本文的普通 FE 服务账号，该 ID 应包含在 Hive Service `hive_prod` 的 `policy.download.auth.users` 中。Apache Ranger 2.7 还允许 Ranger 管理员和 `policy.grantrevoke.auth.users` 中的账号下载策略，但不建议仅为 FE 拉取策略授予 grant/revoke 权限。如果 WebUI 不显示 `policy.download.auth.users`，需要通过发行版提供的 Ranger Plugin 安装配置或 Ranger Service REST API 查看和更新；通过 REST API 更新时必须保留该 Service 原有的全部配置。

4. **检查安全下载接口的 HTTP 状态。** 重新执行 Kerberos 配置第 6 步的 `curl --negotiate` 命令并保留响应正文。按 Apache Ranger 2.7 标准实现，HTTP 401 表示 SPNEGO 认证未通过；HTTP 403 表示已经认证，但 login ID 既不是 Ranger 管理员，也不在 `policy.download.auth.users` 或 `policy.grantrevoke.auth.users` 中；HTTP 404 通常表示 XML 中的 `ranger.plugin.hive.service.name` 与 Ranger WebUI Service Name 不一致；HTTP 200 且返回完整策略 JSON 才表示下载成功。厂商发行版可能改写状态码，应同时查看响应正文和 Ranger Admin 日志。`kinit` 成功只表示获得了客户端 TGT，不能证明 HTTP 服务票据和下载授权均已通过。

5. **检查策略缓存。** 下载成功后，缓存目录中应同时存在主策略文件 `hive_hive_prod.json` 和角色文件 `hive_hive_prod_roles.json`。如果只有体积很小的角色文件，说明主策略仍未成功加载；检查 `getServicePoliciesIfUpdated` 的 HTTP 响应，以及 FE 日志中的 `policy engine initialization failed` 和缓存写入错误。

### Ranger 已授权，但 SHOW CATALOGS 看不到 Catalog

Catalog 级检查由默认 Access Controller 处理。使用内置鉴权时，为用户授予该 Catalog 的权限：

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Current 版本也可以评估 `skip_catalog_priv_check=true`。该配置只影响自定义 Access Controller 外部 Catalog 的 `SHOW` / `SELECT` Catalog 级检查。

### Ranger 拒绝策略没有生效

检查用户是否拥有 Doris Global 权限。默认 Access Controller 授予的对应 Global 权限可以使最终检查通过，即使 Ranger-Hive 没有允许该数据库、表或列。请使用没有 `ADMIN_PRIV` 或 Global `SELECT_PRIV` 的普通用户测试。

### HiveServer2 生效，Doris 不生效

确认 Doris 与 HiveServer2 是否读取同一个 Ranger Hive Service Name，并检查策略表达式是否使用 Doris 支持的 SQL 语法。还要确认 Doris 请求中的用户名和角色名与 Ranger 策略完全一致。

### Ranger-Hive 是否会阻止用户直接读取 HDFS 或 S3

不会。Ranger-Hive 只对 Doris SQL 层的 Hive database/table/column 请求鉴权。底层 HDFS、S3 等访问由 Catalog 的存储认证配置决定，需要在存储侧单独实施访问控制和凭据隔离。

<!-- 知识类型: 上线检查 -->
<!-- 适用场景: 生产部署验收 -->

## 上线检查清单

- Ranger WebUI 的 Service Type 为 Hive，Service Name 与 XML 完全一致。
- 所有 FE 都存在可正常解析的 `ranger-hive-security.xml` 和 `ranger-hive-audit.xml`；不需要审计时已在 audit XML 中显式关闭。
- Ranger-Doris 和 Ranger-Hive 使用分开且 FE 用户可写的策略缓存目录。
- Catalog 中 `access_controller.class` 为 Ranger-Hive 工厂完整类名（或 Current/4.x 支持的短标识 `ranger-hive`），配置前缀值为 `hive`。
- 普通 Doris 用户与 Ranger 用户同名；使用 Doris 角色匹配 Ranger 策略时，两侧引用的角色名称一致。
- 已分别验证允许访问、拒绝访问、列权限、行过滤和数据脱敏。
- 已验证 Catalog 级权限来自默认 Access Controller，且测试用户没有会绕过检查的 Global 权限。
- Ranger Admin 使用 Kerberos/HTTPS 时，所有 FE 的 keytab、truststore、`krb5.conf` 和绝对路径一致。
- 已确认多 Catalog 下同名数据库和表不会造成策略范围扩大。
- 启用审计时，配置的输出中可以看到来自 Doris 的允许和拒绝记录；如需在 Ranger WebUI 查看，已配置 Ranger Audit 使用的 Solr 等审计后端。
