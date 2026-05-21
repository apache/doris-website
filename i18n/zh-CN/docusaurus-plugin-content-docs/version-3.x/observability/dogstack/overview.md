---
{
    "title": "DOG Stack 开放可观测概述",
    "sidebar_label": "概述",
    "language": "zh-CN",
    "description": "DOG Stack 是基于 Apache Doris、OpenTelemetry 和 Grafana 构建的开放可观测性解决方案。本文介绍 DOG Stack 的核心特性、组件构成与整体架构。",
    "keywords": [
        "DOG Stack",
        "Apache Doris",
        "OpenTelemetry",
        "Grafana",
        "Elasticsearch",
        "ELK",
        "开源可观测性",
        "Doris App 插件",
        "日志",
        "Trace",
        "指标"
    ]
}
---

<!-- 知识类型: 能力定义 + 架构介绍 -->
<!-- 适用场景: 可观测性建设 / DOG Stack 方案选型 -->

**DOG Stack** 是基于 Doris、OpenTelemetry 和 Grafana（包含 Doris App插件）的开放可观测性解决方案。它的构建旨在：

- **开放**：所有组件均为开源，以避免供应商锁定。
- **高性能**：写入吞吐量可达数百GB/s。对于数十亿条记录，搜索和查询响应时间可在亚秒级。
- **成本效益高**：与 ELK 或 Datadog 相比，可降低超过 50% 甚至 80% 的可观测性成本。
- **可扩展性**：能够轻松处理PB甚至EB级的数据量。

OpenTelemetry 是可观测性数据采集的事实上的标准。Grafana 是可观测性数据可视化的事实上的标准。这就是 Doris 选择基于它们构建可观测性解决方案，而不是重新开发新的数据采集和可视化工具的原因。Doris 专注于高效的可观测性数据存储和快速查询。



## 特性

DOG Stack 基于 OpenTelemetry 和 Grafana 提供丰富的功能。

1. **各种可观测数据的采集**
   1. OpenTelemetry SDK 提供开箱即用的简单甚至无代码的应用程序检测功能，支持超过 10 种编程语言。
   2. OpenTelemetry 采集器对本地文件、主机指标、容器指标进行数据采集。
   3. 集成您现有的数据采集工具，如Vector、Fluentbit、Node Exporter、Telegraf、Logstash、Filebeat等。
2. **超越 Kibana 的搜索体验**
   1. 同时支持 Lucene 风格的搜索语法和原生 SQL 语法。
   2. 一键实现 Log 与 Trace 的关联。
   3. 以表格或 JSON 格式查看详细信息。
   4. 查看特定日志或 Trace 的时间前后数据。
   5. 时间范围选择、字段选择、字段过滤的交互式体验。
   6. 字段值分布统计。
3. **类似 Jaeger 的 Trace 体验**
   1. 按服务名称、操作、标签、持续时间范围过滤 Trace。
   2. 按时间线、持续时间、跨度计数可视化 Trace。
   3. 按时间戳、持续时间或跨度计数对 Trace 进行排序。
   4. 特定 Trace 的瀑布图可视化。
   5. 按服务名称、跨度名称、标签、特定 Trace 的持续时间范围筛选跨度。
4. **仪表盘**
   1. 超过 20 种可视化类型，如折线图、柱状图、饼图、仪表盘、热力图、直方图、地理地图等等。
   2. 通过可视化构建器或 SQL 原始代码来构建您的仪表板。
   3. 使用 Doris 多表连接，跨日志、追踪和指标构建您的仪表盘。
5. **告警**
   1. 适用于多种条件的告警规则，例如无数据/错误、阈值、复合阈值，涵盖多种指标，例如计数、总和、比率。
   2. 电子邮件、PagerDuty、Slack、Discord、Webhook 等 20 多种告警通知方式。
   3. 用于自定义、格式化和重复使用警报通知消息的告警模板。
6. **OpenTelemetry 和 Grafana 支持的更多功能。**

以下是一些快速浏览的截图，它们由安装了 Doris 应用插件的 Grafana 提供。

- 日志检索

![日志检索](/images/observability/dogstack/overview_logs.png)

- Trace 分析

![Trace 分析](/images/observability/dogstack/overview_traces.png)

- 指标仪表盘

![指标仪表盘](/images/observability/dogstack/overview_dashboard.png)



## 架构



![DOG Stack Architecture](/images/observability/dogstack/dogstack_architecture.png)



DOG Stack 由以下组件组成。

1. **数据采集工具**：它采集遥测数据，如日志、追踪和指标。OpenTelemetry 提供两种数据采集工具。一种是支持10多种语言的 OpenTelemetry SDK，用于检测应用程序和AI代理，通常采集追踪数据。另一种是 OpenTelemetry 采集器接收器，包括用于本地文件的 filelog 接收器、用于本地主机指标（如CPU、内存）的 hostmetrics 接收器、用于 k8s 环境中 Pod 指标的 podmetrics 接收器。许多第三方数据采集工具，如 Vector、Fluentbit、Node Exporter、Telegraf，可以通过 OTLP 和其他协议将数据发送到 OpenTelemetry 采集器。
2. **OpenTelemetry采集器（带 Doris Exporter）**：它从数据采集工具接收遥测数据，对其进行处理，并通过 Doris 导出器将其保存到 Doris 中。典型的处理包括过滤、转换、丰富、排队和批处理。
3. **Doris** : 它从 OpenTelemetry 采集器接收遥测数据，并将其高效地存储在带索引的列式存储中。Doris 通过各种索引（如倒排索引、布隆过滤器索引、区域映射索引）提供闪电般快速的搜索。Doris 在聚合、排序和连接等分析查询方面也具有出色的原生性能。
4. **Grafana（带 Doris App 插件）**：它为日志、追踪和指标提供丰富且易用的可视化功能。Grafana Doris App 插件在 Grafana 出色的基础功能之上添加了一些实用特性。“发现”功能提供一流的搜索体验，深受 Kibana 用户的赞赏。“追踪”功能提供原生的追踪探索能力，以查找值得关注的追踪信息，例如较慢的追踪，这对 Jeager 用户来说并不陌生。