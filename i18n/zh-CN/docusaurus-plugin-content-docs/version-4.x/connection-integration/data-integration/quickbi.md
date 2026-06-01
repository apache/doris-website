---
{
    "title": "Quick BI",
    "language": "zh-CN",
    "description": "了解如何在 Quick BI 中连接 Apache Doris 数据源，创建 Doris 数据集，并通过表格、图表、地图等组件搭建可视化分析报表，适用于 BI 工具对接和数据分析场景。",
    "keywords": [
        "Quick BI 连接 Doris",
        "Apache Doris Quick BI",
        "Doris 可视化分析",
        "Quick BI 数据源"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BI 工具对接 / 可视化分析 -->

Quick BI 是一款基于数据仓库的商业智能工具，可以帮助企业快速搭建可视化分析罗盘。Quick BI 支持多种数据源，包括 MySQL、Oracle、SQL Server、Apache Doris 等数据库，以及 Excel、CSV、JSON 等文件格式。它提供表格、图表、地图等可视化组件，用户可以通过拖拽操作完成数据可视化分析。

本文介绍如何在 Quick BI 中接入 Apache Doris 数据源，并基于 Doris 数据源创建数据集，用于后续报表分析。

## 适用场景

| 使用场景 | 用户目标 | 操作结果 |
| --- | --- | --- |
| 接入 Doris 数据源 | 在 Quick BI 工作区中创建 Apache Doris 数据源 | Quick BI 可以访问 Doris 中的数据 |
| 创建分析数据集 | 基于已创建的数据源选择 Doris 数据表 | 生成可用于报表配置的数据集 |
| 搭建可视化报表 | 使用 Quick BI 的可视化组件分析 Doris 数据 | 通过表格、图表、地图等组件展示分析结果 |

## Quick BI 能力概览

| 能力 | 说明 |
| --- | --- |
| 数据库数据源 | 支持 MySQL、Oracle、SQL Server、Apache Doris 等数据库 |
| 文件数据源 | 支持 Excel、CSV、JSON 等文件格式 |
| 可视化组件 | 提供表格、图表、地图等组件 |
| 分析方式 | 支持通过拖拽操作进行数据可视化分析 |

## 前置准备

开始操作前，请确认已准备以下信息：

- 已登录 Quick BI，并可以创建工作区。
- 已准备 Apache Doris 的连接信息。
- Doris 中已有可用于创建数据集的数据表。本文以 TPC-H 数据集为例。

## 操作流程

| 步骤 | 操作目标 | 说明 |
| --- | --- | --- |
| 第一步 | 创建工作区 | 登录 Quick BI，并建立用于管理数据源和数据集的工作区 |
| 第二步 | 新建 Doris 数据源 | 在工作区中选择 Apache Doris，并填写 Doris 连接信息 |
| 第三步 | 确认连接结果 | 连接成功后，在数据源列表中查看已创建的数据源 |
| 第四步 | 创建数据集 | 基于 Doris 数据源创建数据集，并用于后续报表配置 |

### 第一步：创建 Quick BI 工作区

1. 登录 Quick BI，并建立一个工作区。

2. 在当前工作区下点击新建数据源。

    ![新建数据源](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-1.png)

### 第二步：新建 Doris 数据源

在新建数据源页面选择 **Apache Doris**，并填写对应的 Doris 连接信息。

![填写 Doris 连接信息](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-2.png)

### 第三步：确认数据源连接结果

连接成功后，可以在数据源列表中看到已创建的 Doris 数据源。

![查看数据源](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-3.png)

### 第四步：创建数据集并配置报表

在已创建的数据源中创建数据集。本文以 TPC-H 数据集为例，创建数据集后即可设置对应的报表。

![创建 Doris 数据集](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-4.png)

## 完成结果

完成以上配置后，Quick BI 可以通过已创建的 Doris 数据源访问 Doris 数据，并基于数据集配置可视化分析报表。
