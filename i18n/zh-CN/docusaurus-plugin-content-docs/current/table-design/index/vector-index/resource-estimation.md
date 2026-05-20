---
{
    "title": "ANN 资源评估指南",
    "sidebar_label": "资源评估",
    "language": "zh-CN",
    "description": "如何评估 Apache Doris 向量检索（ANN）的内存与 CPU 需求？本文给出 HNSW/IVF 与不同量化方式下的容量规划方法。",
    "keywords": [
        "ANN 资源评估",
        "向量检索容量规划",
        "HNSW 内存估算",
        "IVF 内存估算",
        "向量量化 sq8 sq4 pq",
        "Doris 向量索引 CPU"
    ]
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- 知识类型: 容量规划 / 资源评估 -->
<!-- 适用场景: 上线前规格规划 / 集群选型 / 内存与 CPU 预算评估 -->

向量检索（ANN）业务通常先受内存与 CPU 约束，而不是磁盘容量。本文给出一套可落地的资源评估方法，帮助你在上线前规划 Apache Doris 向量检索集群的规格。

## 快速导航

- 想知道**为什么 ANN 需要单独评估**：见 [ANN 资源特征](#ann-资源特征)。
- 想直接**估算内存**：见 [HNSW 内存估算](#hnsw-内存估算) 与 [IVF 内存估算](#ivf-内存估算)。
- 想**估算 CPU**：见 [CPU 核心估算](#cpu-核心估算)。
- 想了解**线上预留**：见 [线上安全余量](#线上安全余量不要按-100-内存设计)。
- 想做**索引选型**：见 [场景化选型建议](#场景化选型建议)。

## 评估总览

通用评估顺序为：

1. **估算索引内存**：根据数据规模、索引类型与量化方式得到索引常驻内存。
2. **估算 CPU 核心**：按目标 QPS 与延迟，匹配内存配比下的 CPU 数量。
3. **预留安全水位**：为查询执行、非向量列访问与 Compaction 留出冗余。

## ANN 资源特征

<!-- 知识类型: 概念说明 -->

相比常规 OLAP 索引，ANN 在资源使用上有以下特点：

| 资源维度 | 资源特征 |
|----------|----------|
| 构建阶段 CPU | 使用率高，导入期对 CPU 压力大 |
| 构建阶段内存 | Segment 过大时，单个索引构建可能因内存不足失败 |
| 查询阶段内存 | 高性能查询通常要求索引尽量常驻内存 |
| 查询阶段 CPU | 高 QPS 场景对 CPU 核心数有明显要求 |

Doris 支持 `sq8`、`sq4`、`pq` 三种量化方式来降低内存占用。量化的代价通常是：

- **导入变慢**：额外编码开销。
- **查询可能变慢**：额外解码或重构开销。
- **召回率可能下降**：有损编码引入误差。

## 评估输入清单

<!-- 知识类型: 操作步骤 -->

开始评估前，请准备以下输入：

| 输入项 | 说明 |
|--------|------|
| 向量维度 `D` | 单个向量的浮点维度，例如 `768` |
| 总行数 `N` | 待索引的向量总数 |
| 索引类型 | `hnsw` / `ivf` / `ivf_on_disk` |
| 量化方式 | `flat` / `sq8` / `sq4` / `pq` |
| `max_degree` | 仅 HNSW，控制图结构邻居数，默认 `32` |
| 目标 QPS 与延迟 | 用于 CPU 核心估算 |

## HNSW 内存估算

<!-- 知识类型: 容量规划公式 -->

### 默认参数下的经验公式

在默认 `max_degree=32` 时：

```
HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N
```

其中：

- `D * 4 * N` 为原始 float32 向量内存。
- `1.3` 表示 HNSW 图结构额外开销（约 `0.3` 倍）。

### 调整 `max_degree` 时的修正

`max_degree` 越大，图结构开销越高，按比例放大：

```
HNSW_factor   ~= 1 + 0.3 * (max_degree / 32)
HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N
```

### 量化对内存的近似缩减

| 量化方式 | 内存占比（相对 FLAT） |
|----------|------------------------|
| `sq8` | 约 `1/4` |
| `sq4` | 约 `1/8` |
| `pq` | 通常接近 `sq4`（如 `pq_m=D/2, pq_nbits=8`） |

### `ivf_on_disk` 的特殊说明

`ivf_on_disk` 复用了 IVF 的训练与查询参数模型（`nlist` / `ivf_nprobe`），但将倒排列表主体放在磁盘并通过缓存提供查询能力。做容量规划时，可先把下文的 IVF 估算视为「全量驻内存」的上界，再结合期望保留的热点数据规模单独规划 `ann_index_ivf_list_cache_limit`。

### 速查表（`D=768`，`max_degree=32`）

| 行数 | FLAT | SQ8 | SQ4 | PQ（`m=384, nbits=8`） |
|------|------|------|------|--------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF 内存估算

<!-- 知识类型: 容量规划公式 -->

IVF 相比 HNSW 结构开销更低，可近似为：

```
IVF_FLAT_Bytes ~= D * 4 * N
```

量化对 IVF 内存的缩减比例与 HNSW 一致：

| 量化方式 | 内存占比（相对 FLAT） |
|----------|------------------------|
| `sq8` | 约 `1/4` |
| `sq4` | 约 `1/8` |
| `pq` | 通常接近 `sq4` |

### 速查表（`D=768`）

| 行数 | FLAT | SQ8 | SQ4 | PQ（`m=384, nbits=8`） |
|------|------|------|------|--------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU 核心估算

<!-- 知识类型: 容量规划公式 -->

高 QPS 场景可先用经验比例估算：

```
16 核 : 64 GB   （约 1 核 : 4 GB）
```

注意：即使开启量化，CPU 需求也不一定按索引内存同比下降。实践上建议：

1. 先按 **FLAT 等效负载** 估算 CPU。
2. 通过实际压测逐步下调到合理水平。

## 线上安全余量（不要按 100% 内存设计）

<!-- 知识类型: 最佳实践 -->

上面的公式只覆盖 ANN 索引本身，不包含完整 SQL 执行开销。例如：

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

即使有 TopN 延迟物化，执行层仍需要额外内存处理非向量列与算子状态。线上建议：

- ANN 索引内存控制在机器总内存的约 **70%** 以内。
- 其余内存用于查询执行、Compaction 与其他数据访问。

## 场景化选型建议

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 索引类型与量化方式选择 -->

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 性能优先且内存预算充足 | `HNSW + FLAT` | 召回率与延迟最佳 |
| 内存受限 | `HNSW/IVF + PQ` | 通常比 `SQ8/SQ4` 更平衡 |
| PQ 参数初值 | `pq_m = D / 2` | 后续按召回与延迟压测微调 |
| 查询性能要求不高 | 优先降低 CPU 配置 | 也可采用「导入期高 CPU、稳定期降配」策略 |

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：开启量化后内存能减少多少？**

A：`sq8` 约为 FLAT 的 `1/4`，`sq4` 与 `pq`（如 `pq_m=D/2, pq_nbits=8`）约为 `1/8`。具体值仍受 HNSW 图结构开销影响。

**Q2：CPU 是否可以按量化后的内存比例同步缩减？**

A：不建议。量化主要降低内存占用，CPU 需求并不同比例下降。建议先按 FLAT 等效负载估算 CPU，再通过压测下调。

**Q3：`max_degree` 调大后内存如何变化？**

A：HNSW 图结构开销按 `1 + 0.3 * (max_degree / 32)` 放大。例如 `max_degree=64` 时，因子约为 `1.6`。

**Q4：`ivf_on_disk` 应该按多少内存做规划？**

A：上界为「全量驻内存的 IVF」，实际驻内存大小由 `ann_index_ivf_list_cache_limit` 决定，可结合热点数据规模单独评估。

**Q5：为什么不能按 100% 内存来设计？**

A：ANN 索引外，SQL 执行层（非向量列、算子状态）、Compaction 与其他访问也会占用内存。建议预留约 30% 余量，索引内存控制在总内存的 70% 以内。

## 相关文档

- [向量搜索概述](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN 索引管理](./index-management.md)
