---
{
    "title": "Ranger 鉴权",
    "language": "zh-CN",
    "description": "通过 Apache Ranger 接管 Apache Doris 权限管理：插件安装、Catalog/库表列/行级与脱敏策略、Kerberos 集成与常见问题。",
    "keywords": [
        "Apache Doris Ranger",
        "Doris Ranger 鉴权",
        "Ranger 插件安装",
        "ranger-doris-plugin",
        "ranger-doris-security.xml",
        "Doris 权限管理",
        "Doris 列权限",
        "Row Level Filter",
        "数据脱敏 Masking",
        "Ranger Kerberos",
        "access_controller_type",
        "ranger-doris"
    ]
}
---

<!-- 知识类型: 配置指南 / 权限管理 -->
<!-- 适用场景: 使用 Apache Ranger 统一管理 Apache Doris 的库表列、行级与脱敏权限 -->

Apache Ranger 是一个用来在 Hadoop 平台上进行监控、启用服务以及全方位数据安全访问管理的安全框架。在 Apache Doris 中启用 Ranger 后，权限管理将从 Doris 内部的 `GRANT` 语句迁移到 Ranger 侧统一配置，便于与 Hive、HDFS 等组件共享同一套权限体系。

本文介绍如何为 Doris 安装并配置 Ranger 插件，以及如何在 Ranger 中定义全局、Catalog、库、表、列、行级与脱敏等各类策略。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 统一权限管控 | 已使用 Ranger 管理 Hive/HDFS，希望 Doris 复用同一套权限策略 |
| 细粒度授权 | 需要对列、行级数据、敏感字段做精细化授权与脱敏 |
| Kerberos 环境 | Ranger Admin 已开启 Kerberos，Doris 需以 Kerberos 身份拉取策略 |
| 替代内部授权 | 希望弃用 Doris 内部 `GRANT/REVOKE`，由 Ranger 集中授权 |

## 前置条件

- 已部署 Apache Ranger Admin 服务（推荐 2.x 及以上版本），且能通过 HTTP/HTTPS 访问。
- 已部署 Apache Doris 集群，FE/BE 节点能访问 Ranger Admin 服务。
- 拥有 Ranger WebUI 的管理员账号，用于创建服务定义与策略。
- 行级过滤、数据脱敏需 Doris **2.1.3** 及以上版本；Compute Group、Storage Vault 权限需 Doris **3.0.6** 及以上版本。

## 配置流程总览

1. 在 Ranger 服务端安装 Doris 插件（上传 Jar 与服务定义 JSON）。
2. 在 Ranger WebUI 中创建 Doris 服务并填写连接信息。
3. 在 Doris FE 侧配置 `access_controller_type=ranger-doris` 并放置 `ranger-doris-security.xml`。
4. （可选）若 Ranger Admin 启用 Kerberos，合并 `krb5.conf` 并在配置中追加 UGI 参数。
5. 重启 Doris 集群，在 Ranger 中为用户配置策略并在 Doris 中验证。

## 安装和配置 Doris Ranger 插件

### 安装插件

1. 下载以下文件：

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/dev/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

    :::caution 注意
    `ranger-doris-plugin-3.0.0-SNAPSHOT.jar` 需要下载对应分支的 Jar 包，否则会导致无法使用。
    :::

2. 将下载好的文件放到 Ranger 服务的 `ranger-plugins/doris` 目录下，例如：

    ```text
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
    ```

3. 重启 Ranger 服务。

4. 下载 [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json)。

    :::caution 注意
    `ranger-servicedef-doris.json` 需要下载对应分支的 JSON 文件，否则会导致无法使用。
    :::

