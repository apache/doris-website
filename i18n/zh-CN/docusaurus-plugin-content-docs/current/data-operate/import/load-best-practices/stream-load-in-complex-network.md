---
{
    "title": "复杂网络环境 Stream Load 实践",
    "language": "zh-CN",
    "description": "如何在公有云、私有云、Kubernetes 跨集群等复杂网络下使用 Doris Stream Load？多端点配置与 Group Commit 调度方案。",
    "keywords": [
        "Stream Load",
        "Group Commit",
        "复杂网络",
        "公有云导入",
        "Kubernetes 数据导入",
        "VPC 跨集群",
        "负载均衡器",
        "public_endpoint",
        "private_endpoint",
        "redirect-policy"
    ]
}
---

<!-- 知识类型: 架构选型决策 + 操作步骤 -->
<!-- 适用场景: 公有云 / 私有云 / Kubernetes 跨集群环境下的数据导入配置 -->

在公有云、私有云、Kubernetes 跨集群等复杂网络环境中，数据导入面临独特挑战。负载均衡器（LB）和网络隔离（VPC 内外访问）会影响请求路由的灵活性和批处理效率。

Apache Doris 通过以下两个特性解决这些挑战：

- **Stream Load 多端点支持**：支持为 BE 节点灵活配置多个网络端点。
- **Group Commit LB 调度优化**：确保请求经过负载均衡器时仍能高效批处理。

> 版本要求：需要 Doris 3.1.0 或更高版本。

## 背景知识

### Stream Load

Stream Load 是基于 HTTP 的数据导入方式，支持 JSON、CSV 等格式。作为推送式方法，客户端通过 HTTP 请求直接将数据发送到 BE 节点，绕过 MySQL 协议。这种设计支持高并发、低延迟和高吞吐，特别适合小批量、高频写入场景。

### Group Commit

Group Commit 通过在服务端将多个小请求合并为大批量操作来优化吞吐量，减少磁盘 I/O、锁竞争和 Compaction 开销。为实现最佳效率，Group Commit 要求同一表的请求路由到同一 BE 节点。

### 复杂网络环境下的核心问题

在云环境中，负载均衡器会将请求随机分发到各 BE 节点，破坏了 Group Commit 所需的"节点亲和性"，导致同一表的请求分散到不同节点。测试表明，高并发场景下吞吐量可能因此下降 20-50%。

## Stream Load 多端点支持

<!-- 知识类型: 配置参数 -->

### 三种 BE 地址类型

Doris BE 节点支持三种地址类型，以适配不同的网络访问场景：

| 地址类型             | 用途                                  | 示例                  |
| -------------------- | ------------------------------------- | --------------------- |
| `be_host`            | 集群内部通信                          | `192.168.1.1:9050`    |
| `public_endpoint`    | 外部公网访问（通过 LB 或公网 IP）     | `11.10.20.12:8010`    |
| `private_endpoint`   | VPC 内部或 Kubernetes Service IP 访问 | `10.10.10.9:8020`     |

### 配置 BE 端点

通过 SQL 语句为 BE 节点添加或修改端点信息：

```sql
-- 添加 BE 节点并配置端点
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- 修改现有 BE 节点的端点
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```

### 重定向策略（redirect-policy）

通过在 Stream Load 请求中设置 `redirect-policy` HTTP 头，可以控制请求路由到的目标端点：

| 策略         | 行为                          | 适用场景                       |
| ------------ | ----------------------------- | ------------------------------ |
| `direct`     | 路由到 `be_host`              | 内部低延迟通信、Pod 间通信     |
| `public`     | 路由到 `public_endpoint`      | 外部公网访问                   |
| `private`    | 路由到 `private_endpoint`     | VPC 内部或跨集群访问           |
| 默认（空）   | 根据主机名自动选择            | 通用场景                       |

未显式设置 `redirect-policy` 时，FE 按以下顺序自动选择端点：

1. 若请求主机名与 `public_endpoint` 主机名匹配，路由到 `public_endpoint`。
2. 否则若配置了 `private_endpoint`，路由到 `private_endpoint`。
3. 否则回退到 `be_host`。

