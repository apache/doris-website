---
{
    "title": "IVF On-Disk",
    "language": "zh-CN",
    "description": "Apache Doris IVF On-Disk 索引将倒排列表落盘并配合专用缓存，降低大规模向量检索的内存占用。",
    "keywords": [
        "IVF On-Disk",
        "Apache Doris 向量索引",
        "ANN 索引",
        "ivf_on_disk",
        "向量检索内存优化",
        "ivf_nprobe",
        "ann_index_ivf_list_cache_limit",
        "大规模向量检索"
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

# Apache Doris 中的 IVF On-Disk

<!-- 知识类型: 能力定义 + 配置参数 + 性能参考 -->
<!-- 适用场景: 大规模向量检索 / 内存预算受限 / ANN 索引选型 -->

`ivf_on_disk` 是 Apache Doris 面向大规模向量检索（ANN）场景提供的索引类型。它将 IVF 倒排列表主体存放在磁盘上，并通过专用缓存按需加载热点数据，在保留 IVF 检索能力的同时显著降低常驻内存占用。

## 快速导航

- 想了解为什么需要 `ivf_on_disk`：阅读 [背景与目标](#背景与目标)。
- 想直接建表使用：阅读 [建索引 DDL](#1建索引-ddl) 与 [查询参数](#2查询参数)。
- 想控制内存占用：阅读 [BE 缓存配置](#3be-缓存配置) 与 [调优建议](#调优建议)。
- 想评估实际表现：阅读 [性能参考数据](#性能参考数据)。
- 想对比纯内存 IVF：阅读 [与 IVF 的对比](#与-ivf-的对比)。

## 背景与目标

<!-- 知识类型: 能力定义 -->

当向量规模达到千万乃至更高时，纯内存 IVF 的索引内存成本会快速攀升，并成为资源瓶颈。`ivf_on_disk` 的设计目标包括：

- 保持 IVF 的参数模型与检索语义（`nlist` / `nprobe`）。
- 将“必须全量驻内存”的模式转为“磁盘 + 专用缓存”模式。
- 让用户继续沿用现有 ANN 的 SQL 使用方式与运维习惯。

简而言之，`ivf_on_disk` 主要面向 **内存预算受限但仍需要 ANN 加速** 的生产场景。

## 与 IVF 的对比

<!-- 知识类型: 架构选型决策 -->

下表帮助快速判断在什么场景下应选择 `ivf_on_disk` 而不是 `ivf`。

| 对比维度       | `ivf`（内存）       | `ivf_on_disk`（磁盘 + 缓存）           |
| -------------- | ------------------- | -------------------------------------- |
| 倒排列表存储   | 全量内存            | 磁盘为主，缓存按需加载                 |
| 内存占用       | 高，随数据量线性增长 | 显著降低，可由缓存上限显式控制         |
| 查询延迟       | 最低                | 略高于内存 IVF，受缓存命中率影响       |
| 参数模型       | `nlist` / `nprobe`  | 完全相同                               |
| 查询函数       | ANN 查询函数        | 完全相同                               |
| 适用规模       | 中小规模            | 千万级及以上                           |
| 迁移成本       | -                   | 低，仅需修改 `index_type`              |

## 用户接口

### 1）建索引 DDL

<!-- 知识类型: 操作步骤 -->

通过 `index_type="ivf_on_disk"` 创建 ANN 索引：

```sql
CREATE TABLE vec_tbl (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_emb (embedding) USING ANN PROPERTIES (
        "index_type" = "ivf_on_disk",
        "metric_type" = "l2_distance",
        "dim" = "768",
        "nlist" = "1024"
    )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

关键说明：

- `ivf` 与 `ivf_on_disk` 都必须显式指定 `nlist`。
- `metric_type` 支持 `l2_distance` 与 `inner_product`。
- 查询函数保持一致，仍使用 `l2_distance_approximate` / `inner_product_approximate`。

### 2）查询参数

<!-- 知识类型: 配置参数 -->

`ivf_nprobe` 仍是 IVF 系列最关键的查询阶段参数：

```sql
SET ivf_nprobe = 64;
```

一般而言，`nprobe` 越大，召回率越高，但查询延迟也会相应上升。

### 3）BE 缓存配置

<!-- 知识类型: 配置参数 -->

`ivf_on_disk` 引入了 IVF 倒排列表专用缓存，相关 BE 配置如下：

| 配置项                                          | 默认值 | 说明                                                       |
| ----------------------------------------------- | ------ | ---------------------------------------------------------- |
| `ann_index_ivf_list_cache_limit`                | `70%`  | 缓存上限，百分比基准为 BE 进程可用内存（受 `mem_limit` 约束），不是整机物理内存。 |
| `ann_index_ivf_list_cache_stale_sweep_time_sec` | `3600` | 缓存中陈旧条目的清理周期，单位为秒。                       |

## 可观测性

<!-- 知识类型: 监控指标 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

为了定位 `ivf_on_disk` 的性能瓶颈，新增了专用的 Profile 计数器和 BE 指标，可用于判断当前缓存大小是否合适，以及延迟主要来自磁盘缺页还是检索计算本身。

常用 Profile 字段：

- `AnnIvfOnDiskLoadCosts`
- `AnnIvfOnDiskCacheHitCnt`
- `AnnIvfOnDiskCacheMissCnt`

常用 BE 指标：

- `ann_ivf_on_disk_fetch_page_costs_ms`
- `ann_ivf_on_disk_fetch_page_cnt`
- `ann_ivf_on_disk_search_costs_ms`
- `ann_ivf_on_disk_search_cnt`
- `ann_ivf_on_disk_cache_hit_cnt`
- `ann_ivf_on_disk_cache_miss_cnt`

## 使用说明

<!-- 知识类型: 使用约束 -->

- `ivf_on_disk` 与现有 ANN 索引共享主要使用约束（如向量列类型、索引参数合法性等）。
- 训练质量与检索效果仍依赖数据规模和参数组合（`nlist`、`ivf_nprobe`）。
- `ivf_on_disk` 支持 Stream Load 等常见导入路径，建议在生产上线前结合业务数据进行验证。

## 性能参考数据

<!-- 知识类型: 性能参考 -->

下表为一组参考压测快照，用于展示缓存覆盖率、内存占用与延迟之间的实际权衡关系。

| 场景                   | 内存使用量 (GB) | AnnIndexIVFListCache 命中率 | Max QPS | Recall@100 | 平均延迟 (s) | P99 延迟 (s) | P95 延迟 (s) |
| ---------------------- | --------------: | --------------------------: | ------: | ---------: | -----------: | -----------: | -----------: |
| Brute Force (No Index) |               - |                           - |  0.2922 |     0.0000 |     292.5394 |     307.9490 |     307.9442 |
| IVF In Memory          |            32.0 |                        100% | 71.8535 |     0.9598 |       0.4167 |       0.5623 |       0.5151 |
| OnDisk Cache 100%      |            32.0 |                        100% | 72.3649 |     0.9599 |       0.8274 |       1.1236 |       1.0395 |
| OnDisk Cache 79%       |            22.0 |                         70% | 45.0266 |     0.9599 |       1.9900 |       4.4059 |       3.3568 |
| OnDisk Cache 60%       |            16.7 |                         55% | 38.3141 |     0.9599 |       2.3281 |       4.0063 |       3.5542 |

阅读建议：

- 在召回率接近（约 0.96）的情况下，缓存降低会显著减少内存占用，但尾延迟会上升。
- 当缓存覆盖接近 100% 时，`ivf_on_disk` 可保持接近内存 IVF 的召回率，但延迟会有一定增加。
- 生产环境中建议持续观察命中率指标，用于反向调优 `ann_index_ivf_list_cache_limit`。

## 调优建议

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 性能调优 -->

推荐按照如下步骤迭代调优：

1. 先复用 `ivf` 的 `nlist` / `ivf_nprobe` 基线参数启动测试。
2. 根据内存预算设置 `ann_index_ivf_list_cache_limit`，再观察命中率与延迟波动。
3. 若召回稳定但延迟抖动明显，优先提高缓存比例并复测命中情况。
4. 缓存比例变化后，再次联合调节 `ivf_nprobe`，平衡召回率与延迟。

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：`ivf_on_disk` 和 `ivf` 的 SQL 用法有差别吗？**

没有差别。建索引时仅需将 `index_type` 修改为 `ivf_on_disk`，查询函数（`l2_distance_approximate` / `inner_product_approximate`）和参数（`ivf_nprobe`）保持一致。

**Q2：`ann_index_ivf_list_cache_limit` 的百分比基准是什么？**

是 BE 进程可用内存（受 `mem_limit` 约束），并非整机物理内存。请结合 BE 内存上限规划缓存比例。

**Q3：缓存命中率多少算合理？**

视业务可接受的尾延迟而定。从参考数据看，命中率 100% 时延迟最稳定；命中率降到 55%-70% 时，内存占用大幅下降，但 P99 延迟可能升至秒级。建议结合可观测性指标持续调优。

**Q4：什么时候应选择 `ivf_on_disk` 而不是 `ivf`？**

当向量规模较大（千万级以上）、内存预算紧张，但仍需要 ANN 加速时优先选择 `ivf_on_disk`；对延迟极度敏感且内存充足时可选择 `ivf`。

## 相关文档

- [向量索引概览](./overview.md)
- [IVF 索引](./ivf.md)
- [HNSW 索引](./hnsw.md)
- [向量索引管理](./index-management.md)
- [大规模向量检索性能](./performance-large-scale.md)