5. 执行以下命令将服务定义文件上传到 Ranger 服务，从而注册 Apache Doris 的插件定义：

    ```shell
    curl -u user:password -X POST \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        http://172.21.0.32:6080/service/plugins/definitions \
        -d@ranger-servicedef-doris.json
    ```

    其中：

    - 用户名和密码为登录 Ranger WebUI 所使用的用户名密码。
    - 服务地址端口可在 `ranger-admin-site.xml` 配置文件的 `ranger.service.http.port` 配置项中查看。

    如执行成功，会返回 JSON 格式的服务定义，例如：

    ```json
    {
      "id": 207,
      "guid": "d3ff9e41-f9dd-4217-bb5f-3fa9996454b6",
      "isEnabled": true,
      "createdBy": "Admin",
      "updatedBy": "Admin",
      "createTime": 1705817398112,
      "updateTime": 1705817398112,
      "version": 1,
      "name": "doris",
      "displayName": "Apache Doris",
      "implClass": "org.apache.ranger.services.doris.RangerServiceDoris",
      "label": "Doris",
      "description": "Apache Doris",
      "options": {
        "enableDenyAndExceptionsInPolicies": "true"
      },
      ...
    }
    ```

    如需重新创建，可使用以下命令删除服务定义后再重新上传（其中 `207` 为创建时返回的 `id`）：

    ```shell
    curl -v -u user:password -X DELETE \
        http://172.21.0.32:6080/service/plugins/definitions/207
    ```

    删除前，需在 Ranger WebUI 界面删除已创建的 Doris 服务。也可以通过以下命令列举当前已添加的服务定义，以获取 `id`：

    ```shell
    curl -v -u user:password -X GET \
        http://172.21.0.32:6080/service/plugins/definitions/
    ```

### 配置插件

安装完毕后，打开 Ranger WebUI，可在 Service Manager 界面看到 Apache Doris 插件：

![ranger](/images/ranger/ranger1.png)

点击插件旁边的 `+` 号添加一个 Doris 服务：

![ranger2](/images/ranger/ranger2.png)

Config Properties 部分参数含义如下：

| 参数 | 说明 |
| --- | --- |
| `Service Name` | 服务名称，Doris 根据该名称拉取相关权限，需与 `ranger-doris-security.xml` 中 `ranger.plugin.doris.service.name` 保持一致，建议填写 `doris`。不一致会导致 Doris 拉取不到权限，从而鉴权失败 |
| `Username` / `Password` | Doris 集群的用户名密码，建议使用 Admin 用户 |
| `jdbc.driver_class` | 连接 Doris 使用的 JDBC 驱动，例如 `com.mysql.cj.jdbc.Driver` |
| `jdbc.url` | Doris 集群的 JDBC URL，例如 `jdbc:mysql://172.21.0.101:9030?useSSL=false` |
| `resource.lookup.timeout.value.in.ms` | 额外参数，获取元信息的超时时间，建议填写 `10000`（即 10 秒） |

可以点击 `Test Connection` 检查连通性。

:::info 备注
如果此时 Doris 已经启动完成，且 `fe.conf` 已经配置 `access_controller_type=ranger-doris`，点击 `Test Connection` 会显示 `fail`。这是因为此时 Ranger 鉴权服务还没有创建完成，Doris 拉取权限会失败，属于正常现象，直接创建服务即可。
:::

之后点击 `Add` 添加服务。返回 Service Manager 界面的 Apache Doris 插件中即可看到创建的服务，点击服务即可开始配置 Ranger 策略。

## 在 Doris 侧启用 Ranger

### 更改 Doris 配置

1. 在 `fe/conf/fe.conf` 文件中配置鉴权方式为 Ranger：

    ```text
    access_controller_type=ranger-doris
    ```

