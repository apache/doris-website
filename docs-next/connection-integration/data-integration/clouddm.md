---
{
    "title": "CloudDM",
    "language": "zh-CN",
    "description": "CloudDM 由 Clougence 研发，是一款为团队和个人用户而设计的跨平台数据库工具，帮助实现安全、高效、合规的数据库变更与管理。"
}
---

## 介绍

CloudDM 由 Clougence 研发，是一款为团队和个人用户而设计的跨平台数据库工具，帮助实现安全、高效、合规的数据库变更与管理。

CloudDM 针对 Apache Doris 的一些特性提供专项适配，并为 Apache Doris 提供数据访问、数据脱敏、可视化编辑、数据库CI/CD 能力。

## 前置条件

已安装 CloudDM。可以访问 https://www.cdmgr.com/ 下载并安装 CloudDM。

## 添加数据源

:::info 备注
当前验证使用 CloudDM 2.8.0.0 版本。
:::

1. 登录 CloudDM。
2. 在导航栏点击 **数据源管理** > **新增数据源**。
3. 选择 Doris 数据源。

   ![添加数据源](/images/clouddm1-cn.png)

4. 在添加数据源页面中，配置以下连接信息：
  - Client 地址：Doris 集群机器的 FE 查询端口，如 hostID:9030。
  - 账号：用于登录 Doris 集群的用户名，如 admin。
  - 密码：用于登录 Doris 集群的用户密码。
    :::tip
    Doris 分为 internal catalog 和 external catalog，CloudDM 可以同时管理它们。
    :::

    :::info 备注
    通过 catalog.db 的 Database 形式来管理连接 Doris 的 external catalog 需要 Doris 版本在 2.1.0 及以上。
    :::

5. 在上方点击 **查询设置** > **查询配置**，为 Doris 实例启用数据管理，并测试连接。

   ![启用数据源](/images/clouddm2-cn.png)

6. 访问数据。   
   数据库连接建立以后，可以在左侧的数据库连接导航看到已连接的数据源，并且可以通过 CloudDM 连接并管理数据库。

   ![建立连接](/images/clouddm3-cn.png)

## 功能支持

- 查询客户端
  - 可视化管理 Doris 中的数据库对象
  - 控制台编写 SQL 操作 Doris
  - 查询结果导出
- 团队化使用
  - 语句级授权，粒度表级别
  - 工单审批
  - 数据库 CI/CD
  - 敏感数据脱敏
  - SQL 审核规则

