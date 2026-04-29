---
{
    "title": "PQ On-Disk",
    "language": "zh-CN",
    "description": "PQ On-Disk 是 Apache Doris 面向过滤优先向量检索场景提供的向量索引形态，特别适用于多租户检索：通过在过滤后的候选集上使用 PQ 编码向量加速暴力距离计算，在较低内存占用下获得更稳定的效果。"
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

`pq_on_disk` 是 Apache Doris 面向**过滤优先（filter-first）向量检索**场景提供的一种向量索引模式。它将 Product Quantization（PQ）编码后的向量存储在磁盘上，仅将 PQ codebook 和热点 chunk 保留在内存中，并在标量过滤完成后，利用压缩后的向量加速过滤结果上的暴力距离计算。

这个特性尤其适合**多租户向量检索**。在很多 SaaS 类业务中，不同租户的向量会被写入同一个 segment。如果直接在这些混合数据上构建全局 `hnsw` 或 `ivf` 索引，再执行 `WHERE tenant_id = ?` 这类查询，召回率往往会明显下降，因为全局召回结构是基于所有租户的混合数据构建的，而不是针对某一个租户的局部子集。`pq_on_disk` 不依赖这样的全局跨租户召回结构，而是先按租户过滤，再在过滤后的子集上通过 PQ 编码向量加速排序，因此更适合多租户场景。

## 适用场景

当查询模式通常是下面这样时，优先考虑 `pq_on_disk`：

```sql
WHERE <高选择性过滤条件>
ORDER BY l2_distance_approximate(...) LIMIT N
```

常见例子包括：

- `WHERE tenant_id = ?`
- `WHERE user_id = ?`
- `WHERE category_id = ? AND status = 'active'`
- `WHERE tag MATCH_ANY '...'
  ORDER BY l2_distance_approximate(...) LIMIT N`

这和全局 ANN 的目标不同：

- `hnsw` 和 `ivf` 更适合在大规模向量集合上做**全局 ANN 召回**。
- `ivf_on_disk` 仍然保留 IVF 的全局召回模型，只是将主要索引数据落盘以降低内存压力。
- `pq_on_disk` 聚焦的是**过滤后子集上的向量重排**，即候选集已经被普通谓词显著缩小，Doris 只需要更快地对这些候选行做向量打分。

## 为什么它适合多租户检索

假设一个 segment 中混合存储了 10,000 个租户的向量。如果在这些数据上构建全局 HNSW 或 IVF 索引，而查询是：

```sql
SELECT doc_id
FROM tenant_embeddings
WHERE tenant_id = 10001
ORDER BY l2_distance_approximate(embedding, <query_vector>)
LIMIT 20;
```

这个查询只关心某一个租户的数据，但全局 ANN 结构的训练、聚类或图连接都基于所有租户的混合向量。对于“全局召回”有效的图路径、邻接关系或 IVF 分桶，并不一定适合“租户过滤之后”的局部召回，因此很容易出现指定租户后召回率下降的问题。

`pq_on_disk` 的处理方式不同：

1. Doris 先执行 `tenant_id = 10001` 这样的标量过滤。
2. 得到该租户对应的候选集。
3. 不再依赖全局 ANN 结构在这个子集内做召回，而是使用 PQ 编码向量更快地计算这些候选行的距离。
4. PQ code 按 rowid 顺序存储在磁盘，并通过专用 chunk cache 做复用。

因此，当满足以下条件时，`pq_on_disk` 往往比全局 ANN 结构更合适：

- 过滤条件具有高选择性；
- 租户过滤后的召回稳定性比全局 ANN 更重要；
- 原始 float32 向量上的暴力距离计算仍然代价较高。

## 快速开始

### 建表

下面的例子使用 `tenant_id` 作为主过滤列：

```sql
CREATE TABLE tenant_embeddings (
  tenant_id BIGINT NOT NULL,
  doc_id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_embedding (embedding) USING ANN PROPERTIES (
    "index_type" = "pq_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "pq_m" = "96",
    "pq_nbits" = "8"
  )
) ENGINE=OLAP
DUPLICATE KEY(tenant_id, doc_id)
DISTRIBUTED BY HASH(tenant_id) BUCKETS 8
PROPERTIES (
  "replication_num" = "1"
);
```

### 基础查询

```sql
SELECT doc_id,
       l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) AS score
FROM tenant_embeddings
WHERE tenant_id = 10001
ORDER BY score ASC
LIMIT 20;
```

这正是 `pq_on_disk` 的核心目标场景：先过滤，再在过滤后的结果里执行高效的 Top-N 向量排序。

## 工作原理

从实现角度看，`pq_on_disk` 的执行过程大致如下：

1. Doris 为 segment 训练 PQ codebook。
2. 原始向量被编码为紧凑的 PQ codes。
3. PQ codes 按 rowid 顺序写入磁盘。
4. 查询时，Doris 先计算普通谓词过滤。
5. 对于通过过滤的行，再加载对应的 PQ chunk，并基于 PQ code 计算近似距离，而不是直接对原始 float32 向量做全量暴力计算。

因此，`pq_on_disk` 更适合被理解为**基于 PQ 的过滤后暴力计算加速**，而不是像 HNSW / IVF 那样的全局召回结构。

## 用户接口

### 1）索引 DDL

通过 `index_type="pq_on_disk"` 创建索引：

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

### 2）典型查询模式

过滤后的 Top-N：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) ASC
LIMIT 20;
```

Prepared Statement 风格查询：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = ?
ORDER BY l2_distance_approximate(embedding, CAST(? AS ARRAY<FLOAT>)) ASC
LIMIT 20;
```

