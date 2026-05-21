---
{
    "title": "Dashboard 仪表盘",
    "sidebar_label": "Dashboard",
    "language": "zh-CN",
    "description": "如何在 Grafana 中基于 Apache Doris 构建可观测性 Dashboard？本文介绍预置 Dashboard 导入、OTel 数据模型、Counter 速率计算、模板变量与自定义面板的完整实践。",
    "keywords": [
        "Grafana Dashboard",
        "Doris Dashboard",
        "OpenTelemetry",
        "MySQL 数据源",
        "模板变量",
        "Counter rate",
        "Time Series",
        "Stat 面板",
        "Table 面板"
    ]
}
---

<!-- 知识类型: 能力定义 + 操作步骤 -->
<!-- 适用场景: 可观测性建设 / 仪表盘构建与定制 -->

## **概述**

本文档介绍如何在 Grafana 中使用 DOG Stack 的可观测数据。

DOG Stack 使用 Doris 作为统一的存储后端。Doris 兼容 MySQL 协议，在 Grafana 中通过 MySQL 数据源即可查询所有 Logs、Traces 和 Metrics 数据。数据链路如下：

```Plain
应用 / 基础设施  →  OpenTelemetry Collector  →  Doris Exporter  →  Doris  →  Grafana (MySQL DataSource)
```

本文档包含以下内容：

- 导入预置 Dashboard ：使用我们提供的现成 Dashboard。
- 理解数据模型：了解 Doris 中 OTel 数据的存储方式。
- 创建自定义 Dashboard：从零开始构建面板、编写查询、配置变量。
- 参考：表结构和语法速查。



## **准备工作**

在开始之前，确保满足以下条件：

- 已部署 DOG Stack，Grafana 和 Doris 均正常运行。
- 已在 Grafana 中配置 MySQL 类型的数据源，连接到 Doris（DOG Stack 启动的 Grafana 已经预配置了 Doris 数据源）。

如果尚未配置数据源，按以下步骤操作：

1. 在 Grafana 左侧菜单中，点击 **Connections** > **Data sources** > **Add data source**。
2. 选择 **MySQL**。

1. 填写以下连接信息：

   \- **Host**：`<Doris-fe-host>:9030`

   \- **Database**：`otel`

   \- **User**：`root`（或你配置的用户）

   \- **Password**：留空（如未设置密码）

1. 点击 **Save & test**，确认连接成功。

![配置 MySQL 数据源](/images/observability/dogstack/dashboard_datasource.png)



## **导入预置 Dashboard**

