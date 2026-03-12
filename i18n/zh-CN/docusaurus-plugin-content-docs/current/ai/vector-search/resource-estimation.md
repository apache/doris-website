---
{
    "title": "ANN 资源评估指南",
    "sidebar_label": "资源评估",
    "language": "zh-CN",
    "description": "本文介绍如何评估 Apache Doris 向量检索（ANN）在 HNSW/IVF 与不同量化方式下的内存和 CPU 资源需求。"
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

ANN 业务通常先受内存和 CPU 约束，而不是磁盘容量。本文给出一套可落地的资源评估方法，用于上线前规划 Doris 向量检索集群规格。

通用评估顺序如下：
1. 先估算索引内存。
2. 再按目标查询性能估算 CPU。
3. 最后预留查询执行和非向量列访问的安全水位。

## 为什么 ANN 需要单独做容量评估

相比常规 OLAP 索引，ANN 有以下资源特征：

1. 构建阶段 CPU 使用率高。
2. Segment 过大时，单个索引构建可能出现内存不足并失败。
3. 查询阶段若要求高性能，通常需要将索引尽量常驻内存。
4. 高 QPS 场景对 CPU 核心数有明显要求。

Doris 支持 `sq8`、`sq4`、`pq` 量化来降低内存占用。量化的代价通常是：
- 导入变慢（额外编码开销）；
- 查询可能变慢（额外解码/重构开销）；
- 召回率可能下降（有损编码）。

## 评估步骤

先准备以下输入：
- 向量维度 `D`
- 总行数 `N`
- 索引类型（`hnsw` / `ivf`）
- 量化方式（`flat` / `sq8` / `sq4` / `pq`）
- `max_degree`（仅 HNSW）
- 目标 QPS 与延迟

按顺序评估：
1. 索引内存
2. CPU 核心
3. 线上安全余量

## HNSW 内存估算

在默认 `max_degree=32` 时，可用经验公式：

`HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N`

其中：
- `D * 4 * N` 为原始 float32 向量内存；
- `1.3` 表示 HNSW 图结构额外开销（约 0.3 倍）。

若提高 `max_degree`，图结构开销按比例放大：

`HNSW_factor ~= 1 + 0.3 * (max_degree / 32)`

`HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N`

量化近似关系：
- `sq8`：约为 `flat` 的 `1/4`
- `sq4`：约为 `flat` 的 `1/8`
- `pq`：内存通常接近 `sq4`（如 `pq_m=D/2, pq_nbits=8`）

### 速查表（`D=768`, `max_degree=32`）

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF 内存估算

IVF 相比 HNSW 结构开销更低，可近似为：

`IVF_FLAT_Bytes ~= D * 4 * N`

量化近似关系：
- `sq8`：约为 `flat` 的 `1/4`
- `sq4`：约为 `flat` 的 `1/8`
- `pq`：通常接近 `sq4`

### 速查表（`D=768`）

| 行数 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU 核心估算

高 QPS 场景可先用经验比例：

`16 核 : 64 GB`（约 `1 核 : 4 GB`）

即使开启量化，CPU 需求也不一定按索引内存同比下降。实践上建议先按 **FLAT 等效负载** 估算 CPU，再通过压测逐步下调。

## 实际 SQL 的安全余量（不要按 100% 内存设计）

上面的公式只覆盖 ANN 索引本身，不包含完整 SQL 执行开销。例如：

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

即使有 TopN 延迟物化，执行层仍需要额外内存处理非向量列与算子状态。线上建议：

- ANN 索引内存控制在机器总内存的约 `70%` 以内；
- 其余内存用于查询执行、Compaction 和其他数据访问。

## 场景化选型建议

1. 性能优先且内存预算充足：`HNSW + FLAT`。
2. 内存受限：`HNSW/IVF + PQ`（通常比 `SQ8/SQ4` 更平衡）。
3. PQ 参数可先用 `pq_m = D / 2` 作为起点，再按召回和延迟压测微调。
4. 查询性能要求不高时，优先降低 CPU 配置；也可采用“导入期高 CPU、稳定期降配”的策略。

## 相关文档

- [向量搜索概述](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN 索引管理](./index-management.md)