2. 在所有 FE 节点的 `conf` 目录下创建 `ranger-doris-security.xml` 文件，内容如下：

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
        <property>
            <name>ranger.plugin.doris.policy.cache.dir</name>
            <value>/path/to/ranger/cache/</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.pollIntervalMs</name>
            <value>30000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.connection.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.read.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.url</name>
            <value>http://172.21.0.32:6080</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.source.impl</name>
            <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
        </property>
        <property>
            <name>ranger.plugin.doris.service.name</name>
            <value>doris</value>
        </property>
    </configuration>
    ```

    其中需要修改的关键配置项：

    | 配置项 | 说明 |
    | --- | --- |
    | `ranger.plugin.doris.policy.cache.dir` | 用于存放从 Ranger Server 获取的权限缓存文件，**该目录需手动创建**并保证存在 |
    | `ranger.plugin.doris.policy.rest.url` | Ranger Admin 服务地址，需替换为实际地址 |
    | `ranger.plugin.doris.service.name` | 与 Ranger WebUI 中创建的服务名一致，默认 `doris` |
    | `ranger.plugin.doris.policy.pollIntervalMs` | 策略拉取轮询间隔，单位毫秒 |

3. 启动集群。

### Ranger Server 开启 Kerberos 时的配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: Ranger Admin 启用 Kerberos / 跨 Realm 鉴权 -->

当 Ranger Admin 服务本身开启了 Kerberos 认证时，Doris 的 Ranger Client 在拉取策略时需要以 Kerberos 身份向 Ranger Admin 鉴权，否则会导致策略拉取失败、鉴权无法生效。此时需要额外完成以下两步配置。

#### 1. 合并 krb5.conf

Doris 的 Ranger Client 在执行 Kerberos 登录时，底层使用 JVM 的 `Krb5LoginModule`，它从**每台 FE/BE 节点上的 `/etc/krb5.conf`** 读取 KDC 地址。如果你的环境中同时存在多个 Kerberos Realm（例如 HDFS 集群的 Realm 和 Ranger Admin 所在集群的 Realm 不同），则需要将所有 Realm 的 KDC 信息**合并**到同一个 `/etc/krb5.conf` 文件中，并将该文件部署到所有 FE 和 BE 节点。

合并后的 `krb5.conf` 示例如下：

```ini
[libdefaults]
    default_realm = HADOOP.EXAMPLE.COM
    dns_lookup_realm = true
    dns_lookup_kdc = true

[realms]
    # HDFS / Hive 集群的 Realm
    HADOOP.EXAMPLE.COM = {
        kdc = hadoop-kdc.example.com:88
        admin_server = hadoop-kdc.example.com
    }
    # Ranger Admin 所在集群的 Realm（如与上方不同，则需合并进来）
    RANGER.EXAMPLE.COM = {
        kdc = ranger-kdc.example.com:88
        admin_server = ranger-kdc.example.com
    }

[domain_realm]
    hadoop-kdc.example.com = HADOOP.EXAMPLE.COM
    ranger-admin.example.com = RANGER.EXAMPLE.COM
```

:::caution 注意
修改或新增 `/etc/krb5.conf` 后，需要重启所有 FE 和 BE 才能使配置生效。
:::

#### 2. 配置 ranger-hive-security.xml（或 ranger-doris-security.xml）中的 Kerberos UGI

在 FE 节点的 `fe/conf/` 目录下，找到（或创建）`ranger-hive-security.xml`（使用 Hive Ranger 鉴权时）或 `ranger-doris-security.xml`（使用 Doris Ranger 鉴权时），在 `<configuration>` 中追加以下 4 个配置项：

```xml
<!-- 开启 UGI Kerberos 登录 -->
<property>
    <name>ranger.plugin.hive.ugi.initialize</name>
    <value>true</value>
</property>
<!-- 登录方式：keytab -->
<property>
    <name>ranger.plugin.hive.ugi.login.type</name>
    <value>keytab</value>
</property>
<!-- keytab 文件中对应的 principal -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.principal</name>
    <value>hive/hostname@RANGER.EXAMPLE.COM</value>
</property>
<!-- keytab 文件路径（需要部署到每台 FE 节点） -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.file</name>
    <value>/etc/security/keytabs/hive.keytab</value>