我们提供了 4 个 [预置 Dashboard](https://github.com/velodb/ai-observe-stack/tree/master/grafana-dashboard)，覆盖常见的可观测场景：

| Dashboard          | 文件名                              | 监控内容                                       |
| ------------------ | ----------------------------------- | ---------------------------------------------- |
| Host Metrics       | `host_metrics_dashboard.json`       | CPU、内存、磁盘、网络、系统负载                |
| JVM Monitoring     | `jvm_metrics_dashboard.json`        | 堆内存、GC、线程、CPU 利用率                   |
| K8s Observability  | `k8s_kubelet_dashboard.json`        | Pod / Node / Namespace 资源使用                |
| Nginx Logs         | `nginx_logs_dashboard.json`         | 请求量、状态码、Top URL、错误日志              |
| PostgreSQL Metrics | `postgresql-metrics-dashboard.json` | 连接数、事务、数据库大小、Checkpoint、BGWriter |

要导入预置 Dashboard：

1. 在 Grafana 左侧菜单中，点击 **Dashboards** > **New** > **Import**。
2. 点击 **Upload dashboard JSON file**，选择 `grafana-dashboard/` 目录下的 JSON 文件。

1. 在导入页面中，将数据源选择为你配置的 Doris（MySQL 类型）。
2. 点击 **Import**。

1. 对其余 JSON 文件重复以上步骤。

导入完成后，Dashboard 顶部的变量选择器（如 Service、Namespace 等）会自动从 Doris 查询可选值。

### 各 Dashboard 面板详情

**Host Metrics Dashboard**

- Overview：CPU 使用率、内存使用率、1 分钟负载、根磁盘使用率
- CPU：使用率趋势、按 Mode 分类的使用率
- Memory：内存详情（Total / Available / Free / Cached / Buffers）、使用率趋势
- System Load：1 / 5 / 15 分钟负载、打开的文件描述符数
- Disk：磁盘空间使用表格、读写吞吐量
- Network：收发流量、错误与丢包

![Host Metrics Dashboard](/images/observability/dogstack/dashboard_host.png)

**JVM Monitoring Dashboard**

- Overview：堆使用率、Full GC 次数、CPU 使用率、线程数
- Memory：堆 / 非堆内存趋势、Old Gen / Eden / Survivor 各池详情
- GC：耗时（Young / Old 分类）、次数
- Thread & CPU：线程数趋势、CPU 利用率

![JVM Monitoring Dashboard](/images/observability/dogstack/dashboard_jvm.png)

**K8s Observability Dashboard**

- Pods：CPU（毫核）、内存、Limit 利用率、状态表格（含 Restart 次数、运行时长）
- Nodes：CPU / 内存趋势、状态表格
- Namespaces：CPU / 内存汇总、状态表格

![K8s Observability Dashboard](/images/observability/dogstack/dashboard_k8s.png)

**Nginx Logs Dashboard**

- Overview：请求数、错误数、5xx / 4xx 统计、状态码饼图
- Trends：请求量 / 错误日志趋势
- Analysis：Top URL、Top IP、HTTP 方法分布、Top 错误信息
- Recent Logs：Access / Error 日志明细

![Nginx Logs Dashboard](/images/observability/dogstack/dashboard_nginx.png)

**PostgreSQL Metrics Dashboard**

- Connections：活跃连接数（按数据库拆分）、最大连接数
- Transactions：事务提交速率、回滚次数
- Storage：数据库大小（按数据库拆分）、数据库数量、表数量
- BGWriter：Checkpoint 次数（scheduled / requested）、Buffer 写入次数、BGWriter 耗时

![PostgreSQL Metrics Dashboard](/images/observability/dogstack/dashboard_postgresql.png)



## **理解数据模型**

创建自定义 Dashboard 之前，你需要了解 Doris 中 OTel 数据的存储方式。

### **数据表**

与 Prometheus 不同，在 Doris 中你不能只通过 metric name 来查询，你还需要知道查哪张表。OTel 数据按信号类型和指标类型存储在不同的表中：

| 表名                     | 存储内容   | 值字段                          | 查询方式                  |
| ------------------------ | ---------- | ------------------------------- | ------------------------- |
| `otel_metrics_gauge`     | 瞬时值指标 | `value`                         | 直接聚合，如 `AVG(value)` |
| `otel_metrics_sum`       | 累计计数器 | `value`（单调递增）             | 用 `LAG()` 计算速率       |
| `otel_metrics_histogram` | 直方图     | `count`、`sum`、`bucket_counts` | 用 `LAG()` 计算增量       |
| `otel_logs`              | 日志       | `body`、`severity_text`         | `COUNT` 聚合或明细查询    |
| `otel_traces`            | 链路追踪   | `duration`、`span_name`         | 按耗时排序或聚合          |

要确定一个指标存在哪张表中，运行以下查询：

```SQL
SELECT 'gauge' AS type, metric_name FROM otel.otel_metrics_gauge WHERE metric_name = '你的指标名' LIMIT 1
UNION ALL
SELECT 'sum', metric_name FROM otel.otel_metrics_sum WHERE metric_name = '你的指标名' LIMIT 1
UNION ALL
SELECT 'histogram', metric_name FROM otel.otel_metrics_histogram WHERE metric_name = '你的指标名' LIMIT 1;
```

要浏览所有可用指标，对每张表运行以下查询：

```SQL
SELECT DISTINCT metric_name FROM otel.otel_metrics_gauge ORDER BY metric_name;
```

### **属性字段**

在 Prometheus 中，label 统一用 `{key="value"}` 访问。在 Doris 中，属性分散在多个 variant（JSON）类型字段中，使用中括号语法访问：

| 表         | 字段名                | 存储内容                          | 示例                                  |
| ---------- | --------------------- | --------------------------------- | ------------------------------------- |
| metrics 表 | `attributes`          | 指标维度（对应 Prometheus label） | `attributes['mode']`                  |
| metrics 表 | `resource_attributes` | 资源信息（K8s pod/node 等）       | `resource_attributes['k8s.pod.name']` |
| logs 表    | `log_attributes`      | 日志字段                          | `log_attributes['status']`            |
| traces 表  | `span_attributes`     | Span 字段                         | `span_attributes['http.method']`      |

Note: `service_name` 和 `service_instance_id` 是顶层列，不在 attributes 内。直接使用 `WHERE service_name = '...'`。

在 SELECT、GROUP BY、PARTITION BY 或使用 LIKE 操作时，需要用 `CAST` 做类型转换：

```SQL
-- 在 SELECT 中取值
CAST(attributes['device'] AS VARCHAR) AS device

-- 在 WHERE 中做模式匹配
CAST(attributes['device'] AS VARCHAR) NOT LIKE 'veth%'

-- 在 WHERE 中做数值比较
CAST(log_attributes['status'] AS INT) >= 500

-- 在 GROUP BY 中使用
GROUP BY CAST(resource_attributes['k8s.pod.name'] AS VARCHAR)
```

在 WHERE 中做简单等值比较时，通常不需要 CAST：

```SQL
WHERE attributes['mode'] = 'idle'
```

Caution: 使用错误的属性字段名（例如在 metrics 表上用 `log_attributes`）不会报错，只会返回 NULL，导致查询结果为空。

### **Counter 指标与速率计算**

Gauge 指标的 `value` 直接代表当前值，可以直接使用 `AVG` 或 `MAX` 聚合。

Counter/Sum 指标的 `value` 是单调递增的累计值（如 CPU 总秒数、网络总字节数）。要获取速率，需要计算相邻数据点的差值。Prometheus 的 `rate()` 在 Doris 中用 `LAG()` 窗口函数实现。

以下是通用的 rate 计算模板：

```SQL
SELECT
  t.timestamp AS time,
  t.<维度字段> AS metric,
  CASE
    WHEN UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)
         AND t.value >= t.prev_value
    THEN (t.value - t.prev_value) / (UNIX_TIMESTAMP(t.timestamp) - UNIX_TIMESTAMP(t.prev_ts))
    ELSE NULL
  END AS value
FROM (
  SELECT timestamp, value, <维度字段>,
    LAG(value) OVER (PARTITION BY <维度字段> ORDER BY timestamp) AS prev_value,
    LAG(timestamp) OVER (PARTITION BY <维度字段> ORDER BY timestamp) AS prev_ts
  FROM otel.otel_metrics_sum
  WHERE metric_name = '<指标名>'
    AND $__timeFilter(timestamp)
) t
WHERE t.prev_ts IS NOT NULL
ORDER BY time
```

使用这个模板时，替换以下占位符：

- `<维度字段>`：用于拆分时间线的字段，如 `CAST(attributes['device'] AS VARCHAR)`。
- `<指标名>`：metric name，如 `node_network_receive_bytes_total`。

模板中包含三层安全保护：

| 条件                                                      | 作用                                    |
| --------------------------------------------------------- | --------------------------------------- |
| `WHERE t.prev_ts IS NOT NULL`                             | 过滤每个分区的第一行（`LAG` 返回 NULL） |
| `UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)` | 防止时间戳重复导致除零                  |
| `t.value >= t.prev_value`                                 | 防止 Counter 重置产生负数               |

`PARTITION BY` 的选择直接决定 rate 计算是否正确。选错会导致不同维度的数据交叉计算。以下是预置 Dashboard 中的用法：

| 场景                   | PARTITION BY                                              |
| ---------------------- | --------------------------------------------------------- |
| CPU 使用率（多核汇总） | `service_instance_id, CAST(attributes['cpu'] AS VARCHAR)` |
| 磁盘 I/O               | `CAST(attributes['device'] AS VARCHAR)`                   |
| 网络流量               | `CAST(attributes['device'] AS VARCHAR)`                   |
| GC 耗时                | `CAST(attributes['jvm.gc.name'] AS VARCHAR)`              |



## **创建自定义 Dashboard**

本节通过实际操作，演示从零创建一个包含多种面板和变量的 Dashboard。

### **创建 Dashboard 和 Time Series 面板**

本节创建一个 Time Series 面板，展示 K8s Pod 的 CPU 使用趋势。这个示例使用 Gauge 类型指标，构建过程展示了编写 SQL 的完整思路。

1. 在 Grafana 左侧菜单中，点击 **Dashboards** > **New** > **New dashboard**。
2. 点击 **Add visualization**。

1. 在数据源下拉框中，选择你配置的 MySQL（Doris）数据源。
2. 在查询编辑区右上角，点击切换到 **Code** 模式。

接下来编写 SQL 查询。以下逐步构建完整的查询语句。

**编写基础查询。** 目标是监控 Pod CPU，对应的指标名是 `k8s.pod.cpu.usage`。这是一个 Gauge 类型指标，存在 `otel_metrics_gauge` 表中，`value` 可以直接聚合：

```SQL
SELECT timestamp, value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
```

**添加时间过滤。** Grafana 的 MySQL 数据源提供了两种时间过滤方式：

```SQL
-- 方式 A：使用 $__timeFilter 宏（推荐）
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND $__timeFilter(timestamp)

-- 方式 B：使用 $__from 和 $__to（在子查询或 JOIN 中更灵活）
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
```

Note: `$__from` 和 `$__to` 是毫秒级时间戳，必须除以 1000 才能用于 `FROM_UNIXTIME()`。

**添加时间分桶。** 原始数据点密度较高，需要按固定间隔聚合。使用 `FLOOR(UNIX_TIMESTAMP(timestamp) / N) * N` 将时间按 N 秒取整：

```SQL
SELECT
  FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time,
  AVG(value) AS value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
GROUP BY time
ORDER BY time
```

**按维度拆分为多条线。** Grafana 的 MySQL 数据源在 Time Series 格式下，要求返回以下三列：

| 列名                 | 作用                                            |
| -------------------- | ----------------------------------------------- |
| `time` 或 `time_sec` | X 轴时间。`datetime` 类型或 UNIX 时间戳（秒）。 |
| `metric`             | 线条名称。Grafana 按此列的不同值拆分为多条线。  |
| `value`              | Y 轴数值。                                      |

添加 Pod 名称作为 `metric` 列，得到完整查询：

```SQL
SELECT
  FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time,
  CAST(resource_attributes['k8s.pod.name'] AS VARCHAR) AS metric,
  AVG(value) AS value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.cpu.usage'
  AND timestamp >= FROM_UNIXTIME($__from/1000)
  AND timestamp < FROM_UNIXTIME($__to/1000)
GROUP BY time, metric
ORDER BY time
```

要监控其他 Gauge 指标，修改以下部分：

- `metric_name`：改为目标指标名。
- `metric` 列：改为用于区分时间线的维度字段，从 `attributes` 或 `resource_attributes` 中选择。

1. 将完整的 SQL 粘贴到查询编辑区。
2. 在查询编辑区下方，将 **Format** 设为 **Time series**。

1. 点击面板标题区域，输入面板名称。
2. 在右侧面板设置中，找到 **Standard options** > **Unit**，选择合适的单位。
3. 点击右上角 **Apply**。

### **添加 Counter 指标面板**

本节创建一个 Time Series 面板，展示 Counter 类型指标的速率。Counter 的 `value` 是单调递增的累计值，需要使用[通用 rate 模板](#counter-指标与速率计算)计算速率。

1. 在 Dashboard 中，点击 **Add** > **Visualization**。
2. 选择数据源，切换到 **Code** 模式。

将 rate 模板的占位符替换为实际值。以下示例计算网络接收字节的速率，按网卡设备拆分：

```SQL
SELECT
  t.timestamp AS time,
  t.device AS metric,
  CASE
    WHEN UNIX_TIMESTAMP(t.timestamp) > UNIX_TIMESTAMP(t.prev_ts)
         AND t.value >= t.prev_value
    THEN (t.value - t.prev_value) / (UNIX_TIMESTAMP(t.timestamp) - UNIX_TIMESTAMP(t.prev_ts))
    ELSE NULL
  END AS value
FROM (
  SELECT timestamp, CAST(attributes['device'] AS VARCHAR) AS device, value,
    LAG(value) OVER (PARTITION BY CAST(attributes['device'] AS VARCHAR) ORDER BY timestamp) AS prev_value,
    LAG(timestamp) OVER (PARTITION BY CAST(attributes['device'] AS VARCHAR) ORDER BY timestamp) AS prev_ts
  FROM otel.otel_metrics_sum
  WHERE metric_name = 'node_network_receive_bytes_total'
    AND $__timeFilter(timestamp)
) t
WHERE t.prev_ts IS NOT NULL
ORDER BY time
```

要替换为其他 Counter 指标，修改以下两处：

- `metric_name`：改为目标指标名。
- `PARTITION BY` 和 `SELECT` 中的维度字段：改为该指标的拆分维度（如 `attributes['cpu']`、`attributes['gc_name']` 等）。
- 粘贴 SQL，将 **Format** 设为 **Time series**。
- 在 **Standard options** > **Unit** 中，选择合适的单位。
- 点击 **Apply**。

### **添加 Stat 面板**

Stat 面板用于展示单个数值，如当前使用率或最新计数。SQL 返回一个数值即可。

1. 点击 **Add** > **Visualization**，切换到 **Code** 模式。

以下查询获取时间范围内最新的一条指标值：

```SQL
SELECT value
FROM otel.otel_metrics_gauge
WHERE metric_name = 'node_memory_MemAvailable_bytes'
  AND $__timeFilter(timestamp)
ORDER BY timestamp DESC
LIMIT 1
```

如果需要对多个指标做运算（如计算比率），参考[优化面板](#优化面板)中的「在单条 SQL 中查询多个指标」。

2. 粘贴 SQL，将 **Format** 设为 **Table**（Stat 面板使用 Table 格式）。
3. 在右侧面板设置中，将面板类型切换为 **Stat**。
4. 在 **Standard options** > **Unit** 中，选择合适的单位。
5. 点击 **Apply**。

### **添加 Table 面板**

Table 面板适合展示多行多列数据，SQL 中的每个列别名作为表头。

1. 点击 **Add** > **Visualization**，切换到 **Code** 模式。

以下查询展示最近的日志明细：

```SQL
SELECT
  timestamp,
  service_name,
  severity_text,
  body,
  CAST(log_attributes['your_key'] AS VARCHAR) AS your_key
FROM otel.otel_logs
WHERE $__timeFilter(timestamp)
ORDER BY timestamp DESC
LIMIT 100
```

将 `your_key` 替换为实际的日志属性字段名。要查看可用的属性字段，运行以下查询：

```SQL
SELECT log_attributes FROM otel.otel_logs LIMIT 1;
```

2. 粘贴 SQL，将 **Format** 设为 **Table**。
3. 点击 **Apply**。

### **添加模板变量**

模板变量为 Dashboard 添加交互式下拉筛选器，使用户无需修改 SQL 即可过滤数据。

**创建单选变量：**

1. 点击 Dashboard 右上角齿轮图标，进入 **Settings** > **Variables** > **New variable**。

1. 按以下配置填写：

   \- **Name**：`service_name`

   \- **Type**：**Query**

   \- **Data source**：选择你的 Doris 数据源

   \- **Query**：

​     `sql      SELECT DISTINCT service_name      FROM otel.otel_metrics_gauge      WHERE service_name != '' AND service_name IS NOT NULL        AND $__timeFilter(timestamp)      ORDER BY service_name      `

1. 点击 **Apply**。

在面板 SQL 中使用 `$variable` 语法引用单选变量：

```SQL
AND service_name = '$service_name'
```

**创建多选变量：**

1. 新建变量，按以下配置填写：

   \- **Name**：`namespace`

   \- **Type**：**Query**

   \- **Multi-value**：勾选

   \- **Include All option**：勾选

   \- **Query**：

​     `sql      SELECT DISTINCT CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) AS __text      FROM otel.otel_metrics_gauge      WHERE metric_name = 'k8s.pod.phase'        AND timestamp >= NOW() - INTERVAL 1 HOUR      ORDER BY 1      `

1. 点击 **Apply**。

Note: 列别名 `__text` 是 Grafana 约定，用于控制下拉框中的显示文本。

在面板 SQL 中使用 `${variable:sqlstring}` 语法配合 `IN()` 引用多选变量：

```SQL
AND CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) IN (${namespace:sqlstring})
```

Caution: 多选变量如果不使用 `:sqlstring`，生成的 SQL 会有语法错误。

**创建级联变量：**

变量的可选值可以依赖其他变量。例如，以下 Pod 变量根据已选的 Namespace 过滤可选值：

```SQL
SELECT DISTINCT CAST(resource_attributes['k8s.pod.name'] AS VARCHAR) AS __text
FROM otel.otel_metrics_gauge
WHERE metric_name = 'k8s.pod.phase'
  AND timestamp >= NOW() - INTERVAL 1 HOUR
  AND CAST(resource_attributes['k8s.namespace.name'] AS VARCHAR) IN (${namespace:sqlstring})
ORDER BY 1
```

### **优化面板**

以下是预置 Dashboard 中使用的常见优化技巧。

**调整时间分桶间隔。** 根据时间范围选择合适的分桶大小。修改 `FLOOR(UNIX_TIMESTAMP(timestamp) / N) * N` 中的 N 值：

- 20 秒：适合短时间实时监控。
- 60 秒：适合小时级概览。
- 300 秒：适合天级趋势。

**设置有意义的线条名称。** 使用 `CONCAT()` 组合多个字段：

```SQL
CONCAT(device, ' read') AS metric
```

使用 `CASE WHEN` 将数值映射为可读文本：

```SQL
CASE WHEN value = 2 THEN 'Running'
     WHEN value = 1 THEN 'Pending'
     WHEN value = 3 THEN 'Succeeded'
     WHEN value = 4 THEN 'Failed'
     ELSE 'Unknown'
END AS status
```

**处理除零和空值。** 使用 `NULLIF` 防止除零，使用 `COALESCE` 提供默认值：

```SQL
/ NULLIF(SUM(...), 0)
COALESCE(restarts, 0)
```

**在单条 SQL 中查询多个指标。** 用 `CASE WHEN metric_name` 替代 JOIN：

```SQL
SELECT timestamp AS time,
  SUM(CASE WHEN metric_name = 'node_memory_MemAvailable_bytes' THEN value END) AS available,
  SUM(CASE WHEN metric_name = 'node_memory_MemTotal_bytes' THEN value END) AS total
FROM otel.otel_metrics_gauge
WHERE metric_name IN ('node_memory_MemTotal_bytes', 'node_memory_MemAvailable_bytes')
GROUP BY timestamp
```

**过滤噪声数据。** 排除虚拟网卡：

```SQL
AND CAST(attributes['device'] AS VARCHAR) NOT LIKE 'veth%'
AND CAST(attributes['device'] AS VARCHAR) NOT LIKE 'br-%'
AND CAST(attributes['device'] AS VARCHAR) != 'lo'
```

只保留真实文件系统：

```SQL
AND CAST(attributes['fstype'] AS VARCHAR) IN ('ext4', 'xfs', 'btrfs')
```



## **参考**

### **OTel 数据表结构**

**Metrics 表（gauge / sum / histogram 共有字段）**

| 字段                  | 类型           | 说明         |
| --------------------- | -------------- | ------------ |
| `service_name`        | varchar(200)   | 服务名称     |
| `timestamp`           | datetime(6)    | 数据时间戳   |
| `service_instance_id` | varchar(200)   | 服务实例标识 |
| `metric_name`         | varchar(200)   | 指标名称     |
| `metric_description`  | text           | 指标描述     |
| `metric_unit`         | text           | 指标单位     |
| `attributes`          | variant (JSON) | 指标维度属性 |
| `resource_attributes` | variant (JSON) | 资源属性     |
| `scope_name`          | text           | 采集器名称   |

gauge 独有字段：`value` (double)

sum 额外字段：`value` (double)、`aggregation_temporality` (text)、`is_monotonic` (boolean)

histogram 额外字段：`count` (bigint)、`sum` (double)、`bucket_counts` (array\<bigint\>)、`explicit_bounds` (array\<double\>)、`min` (double)、`max` (double)

**Logs 表**

| 字段                  | 类型           | 说明                            |
| --------------------- | -------------- | ------------------------------- |
| `timestamp`           | datetime(6)    | 日志时间戳                      |
| `service_name`        | varchar(200)   | 服务名称                        |
| `service_instance_id` | varchar(200)   | 服务实例标识                    |
| `trace_id`            | varchar(200)   | 关联 Trace ID                   |
| `span_id`             | text           | 关联 Span ID                    |
| `severity_number`     | int            | 日志级别编号                    |
| `severity_text`       | text           | 日志级别（INFO / WARN / ERROR） |
| `body`                | text           | 日志正文                        |
| `resource_attributes` | variant (JSON) | 资源属性                        |
| `log_attributes`      | variant (JSON) | 日志属性                        |

**Traces 表**

| 字段                  | 类型           | 说明                                    |
| --------------------- | -------------- | --------------------------------------- |
| `timestamp`           | datetime(6)    | Span 开始时间                           |
| `service_name`        | varchar(200)   | 服务名称                                |
| `trace_id`            | varchar(200)   | Trace ID                                |
| `span_id`             | text           | Span ID                                 |
| `parent_span_id`      | text           | 父 Span ID                              |
| `span_name`           | text           | Span 名称                               |
| `span_kind`           | text           | Span 类型（CLIENT / SERVER / INTERNAL） |
| `end_time`            | datetime(6)    | Span 结束时间                           |
| `duration`            | bigint         | 耗时（纳秒）                            |
| `span_attributes`     | variant (JSON) | Span 属性                               |
| `events`              | array          | Span 事件                               |
| `links`               | array          | Span 关联                               |
| `status_code`         | text           | 状态码（OK / ERROR / UNSET）            |
| `status_message`      | text           | 状态消息                                |
| `resource_attributes` | variant (JSON) | 资源属性                                |



### **语法速查**

| 用途               | 写法                                                         |
| ------------------ | ------------------------------------------------------------ |
| 时间过滤（宏）     | `$__timeFilter(timestamp)`                                   |
| 时间过滤（手动）   | `timestamp >= FROM_UNIXTIME($__from/1000)`                   |
| 时间分桶（20 秒）  | `FLOOR(UNIX_TIMESTAMP(timestamp) / 20) * 20 AS time`         |
| 时间分桶（1 分钟） | `UNIX_TIMESTAMP(DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:00')) * 1000 AS time` |
| 属性访问           | `attributes['key']`                                          |
| 属性 CAST          | `CAST(attributes['key'] AS VARCHAR)`                         |
| 单选变量           | `service_name = '$service_name'`                             |
| 多选变量           | `IN (${namespace:sqlstring})`                                |
| 防除零             | `/ NULLIF(..., 0)`                                           |
| 默认值             | `COALESCE(..., 0)`                                           |
| 线条命名           | `CONCAT(device, ' read') AS metric`                          |
| 状态映射           | `CASE WHEN value = 2 THEN 'Running' ... END`                 |
| URL 去参数         | `SUBSTRING_INDEX(url, '?', 1)`                               |
| 过滤虚拟网卡       | `NOT LIKE 'veth%'` + `NOT LIKE 'br-%'` + `!= 'lo'`           |