---
{
    "title": "PQ On-Disk",
    "language": "zh-CN",
    "description": "PQ On-Disk 是 Apache Doris 面向过滤后小候选集向量重排场景提供的 ANN 索引形态，通过将 PQ codes 存储在磁盘并配合专用 chunk cache，在低内存占用下实现更高效的近似重排。"
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

# Apache Doris 中的 PQ On-Disk

`pq_on_disk` 是 Doris 面向过滤后小候选集重排场景提供的 ANN 索引类型。它将 PQ codes 按 rowid 顺序存储在磁盘上，只将 PQ codebook 常驻内存，并仅对已经通过标量过滤的候选行计算近似距离。

与 `ivf`、`ivf_on_disk` 不同，`pq_on_disk` 不是一个面向全局召回的 ANN 结构。它更适合这类查询：`WHERE user_id = ? ORDER BY l2_distance_approximate(...) LIMIT N`。也就是先用过滤条件把候选集缩小，再对这个较小的候选集做快速近似向量重排。

## 为什么需要 PQ On-Disk

有些向量检索场景并不需要 ANN 在整个 segment 上做全局搜索，而是先通过 `user_id`、`tag` 或倒排索引等普通过滤条件把候选行缩小到较小范围，然后才需要在这个过滤后的子集内做 Top-N 向量排序。

`pq_on_disk` 就是为这种工作模式设计的：

- 面向过滤后的候选集，典型规模是几千到几万行。
- 通过将 PQ codes 存储在磁盘上，降低常驻内存占用。
- 继续复用 Doris 现有的 SQL 距离函数和 ANN DDL。
- 当候选集已经比较明确时，避免维护全局 IVF 或图结构带来的额外开销。

## 对用户的价值

与 Doris 中其他 ANN 索引相比，`pq_on_disk` 解决的是另一类问题：

- `hnsw` 和 `ivf` 更适合在大规模向量集合上做全局 ANN 召回。
- `ivf_on_disk` 保留 IVF 的召回模型，只是把 IVF list 主体放到磁盘以节省内存。
- `pq_on_disk` 则聚焦在过滤后小候选集上的近似重排。

它适合以下场景：

- 查询几乎总是带有高选择性的标量过滤条件。
- 相同过滤键对应的行具有较好的物理局部性。
- 即使候选集已经被过滤缩小，暴力计算距离仍然开销较大。
- 希望比内存型 ANN 结构有更低的常驻内存占用。

## 用户接口

### 1）建索引 DDL

通过 `index_type="pq_on_disk"` 创建 ANN 索引。

```sql
CREATE TABLE image_pool (
  user_id BIGINT NOT NULL,
  photo_id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type" = "pq_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "pq_m" = "96",
    "pq_nbits" = "8"
  )
) ENGINE=OLAP
DUPLICATE KEY(user_id, photo_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

说明：

- `metric_type` 支持 `l2_distance` 和 `inner_product`。
- `dim` 为必填参数。
- `pq_m` 为必填参数。
- `dim` 必须能够被 `pq_m` 整除。
- `pq_nbits` 为可选参数，默认值为 `8`。
- 查询语法保持不变，仍使用 `l2_distance_approximate` 和 `inner_product_approximate`。

### 2）典型查询模式

过滤后的 Top-N 重排：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY l2_distance_approximate(embedding, [0.12, 0.44, 0.33 /* ... */])
LIMIT 20;
```

如果使用内积，相应地按降序排序：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY inner_product_approximate(embedding, [0.12, 0.44, 0.33 /* ... */]) DESC
LIMIT 20;
```

也支持 range search：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
  AND l2_distance_approximate(embedding, [0.12, 0.44, 0.33 /* ... */]) < 5.0
ORDER BY photo_id;
```

`pq_on_disk` 最重要的使用特征，就是它本身就是为“带过滤条件的向量重排”设计的，这一点和 `ivf_on_disk` 有明显区别。

### 3）BE 缓存配置

`pq_on_disk` 使用专用的 PQ chunk cache：

- `ann_index_pq_chunk_cache_limit`（默认：`60%`）
- `ann_index_pq_chunk_cache_stale_sweep_time_sec`（默认：`1800`）

其中 `ann_index_pq_chunk_cache_limit` 的百分比基准是 BE 进程可用内存（受 `mem_limit` 约束），不是整机物理内存。

## 参数与约束

### 索引参数

| 属性 | 是否必填 | 默认值 | 说明 |
|---|---|---|---|
| `index_type` | 是 | - | 必须为 `pq_on_disk`。 |
| `metric_type` | 是 | - | `l2_distance` 或 `inner_product`。 |
| `dim` | 是 | - | 向量维度。 |
| `pq_m` | 是 | - | PQ 子量化器数量，必须整除 `dim`。 |
| `pq_nbits` | 否 | `8` | 每个子量化器编码使用的 bit 数。 |

### 训练行为

`pq_on_disk` 需要足够的数据来训练 PQ codebook。最小训练行数公式为：

```text
(1 << pq_nbits) * 100
```

例如：

- `pq_nbits = 8` 时，至少需要 `25600` 行训练数据。
- `pq_nbits = 4` 时，至少需要 `1600` 行训练数据。

如果某个 segment 的数据量不足以训练 PQ 索引，Doris 可能会对该 segment 回退到暴力搜索。

## 可观测性

`pq_on_disk` 引入了专用的 BE 缓存 `AnnIndexPqChunkCache`。

排查性能问题时，建议优先确认两件事：

- 查询是否真的具有足够高的过滤选择性。
- PQ chunk cache 是否足够大，能够避免热点候选区间被重复从磁盘读取。

## 使用说明

- `pq_on_disk` 更适合“先过滤，再向量重排”的场景，不适合替代全局 ANN 召回索引。
- 它与 Doris 现有 ANN 索引共享通用约束，例如向量列类型和 ANN 表达式的使用方式。
- 它支持 `l2_distance` 和 `inner_product` 两种度量，也支持 Top-N 与 range search 风格的查询。
- 查询结果的排序方向需要与度量语义一致：`l2_distance_approximate` 用升序，`inner_product_approximate` 用降序。
- 数据局部性很重要。如果相同过滤键对应的行在物理上更连续，`pq_on_disk` 读取 PQ codes 时就更容易形成顺序 I/O。
- 对于非常小的 segment 或训练数据不足的 segment，索引可能不会被真正构建，查询会回退到暴力搜索。

## 最佳实践

1. 当查询模式主要是“先过滤，后重排”时，优先考虑 `pq_on_disk`。
2. 让过滤列尽可能具有较高选择性。过滤后的候选集越小，`pq_on_disk` 越能发挥优势。
3. 选择 `pq_m` 时，先确保 `dim / pq_m` 合理，并尽量与现有 PQ 经验保持一致。
4. 除非明确需要用更小 code size 换取更低精度，否则建议先从 `pq_nbits = 8` 开始。
5. 联合观察缓存效果和查询延迟。如果同类过滤查询仍然频繁触发磁盘 I/O，可以提高 `ann_index_pq_chunk_cache_limit` 后重新测试。
6. 在正式上线前，务必基于真实业务数据验证召回质量，尤其要关注真实过滤分布下的效果。

## 如何在 `ivf_on_disk` 和 `pq_on_disk` 之间选择

以下场景更适合 `ivf_on_disk`：

- 需要在大规模全局向量集合上做 ANN 搜索。
- 主要调优模型仍然是 `nlist` 和 `nprobe`。
- 查询性能依赖于 IVF list 的探测与召回。

以下场景更适合 `pq_on_disk`：

- 查询本身已经带有高选择性的标量过滤条件。
- 过滤后的候选集规模相对较小。
- 主要需求是在过滤后的候选行中做快速近似重排，而不是做全局 ANN 召回。

可以简单理解为：`ivf_on_disk` 是磁盘化的全局 ANN 索引，而 `pq_on_disk` 是磁盘化的过滤后近似重排索引。
