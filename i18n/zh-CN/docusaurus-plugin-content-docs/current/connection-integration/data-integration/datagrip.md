---
{
    "title": "DataGrip",
    "language": "zh-CN",
    "description": "了解如何使用 DataGrip 的 MySQL 数据源连接 Apache Doris，配置 internal catalog 与 external catalog，并验证连接。"
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 DataGrip 连接和查询 Apache Doris -->

## 适用场景

DataGrip 是 JetBrains 出品的适用于关系数据库和 NoSQL 数据库的强大跨平台数据库工具。Apache Doris 高度兼容 MySQL 协议，因此可以使用 DataGrip 的 MySQL 数据源连接 Apache Doris，并查询 internal catalog 和 external catalog 中的数据。

阅读本文后，你可以完成以下操作：

- 使用 MySQL 数据源创建 Doris 连接。
- 配置 internal catalog 或 external catalog 的连接信息。
- 验证连接，并在 DataGrip 中查看和管理数据库。

## 前置条件

- 已安装 DataGrip。如未安装，可以访问 [DataGrip 官网](https://www.jetbrains.com/datagrip/) 下载并安装。
- 已准备 Doris 集群连接信息，包括 FE 主机 IP 地址、FE 查询端口、目标数据库、用户名和密码。

:::info 版本说明
本文操作基于 DataGrip 2023.3.4 版本验证。
:::

## 连接 Doris

### 1. 添加 MySQL 数据源

启动 DataGrip，在 DataGrip 窗口左上角单击加号 (**+**) 图标，选择 MySQL 数据源。

![添加数据源](/images/datagrip1.png)

### 2. 配置 Doris 连接

在 Data Sources and Drivers 窗口的 General 标签页，配置 Doris 连接信息。

| 配置项 | 说明 |
| --- | --- |
| Host | Doris 集群的 FE 主机 IP 地址。 |
| Port | Doris 集群的 FE 查询端口，如 `9030`。 |
| Database | Doris 集群中的目标数据库，也可以使用 `catalog.db` 格式指定 catalog。 |
| User | 用于登录 Doris 集群的用户名，如 `admin`。 |
| Password | 用于登录 Doris 集群的用户密码。 |

Database 可以用于区别 internal catalog 和 external catalog。可以使用 DataGrip 的 MySQL 数据源创建多个 Doris 数据源，分别管理 Doris 中不同的 Catalog。

| Database 填写方式 | 默认连接 |
| --- | --- |
| 仅填写 Database 名称 | 默认连接 internal catalog。 |
| 填写 `catalog.db` | 默认连接 Database 中所填写的 catalog，DataGrip 中展示的库表也为所连接 catalog 中的库表。 |

:::info 版本说明
通过 `catalog.db` 的 Database 形式管理 Doris 的 external catalog，需要 Doris 版本在 2.1.0 及以上。
:::

internal catalog 连接示例如下：

![连接 internal catalog](/images/datagrip2.png)

external catalog 连接示例如下：

![连接 external catalog](/images/datagrip3.png)

### 3. 测试数据源连接

填写完连接信息后，单击左下角 Test Connection，验证数据库连接信息的准确性。DataGrip 返回如下弹窗时，表示测试连接成功。然后单击右下角 OK 完成连接配置。

![测试连接](/images/datagrip4.png)

### 4. 连接并管理数据库

数据库连接建立后，可以在左侧的数据库连接导航中看到已创建的数据源连接，并通过 DataGrip 连接并管理数据库。

![建立连接](/images/datagrip5.png)

## 功能支持范围

| 支持情况 | 说明 |
| --- | --- |
| 基本支持 | 大部分可视化查看操作，以及通过 SQL 控制台编写 SQL 来操作 Doris。 |
| 不支持或未经验证 | 创建库表、schema change、增删改数据等操作。 |
