---
{
    "title": "Smartbi",
    "language": "zh-CN",
    "description": "了解如何在 Smartbi 中连接 Apache Doris 数据源，完成数据连接、建模和可视化分析，构建数据分析报表。",
    "keywords": [
        "Smartbi 连接 Doris",
        "Apache Doris Smartbi",
        "Doris 数据源",
        "Smartbi 数据可视化"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BI 工具对接 / 可视化分析 -->

[Smartbi](https://www.smartbi.com.cn/) 是一组软件服务和应用连接器，可以连接 Oracle、SQL Server、MySQL、Apache Doris 等多种数据源，帮助用户整合和清洗数据。

本文介绍如何在 Smartbi 中接入 Apache Doris 数据源，并基于 Doris 数据进行建模、分析和可视化展示。

## 适用场景

| 使用场景 | 用户目标 | 操作结果 |
| --- | --- | --- |
| 接入 Doris 数据源 | 在 Smartbi 中创建 Doris 数据连接 | Smartbi 可以访问 Doris 中的数据 |
| 构建分析模型 | 基于 Doris 数据创建关系模型、编写数据分析表达式并建立数据关系 | 为后续高级数据分析和可视化提供基础 |
| 制作可视化报表 | 使用 Smartbi 的图表、地理地图、交互式仪表板和自定义可视化工具展示数据 | 更直观、全面地理解和展示数据 |

## Smartbi 能力概览

| 能力 | 说明 |
| --- | --- |
| 数据源连接 | 支持连接 Oracle、SQL Server、MySQL、Apache Doris 等多种数据源 |
| 数据建模 | 支持创建复杂关系模型、编写数据分析表达式并建立数据关系 |
| 可视化分析 | 提供图表、地理地图、交互式仪表板和自定义可视化工具 |
| 数据展示 | 帮助用户更直观、更全面地理解和展示数据，提升数据分析效果和效率 |

## 前置准备

开始操作前，请确认已准备以下信息：

- 已具备 Smartbi 登录条件。
- 已准备 Apache Doris 数据库的连接信息。
- 已明确需要在电子服务看板中设置的报表信息。

## 操作流程

| 步骤 | 操作目标 | 说明 |
| --- | --- | --- |
| 第一步 | 进入数据连接页面 | 登录 Smartbi 后，打开数据连接入口 |
| 第二步 | 选择 Doris 数据库 | 在可连接的数据库列表中选择 Doris |
| 第三步 | 填写连接信息 | 输入 Doris 数据库的连接信息 |
| 第四步 | 测试连接 | 确认连接信息无误，并完成连接测试 |
| 第五步 | 配置报表 | 进入数据分析模块，在电子服务看板中设置报表信息 |

### 第一步：进入数据连接页面

登录 Smartbi 后，点击数据连接。

![进入数据连接页面](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-1.png)

### 第二步：选择 Doris 数据库

在数据连接页面中查看可连接的数据库列表，并选择 Doris 数据库。

![选择 Doris 数据库](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-2.png)

### 第三步：填写 Doris 连接信息

选择 Doris 数据库后，填写 Doris 数据库的连接信息。

![填写 Doris 连接信息](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-3.png)

### 第四步：测试连接

如果连接信息填写无误且连接成功，页面会显示测试通过。

![测试连接通过](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-4.png)

### 第五步：配置数据分析报表

连接成功后，进入数据分析模块的电子服务看板，并根据需要自定义设置报表信息。

![配置数据分析报表](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-5.png)

## 完成结果

完成以上配置后，Smartbi 可以通过已创建的 Doris 数据连接访问 Doris 数据，并基于数据分析模块配置所需报表。