</property>
```

各配置项含义如下：

| 配置项 | 说明 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | 是否在插件加载时初始化 UGI Kerberos 登录 |
| `ranger.plugin.hive.ugi.login.type` | 登录方式，固定为 `keytab` |
| `ranger.plugin.hive.ugi.keytab.principal` | keytab 文件中实际存在的 principal，例如 `hive/your-host@YOUR-REALM.COM`，可使用 `klist -kt /path/to/hive.keytab` 查看 |
| `ranger.plugin.hive.ugi.keytab.file` | keytab 文件的绝对路径，需确保运行 Doris FE 进程的用户对该文件有读权限（建议 `chmod 400`） |

:::tip 说明
- 如果使用的是 **Doris Ranger 鉴权**（`ranger-doris-security.xml`），则将上述配置中的 `hive` 替换为 `doris`，例如 `ranger.plugin.doris.ugi.initialize` 等。
- 配置完成后需要**重启 FE** 使配置生效。
:::

:::warning 已知限制：多 Catalog 下的全局 UGI 覆盖问题
目前 Doris 中嵌入的 Ranger Plugin 依赖 Hadoop 的 `UserGroupInformation` (UGI) 进行 Kerberos 登录。由于 JVM 进程中通常共享同一个全局登录用户状态，当您在 Doris 中配置了**多个开启 Kerberos 认证的 Ranger Catalog**（且它们使用了不同的 Principal）时，会出现 UGI 互相覆盖的问题。

**具体表现**：

1. Catalog A 初始化并使用 `keytab_A` 登录后，全局 UGI 为 `Principal_A`。
2. 随后 Catalog B 初始化并使用 `keytab_B` 登录，全局 UGI 会被覆写为 `Principal_B`。
3. 此时 Catalog A 的 Ranger 插件后台线程在向 Ranger Admin 拉取权限策略时，会错误地携带 `Principal_B` 的票据，导致鉴权失败，策略拉取报错。

**当前建议**：在同一个 Doris 集群中，针对开启了 Ranger 的所有 Kerberos 数据源，**强烈建议统一规划，使用相同的 Kerberos Principal 与同一份 Keytab 文件**，以避免互相覆盖导致鉴权失效。
:::

## 权限示例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 Ranger 中为 Doris 用户配置各级别权限 -->

按以下步骤为 Doris 用户授权：

1. 在 Doris 中创建 `user1`。
2. 在 Doris 中，先使用 `admin` 用户创建一个 Catalog：`hive`。
3. 在 Ranger 中创建 `user1`。目前 Ranger 不能从 Doris 自动同步用户，Doris 也不能从 Ranger 同步用户，需要手动创建用户，**和 Doris 同名即可**。Ranger 创建用户的步骤见 Ranger 官方文档，在 `Settings -> Users` 中创建用户。

Ranger 中可为 Doris 配置的权限范围如下表所示：

| 权限范围 | 等价的 Doris GRANT 语句 | 选择方式 |
| --- | --- | --- |
| 全局权限 | `grant select_priv on *.*.* to user1` | Catalog 同级下拉框选择 `global`，输入框只能输入 `*` |
| Catalog 权限 | `grant select_priv on hive.*.* to user1` | Catalog 下拉框中选择目标 Catalog |
| Database 权限 | `grant select_priv on hive.tpch.* to user1` | 指定 Catalog 与 Database |
| Table 权限 | `grant select_priv on hive.tpch.user to user1` | 指定 Catalog、Database 与表 |
| 列权限 | `grant select_priv(name,age) on hive.tpch.user to user1` | 在表权限基础上选择列 |
| Resource 权限 | `grant usage_priv on resource 'resource1' to user1` | Catalog 同级下拉框选择 `resource` |
| Workload Group 权限 | `grant usage_priv on workload group 'group1' to user1` | Catalog 同级下拉框选择 `workload group` |
| Compute Group 权限（3.0.6+） | `grant usage_priv on compute group 'group1' to user1` | Catalog 同级下拉框选择 `compute group` |
| Storage Vault 权限（3.0.6+） | `grant usage_priv on storage vault 'vault1' to user1` | Catalog 同级下拉框选择 `storage vault` |

下面给出每种权限的 Ranger 配置示例。

### 全局权限

相当于 Doris 内部授权语句的 `grant select_priv on *.*.* to user1`：

- Catalog 同级下拉框可以找到 `global` 选项。
- 输入框里只能输入 `*`。

![global](/images/ranger/global.png)

### Catalog 权限

相当于 Doris 内部授权语句的 `grant select_priv on hive.*.* to user1`：

![catalog](/images/ranger/catalog.png)

### Database 权限

相当于 Doris 内部授权语句的 `grant select_priv on hive.tpch.* to user1`：

![database](/images/ranger/database.png)

### Table 权限

> 这里的 table 泛指表 / 视图 / 异步物化视图。

相当于 Doris 内部授权语句的 `grant select_priv on hive.tpch.user to user1`：

![table](/images/ranger/table.png)

### 列权限

相当于 Doris 内部授权语句的 `grant select_priv(name,age) on hive.tpch.user to user1`：

![column](/images/ranger/column.png)

### Resource 权限

相当于 Doris 内部授权语句的 `grant usage_priv on resource 'resource1' to user1`：

- Catalog 同级下拉框可以找到 `resource` 选项。

![resource](/images/ranger/resource.png)

### Workload Group 权限

相当于 Doris 内部授权语句的 `grant usage_priv on workload group 'group1' to user1`：

- Catalog 同级下拉框可以找到 `workload group` 选项。

![group1](/images/ranger/group1.png)

### Compute Group 权限

> 3.0.6 版本支持。

相当于 Doris 内部授权语句的 `grant usage_priv on compute group 'group1' to user1`：

- Catalog 同级下拉框可以找到 `compute group` 选项。

![compute group](/images/ranger/compute-group.png)

### Storage Vault 权限

> 3.0.6 版本支持。

相当于 Doris 内部授权语句的 `grant usage_priv on storage vault 'vault1' to user1`：

- Catalog 同级下拉框可以找到 `storage vault` 选项。

![storage vault](/images/ranger/storage-vault.png)

## 行权限示例

> 2.1.3 版本支持。

1. 参考 [权限示例](#权限示例) 给 `user1` 分配 `internal.db1.user` 表的 `select` 权限。
2. 在 Ranger 中添加一个 Row Level Filter policy：

    ![Row Policy 示例](/images/ranger/ranger-row-policy.jpeg)

3. 使用 `user1` 登录 Doris。执行 `select * from internal.db1.user`，只能看到满足 `id > 3` 且 `age = 2` 的数据。

## 数据脱敏示例

> 2.1.3 版本支持。

1. 参考 [权限示例](#权限示例) 给 `user1` 分配 `internal.db1.user` 表的 `select` 权限。
2. 在 Ranger 中添加一个 Masking policy：

    ![Data Mask 示例](/images/ranger/ranger-data-mask.png)

3. 使用 `user1` 登录 Doris。执行 `select * from internal.db1.user`，看到的 `phone` 字段是按照指定规则脱敏后的数据。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: Ranger 鉴权失败 / 策略拉取异常 / 日志排查 -->

### Q: Ranger 访问失败，怎么查看日志？

在所有 FE 的 `conf` 目录创建 `log4j.properties` 文件，内容如下：

```text
log4j.rootLogger = warn,stdout,D

