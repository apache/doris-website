---
{
    "title": "并发控制与排队：防止高并发导致 OOM 或系统卡死",
    "sidebar_label": "并发控制与排队",
    "language": "zh-CN",
    "description": "配置 Doris workload group 的并发上限与排队策略，防止高并发场景下 OOM 或系统卡死。",
    "keywords": ["并发控制", "排队", "workload group", "max_concurrency", "max_queue_size", "queue_timeout", "高并发", "OOM", "资源管控", "查询限流"]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 高并发查询限流 / 防止 OOM / 系统资源管控 -->

并发控制与排队（Concurrency Control & Queuing）是 Doris 工作负载管理的核心机制。当同时运行的查询数量超过系统上限时，Doris 会将多余的查询放入等待队列，而非直接拒绝或压垮系统，从而避免 OOM、系统卡死等问题。

该机制通过 **workload group** 实现，每个 workload group 可独立设置最大并发数、队列长度和排队超时时间。

## 配置并发控制与排队

<!-- 知识类型: 操作步骤 -->

**目的**：创建或修改 workload group，限制并发查询数量并开启排队。

**命令**：

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS queue_group
PROPERTIES (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

**参数说明**：

| 参数名 | 类型 | 默认值 | 取值范围 | 说明 |
|---|---|---|---|---|
| `max_concurrency` | 整型 | 2147483647 | [0, 2147483647] | 最大查询并发数。默认值为整型最大值，即不限并发。运行中的查询数量达到上限时，新查询进入排队逻辑。 |
| `max_queue_size` | 整型 | 0 | [0, 2147483647] | 排队队列长度。队列已满时，新查询直接被拒绝。默认值为 0，即不排队。 |
| `queue_timeout` | 整型 | 0 | [0, 2147483647] | 查询在队列中的最大等待时间，单位为毫秒。超时后直接向客户端返回失败。默认值为 0，即进入队列后立即返回失败。 |

**示例说明**：

以上配置在单 FE 场景下的含义：

- 集群同时运行的查询数最多为 10 个
- 并发已满时，新查询进入队列，队列最大长度为 20
- 队列中的查询最长等待 3 秒（3000 毫秒），超时则返回失败

:::tip 多 FE 场景注意事项
排队参数在**单 FE 粒度**生效，不感知集群中 FE 的总数。示例：

- 配置 `max_concurrency = 1`，集群有 1 台 FE → 同时最多运行 1 个 SQL
- 配置 `max_concurrency = 1`，集群有 3 台 FE → 同时最多运行 3 个 SQL（每台 FE 各 1 个）

在多 FE 集群中，应将 `max_concurrency` 设置为期望的集群级别并发数除以 FE 数量。
:::

## 查看当前排队状态

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 监控排队情况 / 诊断并发问题 -->

**目的**：查看各 workload group 当前的运行查询数和排队查询数。

**命令**：

```sql
SHOW WORKLOAD GROUPS;
```

**示例输出**：

```text
mysql [(none)]> SHOW WORKLOAD GROUPS\G;
*************************** 1. row ***************************
                          Id: 1
                        Name: normal
                   cpu_share: 20
                memory_limit: 50%
    enable_memory_overcommit: true
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
              cpu_hard_limit: 1%
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 50%
       memory_high_watermark: 80%
                         tag: 
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
           running_query_num: 0
           waiting_query_num: 0
```

关键字段说明：

- `running_query_num`：当前正在运行的查询数量
- `waiting_query_num`：当前在队列中等待的查询数量

## 绕过排队限制（管理员操作）

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 运维操作 / 紧急管理 -->

**目的**：在运维场景下，管理员账户需要跳过排队逻辑，直接执行管理 SQL。

**命令**：

```sql
SET bypass_workload_group = true;
```

**说明**：该设置为 session 级别变量，仅对当前会话生效。建议仅在运维操作时临时开启，操作完成后关闭或重新建立连接。

## 常见问题

<!-- 知识类型: 故障排查 -->

### Q: 新查询立即报错，未进入排队
`queue_timeout = 0` 或 `max_queue_size = 0` 导致查询无法排队。调整 `max_queue_size` > 0 且 `queue_timeout` > 0。

### Q: 队列满后查询被拒绝
`max_queue_size` 配置过小。增大 `max_queue_size`，或提高 `max_concurrency`。

### Q: 多 FE 集群并发限制不符合预期
排队参数按单 FE 粒度生效。将 `max_concurrency` 设为目标值除以 FE 数量。

### Q: 管理员操作也被排队阻塞
未开启 bypass 变量。执行 `SET bypass_workload_group = true`。
