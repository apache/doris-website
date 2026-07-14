---
{
    "title": "DBeaver",
    "language": "zh-CN",
    "description": "使用 DBeaver 的 Apache Doris 驱动或 MySQL 驱动连接 Apache Doris，浏览和管理 internal catalog 与 external catalog，并执行 SQL 查询。"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 DBeaver 可视化连接与管理 Apache Doris 数据库 -->

DBeaver 是一款跨平台数据库工具，适用于开发人员、数据库管理员、分析师以及所有处理数据的用户。

Apache Doris 可通过 MySQL 协议对外提供查询服务。在包含 Apache Doris 驱动的 DBeaver 版本中，可以直接使用 `Apache Doris` 数据源入口连接 Doris，并查询 internal catalog 和 external catalog 中的数据。

如果当前 DBeaver 版本中没有 `Apache Doris` 驱动入口，也可以通过 MySQL 驱动连接 Apache Doris。具体操作请参考[使用 MySQL 驱动连接 Doris](#使用-mysql-驱动连接-doris)。

## 适用场景

- 通过可视化界面浏览 Apache Doris 的 catalog、database、table、view 等元数据。
- 使用 SQL 编辑器执行查询、分析数据。
- 在同一工具中管理 internal catalog 与 external catalog。
- 查看会话、系统变量、用户权限等运行信息。

## 前置条件

- 已安装 DBeaver 26.1.1 或更高版本，下载地址：[https://dbeaver.io](https://dbeaver.io)。
- 可访问 Apache Doris 集群，并已知 FE 主机地址、MySQL 协议端口、账号与密码。
- 若需通过 `catalog.db` 形式连接 external catalog，Doris 版本需为 2.1.0 及以上。

## 操作步骤

### 使用 Apache Doris 驱动连接 Doris（推荐）

:::warning 版本要求
DBeaver 需要升级到 26.1.1 或更高版本。
:::

#### 步骤 1：新建数据库连接

启动 DBeaver。

在窗口左上角单击加号（`+`）图标，或在菜单栏选择 `Database` > `New Database Connection`，打开 `Connect to a database` 界面。

![新建数据库连接](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-add-connection.jpg)

#### 步骤 2：选择 Apache Doris 驱动

在 `Select your database` 窗口中搜索或选择 `Apache Doris`，然后单击 `Next`。

![选择 Apache Doris 驱动](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-select-driver.jpg)

#### 步骤 3：配置 Doris 连接信息

在 `Apache Doris connection settings` 窗口的 `Main` 标签页填写以下连接信息：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Host | Doris 集群的 FE 主机地址。如果使用 SSH 隧道，填写本地转发地址。 | `127.0.0.1` |
| Port | Doris 集群的 FE MySQL 协议端口。如果使用 SSH 隧道，填写本地转发端口。 | `9030` 或 `19030` |
| Database/Schema | 可选。Doris 集群中的目标 database，也可使用 `catalog.db` 形式连接 external catalog。 | `example_db` 或 `hive.example_db` |
| Username | 用于登录 Doris 集群的用户名。 | `admin` |
| Password | 用于登录 Doris 集群的用户密码。 | - |

`Database/Schema` 字段可用于区分 internal catalog 与 external catalog：

- 留空：连接建立后在 DBeaver 的 Database Navigator 中浏览 catalog 和 database。
- 仅填写 database 名称：当前数据源默认连接 internal catalog 下的指定 database。
- 填写格式为 `catalog.db`：当前数据源默认连接所指定 catalog 下的指定 database，DBeaver 中展示的库表也为该 catalog 中的库表。

:::note 备注
通过 `catalog.db` 形式连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上。
:::

连接 internal catalog：

![连接 internal catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-internal-catalog.jpg)

连接 external catalog：

![连接 external catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-external-catalog.jpg)

如需通过 DBeaver 内置 SSH 功能连接，可以单击右上角 `SSH, Proxy` 配置 SSH 隧道。如果已在本机提前建立端口转发，则在 `Host` 和 `Port` 中填写本地转发地址和端口。

#### 步骤 4：测试并保存连接

填写完连接信息后，单击左下角 `Test Connection` 验证连接信息的准确性。

DBeaver 弹出确认对话框后，单击 `OK` 确认配置无误。

单击右下角 `Finish` 完成连接配置。

![测试 Apache Doris 驱动连接](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-test-connection.jpg)

#### 步骤 5：连接并管理数据库

数据库连接建立完成后，可在左侧的数据库连接导航栏看到已创建的数据源，并通过 DBeaver 浏览 Doris catalog、database、table、view 等对象。

![浏览 Doris 数据库对象](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-navigator.jpg)

#### 配置 Driver Properties

Apache Doris 驱动底层使用 MySQL Connector/J 连接 Doris FE 的 MySQL 协议端口。驱动默认端口为 `9030`，默认用户为 `root`，JDBC URL 模板如下：

```text
jdbc:mysql://{host}[:{port}]/[{database}]
```

驱动类为：

```text
com.mysql.cj.jdbc.Driver
```

常见默认参数如下：

```text
connectTimeout=20000
rewriteBatchedStatements=true
useSSL=false
enabledTLSProtocols=TLSv1.2,TLSv1.3
```

![配置 Apache Doris 驱动属性](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-driver-properties.jpg)

`useSSL=false` 表示默认不启用 TLS/SSL。若 Doris FE 的 MySQL 协议端口已正确开启 TLS，并且证书链配置正确，可在 DBeaver 的 `Driver properties` 中配置 MySQL Connector/J 的 SSL 参数，例如：

```text
useSSL=true
sslMode=REQUIRED
```

如需校验证书，可配置 Java truststore，并使用：

```text
sslMode=VERIFY_CA
trustCertificateKeyStoreUrl=file:/path/to/doris-truststore.jks
trustCertificateKeyStorePassword=<password>
```

如需同时校验服务端主机名，可使用：

```text
sslMode=VERIFY_IDENTITY
```

使用 `VERIFY_IDENTITY` 时，DBeaver 中填写的 Host 必须和服务端证书的 SAN/CN 匹配。

### 使用 MySQL 驱动连接 Doris

如果当前 DBeaver 版本中没有 `Apache Doris` 驱动入口，可以通过 MySQL 驱动连接 Apache Doris。

#### 步骤 1：新建数据库连接

启动 DBeaver。

在窗口左上角单击加号（`+`）图标，或在菜单栏选择 `Database` > `New Database Connection`，打开 `Connect to a database` 界面。

![新建 MySQL 数据库连接](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-add-connection.jpg)

#### 步骤 2：选择 MySQL 驱动

在 `Select your database` 窗口中选择 `MySQL`。

#### 步骤 3：配置 Doris 连接信息

在 `Connection Settings` 窗口的 `Main` 标签页填写以下连接信息：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Server Host | Doris 集群的 FE 主机 IP 地址。 | `127.0.0.1` |
| Port | Doris 集群的 FE MySQL 协议端口。 | `9030` |
| Database | Doris 集群中的目标 database，也可使用 `catalog.db` 形式连接 external catalog。 | `example_db` 或 `hive.example_db` |
| Username | 用于登录 Doris 集群的用户名。 | `admin` |
| Password | 用于登录 Doris 集群的用户密码。 | - |

`Database` 字段可用于区分 internal catalog 与 external catalog：

- 仅填写 database 名称：当前数据源默认连接 internal catalog。
- 填写格式为 `catalog.db`：当前数据源默认连接所指定 catalog，DBeaver 中展示的库表也为该 catalog 中的库表。

因此，可通过创建多个 Doris 数据源来分别管理不同的 catalog。

:::note 备注
通过 `catalog.db` 形式连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上。
:::

连接 internal catalog：

![通过 MySQL 驱动连接 internal catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-internal-catalog.jpg)

连接 external catalog：

![通过 MySQL 驱动连接 external catalog](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-external-catalog.jpg)

#### 步骤 4：测试并保存连接

填写完连接信息后，单击左下角 `Test Connection` 验证连接信息的准确性。

DBeaver 弹出确认对话框后，单击 `OK` 确认配置无误。

![测试 MySQL 驱动连接](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-test-connection.jpg)

单击右下角 `Finish` 完成连接配置。

#### 步骤 5：连接并管理数据库

数据库连接建立完成后，可在左侧的数据库连接导航栏看到已创建的数据源，并通过 DBeaver 进行连接与管理。

![通过 MySQL 驱动管理数据库](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-navigator.jpg)

## 功能支持

DBeaver 对 Apache Doris 的功能支持情况如下。

### 完全支持

| 类别 | 功能项 |
|------|--------|
| 可视化查看 | Databases（Tables、Views）、Users |
| Administer | Session Manager |
| System Info | Session Variables、Global Variables、Engines、Charsets、User Privileges、Plugin |
| 操作类 | SQL 编辑器、SQL 控制台 |

### 基本支持

可点击查看且不会报错，但由于协议兼容问题，可能存在显示不全的情况：

- 仪表盘。
- Users / user / properties。
- Session Status。
- Global Status。

### 不支持

使用 DBeaver 管理 Apache Doris 进行某些可视化操作时可能会报错，或某些可视化操作未经验证，例如：

- 可视化创建库表。
- Schema Change。
- 可视化增、删、改数据。
