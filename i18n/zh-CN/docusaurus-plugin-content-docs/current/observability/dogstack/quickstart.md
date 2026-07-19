---
{
    "title": "快速开始",
    "sidebar_label": "快速开始",
    "language": "zh-CN",
    "description": "如何快速体验 DOG Stack 可观测性方案？本文介绍通过 Docker Compose 一键部署，并演示 Doris App 插件启用、日志检索、Trace 分析、仪表盘与告警的完整上手流程。",
    "keywords": [
        "DOG Stack 快速开始",
        "Docker Compose",
        "Doris App 插件",
        "Grafana",
        "OpenTelemetry",
        "日志检索",
        "Trace 分析",
        "仪表盘",
        "告警"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 可观测性快速验证 / DOG Stack 上手体验 -->

体验 DOG Stack 最简单的方法是访问 [在线 Demo](https://observability-demo.velodb.io/)，无需任何部署。但如果你想部署自己的实例，使用 Docker Compose 也很容易上手。



## 部署

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe/demo
docker compose up -d
```

它将启动一个完整的 DOG Stack，并附带一个由 10多个微服务组成的电商业务演示应用程序。

打开你的网络浏览器，访问 http://localhost:33000/grafana/plugins ，搜索 'doris'。然后点击 'Doris App' 板块。

![Doris App 插件](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_plugin.png)

然后点击 'Enable' 按钮来启用Doris应用程序。

![启用 Doris App](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_enable.png)

启用 Doris 应用后，您可以在左侧菜单的“更多应用”下找到它。点击“Doris 应用”，开始探索。

![Doris App 入口](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_apps.png)



## 搜索

在 Doris 应用中，你可以选择数据源为 'Doris'，数据库为 'otel'，表为 'otel_logs'，这样就能获取到一些数据。对于 Kibana 用户来说，UI 可能非常熟悉且易于使用。

![日志数据源](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_logs.png)

您可以尝试在搜索框中输入 'body:error'，以搜索正文字段中包含 'error' 的日志。

![搜索 body:error](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_search.png)



## Traces

点击'Doris App'菜单下的 'Traces' 来探索和分析 Trace。

您需要选择 Doris 作为数据源，otel 作为数据库，otel_traces 作为表。然后点击“查找 Trace ”按钮获取最近的 50 条 Trace 记录，这些记录会在顶部以图表形式呈现，下方则以列表形式展示。您可以在左侧区域尝试为服务、操作、标签、持续时间过滤器设置不同的值。您还可以在 Trace 图表下方尝试不同的排序选项。

![Trace 列表](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_traces.png)

您可以点击某一特定 Trace 来查看其瀑布流可视化效果。您可以在瀑布流可视化界面中使用“跨度过滤器”进一步筛选该 Trace 中的跨度。

![Trace 瀑布图](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_waterfall.png)

## 仪表盘

点击左侧菜单中的 'Dashboards'  ，然后点击 'Doris Demo'。接着点击 'Collector Self-Monitoring'，您将看到下方的演示仪表盘。它展示了OpenTelemetry 采集器自身的主机指标。

![Demo 仪表盘](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_dashboard.png)



## 告警

您可以基于对 Doris 的 SQL 查询创建告警规则。您需要指定告警条件参数，如“Reduce”函数和“Threshold”。

![告警规则](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_alert.png)