如果使用内积，则按降序排序：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY inner_product_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) DESC
LIMIT 20;
```

也支持 range search：

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
  AND l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) < 500.0
ORDER BY photo_id;
```

## 参数与约束

### 索引参数

| 属性 | 是否必填 | 默认值 | 说明 |
|---|---|---|---|
| `index_type` | 是 | - | 必须为 `pq_on_disk`。 |
| `metric_type` | 是 | - | `l2_distance` 或 `inner_product`。 |
| `dim` | 是 | - | 向量维度。 |
| `pq_m` | 是 | - | PQ 子量化器数量，必须能整除 `dim`。 |
| `pq_nbits` | 否 | `8` | 每个子量化编码的 bit 数。 |

### 训练要求

`pq_on_disk` 需要足够的行数来训练 PQ codebook。最小训练行数为：

```text
(1 << pq_nbits) * 100
```

例如：

- `pq_nbits = 8` 时，至少需要 `25600` 行训练数据；
- `pq_nbits = 4` 时，至少需要 `1600` 行训练数据。

如果某个 segment 的数据量不足以训练 PQ 索引，Doris 可能会对该 segment 回退为暴力搜索。

## BE 缓存配置

`pq_on_disk` 使用专用的 PQ chunk cache：

- `ann_index_pq_chunk_cache_limit`（默认：`60%`）
- `ann_index_pq_chunk_cache_stale_sweep_time_sec`（默认：`1800`）

其中 `ann_index_pq_chunk_cache_limit` 的百分比基准是 BE 进程可用内存（受 `mem_limit` 约束），不是整机物理内存。

## 可观测性

`pq_on_disk` 引入了专用 BE 缓存 `AnnIndexPqChunkCache`。

排查问题时，建议优先关注：

- 查询是否真的足够高选择性；
- 过滤后的行是否具备较好的物理局部性；
- PQ chunk cache 是否足够大，是否频繁发生重复磁盘读取；
- 某些 segment 是否因为训练数据不足而回退为暴力搜索。

## 使用说明

- `pq_on_disk` 面向的是**过滤优先**的向量检索，而不是对整个 segment 做全局 ANN 召回。
- 它尤其适合**多租户向量检索**，即多个租户的数据混合存储在同一个 segment 中的场景。
- 它同时支持 `l2_distance` 和 `inner_product`，也支持 Top-N 与 range search 风格的查询。
- 查询时排序方向要和度量语义一致：`l2_distance_approximate` 用升序，`inner_product_approximate` 用降序。
- 数据局部性非常重要。如果同一过滤键对应的数据在物理上更连续，PQ chunk 读取就更容易形成顺序 I/O。
- 对于非常小的 segment 或训练样本不足的 segment，Doris 可能不会真正构建 PQ 索引，而是回退为暴力搜索。

## 最佳实践

1. 当主要查询模式是**先过滤，后重排**时，优先考虑 `pq_on_disk`。
2. 对于 `WHERE tenant_id = ? ORDER BY ... LIMIT N` 这类**租户级检索**，优先评估 `pq_on_disk`。
3. 让过滤列尽可能保持高选择性。过滤后候选集越小，`pq_on_disk` 越能发挥优势。
4. 除非明确要用更小 code size 换取更低存储，否则建议从 `pq_nbits = 8` 开始。
5. 选择 `pq_m` 时，要结合向量维度、模型特征以及实际召回目标综合评估。
6. 对于 768 维及以上查询向量，建议使用 prepared statement，减少 SQL 解析开销。
7. 在上线前务必基于真实业务分布进行验证，尤其是在不同租户数据量差异较大时。

## 如何在 `hnsw`、`ivf_on_disk` 与 `pq_on_disk` 之间选择

以下场景更适合 `hnsw`：

- 需要高召回的全局 ANN 搜索；
- 查询延迟最优先，且内存资源足够。

以下场景更适合 `ivf_on_disk`：

- 仍然需要基于 IVF 的全局 ANN 召回模型；
- 内存有限，但查询仍然面向大规模全局向量集合。

以下场景更适合 `pq_on_disk`：

- 查询本身已经带有高选择性的标量过滤条件；
- 不同租户或不同用户的数据混合存储在同一个 segment 中；
- 指定租户或用户过滤后，全局 ANN 的召回效果不理想；
- 希望通过压缩向量来加速过滤后候选集上的暴力距离计算。

可以简单理解为：`pq_on_disk` 并不是替代所有 ANN 结构的统一方案，而是当主要问题变成**如何在过滤后的子集内高效完成向量重排**时，尤其是在多租户场景下，更合适的选择。