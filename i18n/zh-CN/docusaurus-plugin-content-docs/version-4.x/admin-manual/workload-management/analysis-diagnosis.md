---
{
    "title": "工作负载分析与诊断：运行时监控与历史审计",
    "sidebar_label": "工作负载分析",
    "language": "zh-CN",
    "description": "介绍如何通过实时监控和历史审计日志定位集群瓶颈、排查异常 SQL，并快速恢复集群可用性。",
    "keywords": ["工作负载管理", "workload group", "集群诊断", "异常SQL", "审计日志", "资源瓶颈", "CPU内存IO", "查询杀死", "backend_active_tasks", "active_queries"]
}
---

<!-- 适用场景: 故障排查 / 性能调优 -->

集群工作负载分析分为两个阶段：**运行时分析**（集群可用性下降时快速止损）和**历史数据分析**（事后从审计日志中找出不合理的工作负载）。

## 适用场景

| 场景 | 触发时机 | 主要手段 |
|------|----------|----------|
| 运行时分析 | 监控发现 CPU / 内存 / IO 异常升高 | `workload_group_resource_usage`、`backend_active_tasks`、KILL 语句 |
| 历史数据分析 | 事后复盘或定期巡检 | 审计日志表、百分位函数、SQL 优化 |

## 运行时工作负载分析

<!-- 知识类型: 操作步骤 -->

当监控发现集群可用性下降时，按以下流程处理。

### 第一步：确定资源瓶颈类型

通过监控判断当前的主要瓶颈是内存、CPU 还是 IO。若三者都偏高，优先解决内存问题。

### 第二步：找出资源用量最高的 Workload Group

通过 `workload_group_resource_usage` 表，按对应资源指标降序排列，找出用量最高的 N 个 Group。详见[常用诊断 SQL](#常用诊断-sql)。

### 第三步：限制高用量 Group 的查询并发

集群资源已紧张时，调低该 Group 的最大查询并发，避免持续有新查询耗尽资源。

### 第四步：对高用量 Group 执行降级

<!-- 知识类型: 配置参数 -->

根据瓶颈类型选择对应的降级手段：

| 瓶颈类型 | 降级手段 | 说明 |
|----------|----------|------|
| CPU | 将 CPU 改为硬限，设置较低的 `cpu_hard_limit` | 主动让出 CPU，避免影响其他 Group |
| IO | 设置 `read_bytes_per_second` | 限制该 Group 的最大磁盘读取速率 |
| 内存 | 将内存改为硬限，调低 `memory_limit` | 释放部分内存，但可能导致该 Group 大量查询失败 |

### 第五步：进一步分析根因

完成降级后，集群可用性通常会有所恢复。此时分析资源升高的根本原因：是整体查询并发升高，还是某些大查询导致的。若是大查询，通过 KILL 语句快速杀死，加速故障恢复。

### 第六步：定位并杀死异常 SQL

结合 `backend_active_tasks` 和 `active_queries` 找出资源用量异常的 SQL，通过 KILL 语句释放资源。详见[常用诊断 SQL](#常用诊断-sql)。

## 历史数据分析

<!-- 知识类型: 操作步骤 -->

Doris 的审计日志表记录了 SQL 执行时的简要信息，可用于事后找出不合理的查询。

### 第一步：通过监控确认历史资源瓶颈

查看历史监控，确认集群的瓶颈类型（CPU、内存或 IO），缩小排查时间范围。

### 第二步：从审计日志定位异常 SQL

异常 SQL 有两种定义方式：

- **基于业务预期**：若大部分查询延迟为秒级、扫描行数在千万级，则扫描行数达亿级或十亿级的 SQL 即为异常，需人工介入处理。

- **基于百分位基线**：若业务方对资源用量没有预期，可通过百分位函数建立基线。以 CPU 瓶颈为例：先计算历史时间段内查询 CPU 时间的 tp50/tp75/tp99/tp999 作为正常基线，再与当前相同时段的百分位值对比。例如历史 tp999 为 1 分钟，但当前 tp50 已达 1 分钟，说明当前时段出现了大量 CPU 时间超过 1 分钟的 SQL，这些 SQL 即可定义为异常 SQL。其他资源指标的判定方式相同。

### 第三步：优化异常 SQL

对资源用量异常的 SQL 进行优化，常见手段包括 SQL 改写、表结构优化、并行度调节，以降低单 SQL 的资源用量。

### 第四步：判断是否需要扩容或限流

若审计日志显示各 SQL 资源用量正常，则通过监控和审计查看当时执行的 SQL 数量是否高于历史水平。如有显著增加，与上游业务确认访问流量是否增长，再决定是集群扩容还是启用排队限流。

## 常用诊断 SQL

<!-- 知识类型: 操作步骤 -->

:::tip 注意
`active_queries` 记录在 FE 注册的查询，`backend_active_tasks` 记录在 BE 运行的任务。并非所有查询都在 FE 注册（例如 Stream Load 不在 FE 注册），因此以 `backend_active_tasks` LEFT JOIN `active_queries` 时出现无匹配行属于正常情况。

- 当查询类型为 SELECT 时，两表中的 `queryId` 一致。
- 当查询类型为 Stream Load 时，`active_queries` 中的 `queryId` 为空，`backend_active_tasks` 中的 `queryId` 为该 Stream Load 的 ID。
:::

**1. 查看各 Workload Group 的资源用量（按内存 / CPU / IO 降序）**

```sql
SELECT be_id, workload_group_id, memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second
FROM workload_group_resource_usage
ORDER BY memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second DESC;
```

**2. CPU 使用量 Top N 的 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t2.`database`,
    t1.cpu_time,
    t2.`sql`
FROM
    (SELECT query_id, query_type, sum(task_cpu_time_ms) AS cpu_time
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY cpu_time DESC
LIMIT 10;
```

**3. 内存使用量 Top N 的 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.mem_used
FROM
    (SELECT query_id, query_type, sum(current_used_memory_bytes) AS mem_used
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY mem_used DESC
LIMIT 10;
```

**4. 扫描数据量 Top N 的 SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.scan_rows,
    t1.scan_bytes
FROM
    (SELECT query_id, query_type, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY scan_rows DESC, scan_bytes DESC
LIMIT 10;
```

**5. 各 Workload Group 的扫描数据量汇总**

```sql
SELECT
    t2.workload_group_id,
    sum(t1.scan_rows) AS wg_scan_rows,
    sum(t1.scan_bytes) AS wg_scan_bytes
FROM
    (SELECT query_id, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
GROUP BY t2.workload_group_id
ORDER BY wg_scan_rows DESC, wg_scan_bytes DESC;
```

**6. 查看各 Workload Group 中正在排队的查询及排队时长**

```sql
SELECT
    workload_group_id,
    query_id,
    query_status,
    now() - queue_start_time AS queued_time
FROM active_queries
WHERE query_status = 'queued'
ORDER BY workload_group_id;
```
