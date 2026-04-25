---
{
    "title": "DataGrip",
    "language": "zh-CN",
    "description": "DataGrip 是 JetBrains 出品的适用于关系数据库和 NoSQL 数据库的强大跨平台数据库工具。"
}
---

## 介绍

DataGrip 是 JetBrains 出品的适用于关系数据库和 NoSQL 数据库的强大跨平台数据库工具。

Apache Doris 高度兼容 MySQL 协议，可以使用 DataGrip 的 MySQL 数据源连接 Apache Doris，并查询 internal catalog 和 external catalog 中的数据。

## 前置条件

已安装 DataGrip
可以访问 www.jetbrains.com/datagrip/ 下载安装 DataGrip

## 添加数据源

:::info 备注
当前验证使用 DataGrip 2023.3.4 版本
:::

1. 启动 DataGrip
2. 在 DataGrip 窗口左上角单击加号 (**+**) 图标，选择 MySQL 数据源

    ![添加数据源](/images/datagrip1.png)

3. 配置 Doris 连接

    在 Data Sources and Drivers 窗口的 General 标签页，配置以下连接信息：

  - Host：Doris 集群的 FE 主机 IP 地址。
  - Port：Doris 集群的 FE 查询端口，如 9030。
  - Database：Doris 集群中的目标数据库。
  - User：用于登录 Doris 集群的用户名，如 admin。
  - Password：用于登录 Doris 集群的用户密码。

    :::tip
    Database 可以用于区别 internal catalog 和 external catalog，如仅填写 Database 名称，则当前数据源默认连接 internal catalog，如填写格式为 catalog.db，则当前数据源默认连接 Database 中所填写的 catalog，DataGrip 中展示的库表也为所连接 catalog 中的库表，以此可以使用 DataGrip 的 MySQL 数据源来创建多个 Doris 数据源来管理 Doris 中不同的 Catalog。
    :::

    :::info 备注
    通过 catalog.db 的 Database 形式来管理连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上
    :::

  - internal catalog

    ![连接 internal catalog](/images/datagrip2.png)

  - external catalog

    ![连接 external catalog](/images/datagrip3.png)

5. 测试数据源连接

    在填写完连接信息后，单击左下角 Test Connection 验证数据库连接信息的准确性。DataGrip 返回如下对弹窗则测试连接成功。然后单击右下角 OK 完成连接配置。

   ![测试连接](/images/datagrip4.png)

6. 连接数据库

    数据库连接建立以后，可以在左侧的数据库连接导航看到已创建的数据源连接，并且可以通过 DataGrip 连接并管理数据库。

   ![建立连接](/images/datagrip5.png)

## 功能支持

基本支持大部分可视化查看操作，以及 SQL 控制台编写 SQL 操作 Doris，不支持或未经验证各种创建库表、schema change、增删改数据操作。
