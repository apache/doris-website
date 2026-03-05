---
{
    "title": "DBeaver",
    "language": "zh-CN",
    "description": "DBeaver 是一款跨平台数据库工具，适用于开发人员、数据库管理员、分析师和所有处理数据的人。"
}
---

## 介绍

DBeaver 是一款跨平台数据库工具，适用于开发人员、数据库管理员、分析师和所有处理数据的人。

Apache Doris 高度兼容 MySQL 协议，可以使用 DBeaver 的 MySQL 驱动器连接 Apache Doris，并查询 internal catalog 和 external catalog 中的数据。

## 前置条件

已安装 Dbeaver
可以访问 https://dbeaver.io 下载安装 DBeaver

## 添加数据源

:::info 备注
当前验证使用 DBeaver 24.0.0 版本
:::

1. 启动 DBeaver
2. 在 DBeaver 窗口左上角单击加号 (**+**) 图标，或者在菜单栏选择 **Database > New Database Connection**，打开 **Connect to a database** 界面。
   
    ![添加连接 1](/images/dbeaver1.png)

    ![添加连接 2](/images/dbeaver2.png)

3. 选择 MySQL 驱动器

    在 **Select your database** 窗口，选择 **MySQL** 。

    ![选择驱动](/images/dbeaver3.png)

4. 配置 Doris 连接 

    在 **Connection Settings** 窗口的 **main** 标签页，配置以下连接信息：

  - Server Host：Doris 集群的 FE 主机 IP 地址。
  - Port：Doris 集群的 FE 查询端口，如 9030。
  - Database：Doris 集群中的目标数据库。
  - Username：用于登录 Doris 集群的用户名，如 admin。
  - Password：用于登录 Doris 集群的用户密码。

    :::tip
    Database 可以用于区别 internal catalog 和 external catalog，如仅填写 Database 名称，则当前数据源默认连接 internal catalog，如填写格式为 catalog.db，则当前数据源默认连接 Database 中所填写的 catalog，DBeaver 中展示的库表也为所连接 catalog 中的库表，因此可以使用 DBeaver 的 MySQL 驱动器来创建多个 Doris 数据源来管理 Doris 中不同的 Catalog。
    :::

    :::info 备注
    通过 catalog.db 的 Database 形式来管理连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上
    :::

  - internal catalog

  ![连接 internal catalog](/images/dbeaver4.png)

  - external catalog

  ![连接 external catalog](/images/dbeaver5.png)

5. 测试数据源连接

    在填写完连接信息后，单击左下角 Test Connection 验证数据库连接信息的准确性。DBeaver 返回如下对话框，确认配置连接信息。单击 OK 即确认配置连接信息无误。然后单击右下角 Finish 完成连接配置。

    ![测试连接](/images/dbeaver6.png)

6. 连接数据库

    数据库连接建立以后，可以在左侧的数据库连接导航看到已创建的数据源连接，并且可以通过 DBeaver 连接并管理数据库。

    ![建立连接](/images/dbeaver7.png)

## 功能支持

- 完全支持
  - 可视化查看类
    - Databases
      - Tables
      - Views
  - Users
  - Administer
      - Session Manager
  - System Info
      - Session Variables
      - Global Variables
      - Engines
      - Charsets
      - User Priviages
      - Plugin
  - 操作类
      - SQL 编辑器
      - SQL 控制台
- 基本支持

    基本支持的部分意为可以点击查看不会报错，但由于存在协议兼容问题，可能存在显示不全

  - 可视化查看类
    - 仪表盘
    - Users/user/properties
    - Session Status
    - Global Status
- 不支持

    不支持部分意为使用 DBeaver 管理 Doris 进行某些可视化操作时可能会报错，或者某些可视化操作未经验证
    如可视化创建库表、schema change、增删改数据等