log4j.appender.stdout = org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target = System.out
log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n

log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
log4j.appender.D.File = /path/to/fe/log/ranger.log
log4j.appender.D.Append = true
log4j.appender.D.Threshold = INFO
log4j.appender.D.layout = org.apache.log4j.PatternLayout
log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
```

其中：

- `log4j.appender.D.File` 改为实际值，用于存放 Ranger 插件的日志。
- `log4j.rootLogger` 可以根据需要调整日志级别（如 `debug`、`info` 等）。注意 `debug` 只能用于调试，不能用于生产环境，否则日志量会非常大，也会导致鉴权性能下降。

### Q: 配置了 Row Level Filter policy，但是用户查询时报没有权限？

Row Level Filter policy 仅用来限制用户访问表中数据的特定记录，**仍需通过 ACCESS POLICY 为用户授权**。

### Q: 创建服务后，默认仅 `admin` 用户有权限，`root` 用户没有权限？

如图所示，创建服务的时候，添加配置 `default.policy.users`。如需配置多个用户拥有全部权限，用 `,` 分隔。

![default policy](/images/ranger/default-policy.png)

### Q: 使用 Ranger 鉴权后，Doris 内部授权还有用吗？

不能使用，也不能创建 / 删除角色。所有权限均需在 Ranger 中配置。
