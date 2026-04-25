---
{
    "title": "IVF On-Disk",
    "language": "zh-CN",
    "description": "IVF On-Disk 是 Apache Doris 在大规模向量检索场景下提供的 ANN 索引形态，通过将 IVF 倒排列表驻留在磁盘并配合专用缓存，在内存占用与查询性能之间实现更可控的平衡。"
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

`ivf_on_disk` 是 Doris 面向大规模向量检索场景提供的 ANN 索引类型。与完全内存驻留的 IVF 相比，它将 IVF 倒排列表主体放在磁盘，通过查询时的专用缓存加载热点数据，从而在保证 ANN 检索能力的同时显著降低常驻内存压力。

## 背景与目标

在向量规模达到千万甚至更高后，纯内存 IVF 的索引内存成本会快速上升，成为资源瓶颈。`ivf_on_disk` 的目标是：

- 保持 IVF 的参数模型与检索语义（`nlist` / `nprobe`）。
- 将“必须全量驻内存”的模式转为“磁盘 + 专用缓存”模式。
- 让用户继续沿用现有 ANN 的 SQL 使用方式与运维习惯。

换句话说，`ivf_on_disk` 主要解决的是“内存预算受限但仍需要 ANN 加速”的生产场景。

## 对用户的价值

相对于 `ivf`，`ivf_on_disk` 的核心价值在于更可控的资源取舍：

- 在大数据量下获得更好的内存弹性。
- 可以通过缓存上限配置显式调节性能与内存占用。
- 继续使用接近 IVF 的建索引、调参与查询方法，迁移成本较低。

## 用户接口

### 1）建索引 DDL

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

说明：

- `ivf` 和 `ivf_on_disk` 都必须显式指定 `nlist`。
- `metric_type` 支持 `l2_distance` 与 `inner_product`。
- 查询函数保持一致，仍使用 `l2_distance_approximate` / `inner_product_approximate`。

### 2）查询参数

`ivf_nprobe` 仍是 IVF 系列最关键的查询阶段参数：

```sql
SET ivf_nprobe = 64;
```

一般来说，`nprobe` 越大，召回率越高，但查询延迟也会相应上升。

### 3）BE 缓存配置

`ivf_on_disk` 新增 IVF 倒排列表专用缓存：

- `ann_index_ivf_list_cache_limit`（默认：`70%`）
- `ann_index_ivf_list_cache_stale_sweep_time_sec`（默认：`3600`）

其中 `ann_index_ivf_list_cache_limit` 的百分比基准是 BE 进程可用内存（受 `mem_limit` 约束），不是整机物理内存。

## 可观测性

为了定位 `ivf_on_disk` 的性能瓶颈，分支中补充了专用 Profile 计数器和 BE 指标。

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

这些指标可以帮助判断当前缓存大小是否合适，以及延迟主要来自磁盘缺页还是检索计算本身。

## 使用说明

- `ivf_on_disk` 与现有 ANN 索引共享主要使用约束（例如向量列类型、索引参数合法性等）。
- 训练质量与检索效果仍然依赖数据规模和参数组合（`nlist`、`ivf_nprobe`）。
- `ivf_on_disk` 支持 Stream Load 等常见导入路径，建议在生产上线前结合业务数据做验证。

## 性能参考数据

下面的结果是一组参考压测快照，用于展示缓存覆盖率、内存占用与延迟之间的实际权衡关系。

| 场景 | 内存使用量 (GB) | AnnIndexIVFListCache 命中率 | Max QPS | Recall@100 | 平均延迟 (s) | P99 延迟 (s) | P95 延迟 (s) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Brute Force (No Index) | - | - | 0.2922 | 0.0000 | 292.5394 | 307.9490 | 307.9442 |
| IVF In Memory | 32.0 | 100% | 71.8535 | 0.9598 | 0.4167 | 0.5623 | 0.5151 |
| OnDisk Cache 100% | 32.0 | 100% | 72.3649 | 0.9599 | 0.8274 | 1.1236 | 1.0395 |
| OnDisk Cache 79% | 22.0 | 70% | 45.0266 | 0.9599 | 1.9900 | 4.4059 | 3.3568 |
| OnDisk Cache 60% | 16.7 | 55% | 38.3141 | 0.9599 | 2.3281 | 4.0063 | 3.5542 |

阅读建议：

- 在召回率接近（约 0.96）的情况下，缓存降低会显著减少内存占用，但尾延迟会上升。
- 当缓存覆盖接近 100% 时，`ivf_on_disk` 可以保持接近内存 IVF 的召回率，但延迟会有一定增加。
- 生产环境中建议持续观察命中率指标，用于反向调优 `ann_index_ivf_list_cache_limit`。

## 调优建议

1. 先复用 `ivf` 的 `nlist` / `ivf_nprobe` 基线参数启动测试。
2. 根据内存预算设置 `ann_index_ivf_list_cache_limit`，再观察命中率与延迟波动。
3. 若召回稳定但延迟抖动明显，优先提高缓存比例并复测命中情况。
4. 缓存比例变化后，再次联合调节 `ivf_nprobe`，平衡召回率与时延。
