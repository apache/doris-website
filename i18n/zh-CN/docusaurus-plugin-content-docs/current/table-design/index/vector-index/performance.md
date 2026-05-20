---
{
    "title": "性能测试与分析",
    "language": "zh-CN",
    "description": "Apache Doris 向量索引（ANN Index）查询性能、召回率与导入速度实测：基于 VectorDBBench 768D1M 数据集的基准测试与调优建议。"
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

<!-- 知识类型: 性能基准 / 调优参考 -->
<!-- 适用场景: 选型评估 / 性能验证 / 参数调优 -->

本文介绍 Apache Doris 向量索引（ANN Index）的查询性能与导入性能基准测试结果，所有测试均通过 [VectorDBBench](https://github.com/zilliztech/VectorDBBench) 完成，可帮助你：

- 评估 Doris 向量检索能力是否满足业务需求；
- 理解召回率、查询性能、导入速度三者之间的权衡；
- 在本地复现测试结果，验证生产环境表现。

如需查看单机与分布式下更大规模（10M / 100M 级）数据集的测试结果，请参考[大规模性能实测](./performance-large-scale.md)。

## 测试环境

<!-- 知识类型: 测试环境配置 -->

| 项目         | 配置                                                          |
| ------------ | ------------------------------------------------------------- |
| 机器规格     | 16C 64GB                                                      |
| CPU 型号     | Intel(R) Xeon(R) Platinum 8369B CPU @ 2.70GHz                 |
| 部署方式     | FE 与 BE 混合部署在同一台机器上                               |
| Doris 版本   | Apache Doris 4.0.2                                            |
| 测试数据集   | VectorDBBench Performance768D1M（向量维度 768，共 100 万行）  |

:::caution 注意
FE 与 BE 混合部署 **不是推荐的生产环境部署方式**，生产环境建议 FE 与 BE 分离部署。
:::

## 测试结果

![performance](/images/vector-search/ann-index-performance-0.jpg)

在 Performance768D1M 数据集上，Apache Doris 在保持 **97% 以上召回率** 的同时，QPS 可达到 **989.1**，导入性能也明显优于同类系统。

## 结果分析

### 向量数据库的“性能铁三角”

<!-- 知识类型: 概念解释 -->

向量搜索场景下，一个成熟、可在生产环境稳定运行的向量数据库通常需要在以下三者之间进行取舍：

```
                    ┌──────────────────────┐
                    │      召回率 Recall    │
                    │  (Higher is Better)  │
                    └──────────▲───────────┘
                               / \
                              /   \
                             /     \
                            /       \
                           /         \
                          /           \
             ┌───────────┘             └───────────┐
             │                                     │
             │                                     │
             ▼                                     ▼
 ┌──────────────────────┐                 ┌────────────────────────┐
 │      查询性能 QPS     │                 │     导入速度 Indexing   │
 │   (Latency / QPS)     │                 │     Throughput         │
 │  (Lower Latency Better)│                │  (Higher is Better)    │
 └──────────────────────┘                 └────────────────────────┘
```

| 维度                          | 衡量指标                  | 期望方向 |
| ----------------------------- | ------------------------- | -------- |
| 召回率 Recall                 | Top-K 命中比例            | 越高越好 |
| 查询性能 QPS / Latency        | 每秒查询数 / 单次查询延迟 | QPS 越高、延迟越低越好 |
| 导入速度 Indexing Throughput  | 索引构建吞吐              | 越高越好 |

这三者通常难以同时最大化，向量数据库的系统设计必须在它们之间进行权衡。

### HNSW 的关键参数与权衡

<!-- 知识类型: 配置参数 -->

以业界最广泛使用的 HNSW（Hierarchical Navigable Small World）向量索引为例，它依赖图结构进行搜索优化，主要有三个可调超参数：

| 参数              | 作用                       | 影响                                          |
| ----------------- | -------------------------- | --------------------------------------------- |
| `max_degree`      | 图中每个节点的最大出度     | 决定图的稠密程度与整体连通性                  |
| `ef_construction` | 构建索引时的候选集大小     | 越大，构建出的图质量越高                      |
| `hnsw_ef_search`  | 查询时的探索窗口大小       | 直接影响召回率与查询延迟                      |

调参的典型权衡：

1. 增大 `max_degree` 与 `ef_construction`，可显著提升图结构的连通性与导航效率，从而带来更高的召回率；
2. 更高质量的图意味着查询阶段可以将 `hnsw_ef_search` 设得更小，从而降低搜索代价、提升查询性能；
3. 但代价是索引构建需要更多计算与内存资源，**导入性能因此下降**。

这正是向量数据库设计时面对的典型“三难困境”。

### Apache Doris 的优化思路

<!-- 知识类型: 架构选型决策 -->

Apache Doris 在设计向量搜索能力时，目标是构建一个 **更加均衡的性能三角形**：

- 底层执行引擎优化；
- 存储格式改进；
- 对 HNSW 构建流程的工程级并行化加速。

最终效果是：在 **不牺牲索引质量与高召回** 的前提下，显著提升整体索引导入速度。

在 Performance768D1M 数据集上的测试结果验证了这一设计目标：

- 在保持索引质量一致的前提下，Doris 的导入性能明显优于同类系统；
- 并未因为提升导入速度而降低图结构的质量；
- QPS 达到 **989.1**，召回率仍保持在 **97% 以上**，三个维度上均取得均衡结果。

## 复现方式

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 性能基准复现 -->

使用以下命令即可在本地复现上述测试：

```bash
NUM_PER_BATCH=500000 vectordbbench doris \
    --host 127.0.0.1 \
    --port 9030 \
    --http-port 8030 \
    --case-type Performance768D1M \
    --db-name vdb \
    --num-concurrency 80 \
    --stream-load-rows-per-batch 500000 \
    --index-prop max_degree=128,ef_construction=256 \
    --session-var hnsw_ef_search=100
```

关键参数说明：

| 参数                              | 含义                                  |
| --------------------------------- | ------------------------------------- |
| `--case-type`                     | 选择测试用例（此处为 768D1M 数据集） |
| `--num-concurrency`               | 查询并发数                            |
| `--stream-load-rows-per-batch`    | Stream Load 每批次行数                |
| `--index-prop`                    | 索引构建参数（`max_degree`、`ef_construction`） |
| `--session-var`                   | 查询时 Session 变量（`hnsw_ef_search`） |

## 相关文档

- [大规模性能实测](./performance-large-scale.md)：10M / 100M 级数据集在单机与分布式下的测试结果
- [HNSW 索引原理](./hnsw.md)
- [向量索引概览](./overview.md)
- [向量索引实践指南](./practical-guide.md)
