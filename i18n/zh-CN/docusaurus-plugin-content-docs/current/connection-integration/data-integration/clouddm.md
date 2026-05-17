---
{
    "title": "CloudDM",
    "language": "zh-CN",
    "description": "使用 CloudDM 连接 Apache Doris 并管理 Doris 数据源，支持数据访问、脱敏、可视化编辑和数据库 CI/CD。"
}
---

## 概述

<!-- 知识类型: 场景说明 -->
<!-- 适用场景: 使用 CloudDM 连接和管理 Apache Doris 数据源 -->

CloudDM 由 Clougence 研发，是一款面向团队和个人用户的跨平台数据库工具，帮助用户安全、高效、合规地进行数据库变更与管理。

在 Apache Doris 场景中，CloudDM 针对 Doris 特性提供专项适配，支持数据访问、数据脱敏、可视化编辑和数据库 CI/CD。阅读本文后，你可以完成以下任务：

- 在 CloudDM 中新增 Doris 数据源。
- 启用 Doris 实例的数据管理并测试连接。
- 使用 CloudDM 访问和管理 Doris 数据。

## 使用前准备

<!-- 知识类型: 前置条件 -->
<!-- 适用场景: 连接 Doris 前检查 CloudDM 安装和验证版本 -->

| 检查项 | 要求 |
|-------|------|
| CloudDM | 已安装 CloudDM。可以访问 [CloudDM 官网](https://www.cdmgr.com/) 下载并安装。 |
| 验证版本 | 本文验证使用 CloudDM 2.8.0.0 版本。 |

## 连接 Doris 数据源

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 在 CloudDM 中创建 Doris 数据源连接 -->

### 1. 新增 Doris 数据源

1. 登录 CloudDM。
2. 在导航栏点击 **数据源管理** > **新增数据源**。
3. 选择 Doris 数据源。

![添加数据源](/images/next/connection-integration/data-integration/clouddm/clouddm1-cn.png)

### 2. 配置连接信息

在添加数据源页面中，配置以下连接信息：

| 配置项 | 说明 |
|-------|------|
| Client 地址 | Doris 集群机器的 FE 查询端口，例如 `hostID:9030`。 |
| 账号 | 用于登录 Doris 集群的用户名，例如 `admin`。 |
| 密码 | 用于登录 Doris 集群的用户密码。 |

:::tip
Doris 分为 `internal catalog` 和 `external catalog`，CloudDM 可以同时管理它们。
:::

:::info 备注
如需通过 `catalog.db` 的 Database 形式管理 Doris 的 `external catalog`，Doris 版本需为 2.1.0 及以上。
:::

### 3. 启用数据管理并测试连接

在上方点击 **查询设置** > **查询配置**，为 Doris 实例启用数据管理，并测试连接。

![启用数据源](/images/next/connection-integration/data-integration/clouddm/clouddm2-cn.png)

### 4. 访问 Doris 数据

数据库连接建立后，可以在左侧的数据库连接导航中看到已连接的数据源，并通过 CloudDM 连接和管理数据库。

![建立连接](/images/next/connection-integration/data-integration/clouddm/clouddm3-cn.png)

## 支持的 Doris 管理场景

<!-- 知识类型: 功能支持 -->
<!-- 适用场景: 了解 CloudDM 支持哪些 Doris 管理能力 -->

CloudDM 支持的 Doris 功能包括以下两类：

| 使用场景 | 支持能力 |
|---------|---------|
| 查询客户端 | 可视化管理 Doris 中的数据库对象；在控制台编写 SQL 操作 Doris；导出查询结果。 |
| 团队化使用 | 语句级授权，粒度到表级别；工单审批；数据库 CI/CD；敏感数据脱敏；SQL 审核规则。 |