### 请求示例

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### 工作原理

1. 客户端向 FE 发送 Stream Load 请求，可携带 `redirect-policy` 头。
2. FE 根据策略从 BE 地址池中选择目标地址。
3. FE 返回 HTTP 重定向响应，指向选定的端点。

## Group Commit LB 调度优化

<!-- 知识类型: 架构机制 -->

### 两阶段转发机制

为在负载均衡器后保持 Group Commit 效率，Doris 实现了两阶段转发机制：

**第一阶段：FE 重定向**

- FE 根据 `redirect-policy` 选择合适的端点。
- FE 确定应处理目标表的 BE 节点。
- 请求经 LB 重定向，LB 随机分发到某个 BE 节点。

**第二阶段：BE 转发**

- 若接收请求的 BE（BE1）不是该表的指定节点。
- BE1 通过 `be_host` 将请求内部转发到正确的 BE（BE2）。
- 确保同一表的所有请求到达同一节点。

### 启用 Group Commit 的请求示例

只需在请求头中加入 `group_commit` 参数，即可启用对应的 Group Commit 模式：

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### 性能表现

两阶段转发引入的开销极小（毫秒级），而 Group Commit 的批处理优化可在高并发场景下提升 20-50% 的吞吐量。

## 典型应用场景

<!-- 适用场景: 不同业务形态下的端点与 Group Commit 组合选型 -->

| 场景               | 配置                                       | 收益                       |
| ------------------ | ------------------------------------------ | -------------------------- |
| 实时日志采集       | Group Commit + 多端点                      | 高吞吐 + 灵活路由          |
| 云原生 BI          | `public_endpoint` 外部访问                 | 安全的外部用户访问         |
| Kubernetes 跨集群  | `private_endpoint` 配合 Pod / Service IP    | 高效跨集群通信             |

## 注意事项

- **配置规划**：确保端点地址配置正确，尤其在 Kubernetes 环境中，需要与 Service / Pod IP 规划保持一致。
- **监控**：使用监控工具跟踪转发率和性能指标，关注两阶段转发的命中率。
- **版本要求**：需要 Doris 3.1.0 或更高版本。

## FAQ

**Q1：什么时候需要配置 `public_endpoint` 和 `private_endpoint`？**

当客户端与 BE 节点之间存在网络隔离（如 VPC 内外、Kubernetes 集群内外）时，需要分别配置 `public_endpoint`（公网/外部访问）和 `private_endpoint`（内网/VPC 访问），以便不同网络位置的客户端能够正确访问 BE。

**Q2：经过负载均衡器后 Group Commit 还有效吗？**

有效。Doris 通过两阶段转发机制确保即使 LB 随机分发请求，BE 之间也会将同一表的请求转发到同一节点，从而保留 Group Commit 的批处理优势。

**Q3：`redirect-policy` 不设置会怎样？**

FE 会根据请求主机名自动选择端点：先尝试匹配 `public_endpoint`，再尝试 `private_endpoint`，最后回退到 `be_host`。

**Q4：两阶段转发是否会显著增加延迟？**

不会。BE 之间的内部转发开销在毫秒级，相对于 Group Commit 在高并发下带来的 20-50% 吞吐量提升，可以忽略不计。

## Troubleshooting

| 现象                                              | 可能原因                                              | 解决方案                                                                  |
| ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| 客户端无法访问重定向后的 BE 地址                  | `public_endpoint` / `private_endpoint` 配置与实际网络不符 | 通过 `ALTER SYSTEM MODIFY BACKEND` 修正端点配置                           |
| 高并发下 Stream Load 吞吐未达预期                 | 未启用 Group Commit，或请求未经过两阶段转发           | 在请求头加入 `group_commit: async_mode`，并确认 BE 间网络互通             |
| 跨 Kubernetes 集群导入失败                        | 缺少 `private_endpoint` 或未指定 `redirect-policy`    | 配置 `private_endpoint` 为 Pod / Service IP，并设置 `redirect-policy: private` |
| 默认重定向行为路由到错误的端点                    | 主机名匹配规则未命中预期                              | 显式指定 `redirect-policy: public` 或 `private`                           |
