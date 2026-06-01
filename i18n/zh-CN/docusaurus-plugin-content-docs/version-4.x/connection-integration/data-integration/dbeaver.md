---
{
    "title": "DBeaver",
    "language": "zh-CN",
    "description": "使用 DBeaver 通过 MySQL 驱动连接 Apache Doris，可视化管理 internal catalog 与 external catalog，执行 SQL 查询。"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 DBeaver 可视化连接与管理 Apache Doris 数据库 -->

DBeaver 是一款跨平台数据库工具，适用于开发人员、数据库管理员、分析师以及所有处理数据的用户。

Apache Doris 高度兼容 MySQL 协议，可使用 DBeaver 的 MySQL 驱动连接 Apache Doris，并查询 internal catalog 和 external catalog 中的数据。

## 适用场景

- 通过可视化界面浏览 Apache Doris 的库、表、视图等元数据
- 使用 SQL 编辑器执行查询、分析数据
- 在同一工具中统一管理 internal catalog 与多个 external catalog
- 监控会话、查看系统变量与用户权限等运行信息

## 前置条件

- 已安装 DBeaver（推荐 24.0.0 及以上版本），下载地址：[https://dbeaver.io](https://dbeaver.io)
- 可访问的 Apache Doris 集群，并已知 FE 主机地址、查询端口、账号与密码
- 若需通过 `catalog.db` 形式连接 external catalog，Doris 版本需为 2.1.0 及以上

## 操作步骤

:::info 备注
当前操作基于 DBeaver 24.0.0 版本验证。
:::

### 步骤 1：新建数据库连接

1. 启动 DBeaver。
2. 在窗口左上角单击加号（**+**）图标，或在菜单栏选择 **Database > New Database Connection**，打开 **Connect to a database** 界面。

    ![添加连接 1](/images/next/connection-integration/data-integration/dbeaver/dbeaver1.png)

    ![添加连接 2](/images/next/connection-integration/data-integration/dbeaver/dbeaver2.png)

### 步骤 2：选择 MySQL 驱动

在 **Select your database** 窗口中选择 **MySQL**。

![选择驱动](/images/next/connection-integration/data-integration/dbeaver/dbeaver3.png)

### 步骤 3：配置 Doris 连接信息

在 **Connection Settings** 窗口的 **Main** 标签页填写以下连接信息：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Server Host | Doris 集群的 FE 主机 IP 地址 | `127.0.0.1` |
| Port | Doris 集群的 FE 查询端口 | `9030` |
| Database | Doris 集群中的目标数据库 | `example_db` 或 `hive.example_db` |
| Username | 用于登录 Doris 集群的用户名 | `admin` |
| Password | 用于登录 Doris 集群的用户密码 | - |

:::tip Database 字段使用说明
Database 字段可用于区分 internal catalog 与 external catalog：

- 仅填写 Database 名称：当前数据源默认连接 internal catalog。
- 填写格式为 `catalog.db`：当前数据源默认连接所指定 catalog，DBeaver 中展示的库表也为该 catalog 中的库表。

因此，可通过创建多个 Doris 数据源来分别管理不同的 Catalog。
:::

:::info 备注
通过 `catalog.db` 形式连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上。
:::

连接示例：

- 连接 internal catalog

    ![连接 internal catalog](/images/next/connection-integration/data-integration/dbeaver/dbeaver4.png)

- 连接 external catalog

    ![连接 external catalog](/images/next/connection-integration/data-integration/dbeaver/dbeaver5.png)

### 步骤 4：测试并保存连接

1. 填写完连接信息后，单击左下角 **Test Connection** 验证连接信息的准确性。
2. DBeaver 弹出确认对话框后，单击 **OK** 确认配置无误。
3. 单击右下角 **Finish** 完成连接配置。

![测试连接](/images/next/connection-integration/data-integration/dbeaver/dbeaver6.png)

### 步骤 5：连接并管理数据库

数据库连接建立完成后，可在左侧的数据库连接导航栏看到已创建的数据源，并通过 DBeaver 进行连接与管理。

![建立连接](/images/next/connection-integration/data-integration/dbeaver/dbeaver7.png)

## 功能支持

DBeaver 对 Apache Doris 的功能支持情况如下：

### 完全支持

| 类别 | 功能项 |
|------|--------|
| 可视化查看 | Databases（Tables、Views）、Users |
| Administer | Session Manager |
| System Info | Session Variables、Global Variables、Engines、Charsets、User Privileges、Plugin |
| 操作类 | SQL 编辑器、SQL 控制台 |

### 基本支持

可点击查看且不会报错，但由于协议兼容问题，可能存在显示不全的情况：

- 仪表盘
- Users / user / properties
- Session Status
- Global Status

### 不支持

使用 DBeaver 管理 Apache Doris 进行某些可视化操作时可能会报错，或某些可视化操作未经验证，例如：

- 可视化创建库表
- Schema Change
- 可视化增、删、改数据
