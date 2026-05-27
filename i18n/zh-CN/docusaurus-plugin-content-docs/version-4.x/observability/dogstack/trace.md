---
{
    "title": "Trace 分布式追踪分析",
    "sidebar_label": "Traces",
    "language": "zh-CN",
    "description": "如何在 Doris App 中分析分布式 Trace？本文介绍 Trace 散点图、瀑布图、Span Filter 与按服务、操作、标签、耗时的多维筛选实践，帮助定位慢请求与异常调用。",
    "keywords": [
        "Trace 分析",
        "分布式追踪",
        "Span Filter",
        "瀑布图",
        "Doris App",
        "Grafana",
        "OpenTelemetry",
        "慢请求分析"
    ]
}
---

<!-- 知识类型: 能力定义 + 操作步骤 -->
<!-- 适用场景: 可观测性建设 / 分布式链路追踪分析 -->

Trace 是可观测性三大支柱数据之一，用于跟踪一个请求的完整运行过程，由各个服务的运行区间 Span 和相互调用关系组成。Trace 对分布式系统的请求性能和异常分析至关重要。

你可以在 Traces 页面中进行 Trace 分析，找到需要分析的 Trace（比如运行时间长的），并对某个 Trace 可视化展示、进一步分析里面的 Span。

如下图所示，Trace 页面由 4部分组成

1. 数据选择区（顶部）：你可以选择要查询的 Trace 数据源（Datasource, Database, Table）、时间字段和时间段。
2. 过滤选择区（左侧）：你可以根据 Service, Operation, Tags, Duration 筛选需要分析的 Traces。
3. Trace 分布区（右上）：以散点图方式展示符合条件的 Traces，X 轴是 Trace 开始时间，Y 轴 Trace 运行时长，气泡大小是 Trace 中 Span 的个数。你可以借助散点图快速发现运行时间长、Span 个数多的“大” Trace，点击某个气泡可以查看这个 Trace 的详情，以瀑布图的方式展示。
4. Trace 列表区（右下）：展示符合条件的 Traces 列表，展示的信息包括 service, operation, trace_id, trace duration, span 个数等。列表的默认排序方式 "Most Recent" 是按照 Trace 开始时间倒序，展示最新的 Traces，你也可以调整排序方式展示最长/短的Traces、最多/少 Span 的 Traces。

![Trace 页面概览](https://cdnd.selectdb.com/images/upload/dogstack/trace_page.gif)

点击某个 Trace 将弹出一个 Trace Panel 展示丰富的详细信息，你可以在 Trace Panel 中进一步分析这个 Trace 中的 Span。

1. 查看 Trace 的调用链 minimap 和瀑布图，包括每个 Span 的执行时间段和相互调用关系。
2. 点击某个 Span 查看它开始时间、持续时间、上下文信息 Span Attributes 和 Resource Attributes。
3. 点击 Span Filter 对 Span 进行筛选，包括 Service Name, Span Name, Duration, Tags 等。

![Trace Panel 详情](https://cdnd.selectdb.com/images/upload/dogstack/trace_panel.gif)



## 常用筛选示例

### 按服务筛选

```
Service = frontend-web
```

快速查看指定服务产生的 Trace。

![按服务筛选](https://cdnd.selectdb.com/images/upload/dogstack/trace_service.png)

### 按操作筛选

```
Operation = HTTP POST
```

用于定位特定接口或请求类型。

![按操作筛选](https://cdnd.selectdb.com/images/upload/dogstack/trace_operation.png)

### 按标签筛选

```
upstream_cluster.name="flagservice"
```

使用 **logfmt key=value** 语法筛选 Span 属性。

![按标签筛选](https://cdnd.selectdb.com/images/upload/dogstack/trace_tags.png)

### 按耗时筛选

`Min Duration = 100ms ``Max Duration = 1.2s`

快速锁定慢请求。

![按耗时筛选](https://cdnd.selectdb.com/images/upload/dogstack/trace_duration.png)



## 排序与分页

Trace 列表支持多种排序方式：

- 最近
- 最长 / 最短耗时
- 最多 / 最少 Spans

支持分页浏览结果并切换页码。

![排序与分页](https://cdnd.selectdb.com/images/upload/dogstack/trace_sort.png)