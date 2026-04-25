---
{
    "title": "向量量化算法调研与选型",
    "sidebar_label": "量化算法调研",
    "language": "zh-CN",
    "description": "面向 Doris ANN 的向量量化调研总结，覆盖 SQ、PQ 与选型建议。"
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

本文从科普与工程实践的角度介绍常见向量量化算法，并结合 Apache Doris 的 ANN 使用场景给出选型建议。

## 为什么需要向量量化

在 ANN 场景下（尤其是 HNSW），索引常常受内存约束。量化的核心是把 float32 等高精度向量编码成低精度表示，在可接受的召回损失下换取更低内存占用。

在 Doris 中，ANN 索引通过 `quantizer` 控制量化方式：
- `flat`：不量化（质量最高，内存最高）
- `sq8`：8bit 标量量化
- `sq4`：4bit 标量量化
- `pq`：乘积量化

示例（HNSW + quantizer）：

```sql
CREATE TABLE vector_tbl (
  id BIGINT,
  embedding ARRAY<FLOAT>,
  INDEX ann_idx (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "quantizer" = "sq8"
  )
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "3");
```

## 算法概览

| 方法 | 核心思想 | 典型收益 | 主要代价 |
|---|---|---|---|
| SQ（标量量化） | 每个维度独立量化 | 内存显著下降，实现简单 | 构建开销高于 FLAT；压缩越强召回越容易下降 |
| PQ（乘积量化） | 切分子向量并分组量化 | 常见场景下压缩与查询速度更平衡 | 训练/编码成本高，参数需要调优 |

Apache Doris 当前以优化过的 Faiss 作为 ANN 向量索引与检索的核心实现，因此下面关于 SQ/PQ 的机制说明可以直接映射到 Doris 的实际行为。

## 标量量化（SQ）

### 原理

SQ 不改变向量维度，只降低每维数值精度。

常见的 min-max 量化映射：
- `max_code = (1 << b) - 1`
- `scale = (max_val - min_val) / max_code`
- `code = round((x - min_val) / scale)`

Faiss 中 SQ 主要有两种：
- Uniform：所有维度共享一组 min/max。
- Non-uniform：每个维度单独统计 min/max。

当不同维度的数据范围差异很大时，Non-uniform 通常重建误差更小。

### 特点

- 优点：
  - 实现直接，行为稳定。
  - 压缩比可预期（相对 float32 值，`sq8` 约 4x，`sq4` 约 8x）。
- 局限：
  - 本质仍是固定步长分桶。
  - 若单维分布明显非均匀（例如长尾分布），误差会上升。

### Faiss 源码要点（SQ）

在 Doris 使用的优化版 Faiss 实现路径中，SQ 训练会先统计最小值/最大值，再按需要对范围做轻微扩展，降低后续 add 阶段越界风险。简化后形态如下：

```cpp
void train_Uniform(..., const float* x, std::vector<float>& trained) {
    trained.resize(2);
    float& vmin = trained[0];
    float& vmax = trained[1];
    // 扫描样本得到 min/max
    // 再根据 rs_arg 做范围扩展
}
```

对于 non-uniform SQ，Faiss 会按维度分别统计（而不是全局一组范围），因此在“各维度数值尺度差异明显”的数据上通常效果更好。

### 实践观察

在内部 128D/256D 的 HNSW 测试中：
- `sq8` 的召回通常明显好于 `sq4`。
- SQ 的构建/编码时间显著高于 FLAT。
- `sq8` 查询延迟变化通常不大，`sq4` 的召回下滑更明显。

以下柱状图基于示例 benchmark 数据绘制：

![SQ 构建耗时 vs 行数（128D）](/images/vector-search/quantization-survey/sq-build-time-vs-rows.png)

![SQ 内存占用 vs 行数（128D）](/images/vector-search/quantization-survey/sq-memory-usage-vs-rows.png)

## 乘积量化（PQ）

### 原理

PQ 将 `D` 维向量切分成 `M` 个子向量（每个子向量 `D/M` 维），在每个子空间做 k-means 量化。

关键参数：
- `pq_m`：子量化器个数
- `pq_nbits`：每个子向量编码位数

通常 `pq_m` 越大，精度越好，但训练和编码代价越高。

### 为什么 PQ 查询可能更快

PQ 可使用 LUT（查找表）做距离近似：
- 预先计算查询子向量到各子空间质心的距离。
- 查询时通过查表并累加估算整体距离。

这可以避免完整重建，在很多场景下降低搜索阶段 CPU 开销。

### Faiss 源码要点（PQ）

在同一实现路径下，Faiss 的 `ProductQuantizer` 会在子空间上训练码本，并把质心存储在连续内存中。简化后形态如下：

```cpp
void ProductQuantizer::train(size_t n, const float* x) {
    Clustering clus(dsub, ksub, cp);
    IndexFlatL2 index(dsub);
    clus.train(n * M, x, index);
    for (int m = 0; m < M; m++) {
        set_params(clus.centroids.data(), m);
    }
}
```

其质心布局可理解为 `(M, ksub, dsub)`：
- `M`：子量化器个数；
- `ksub`：每个子空间的码本大小（`2^pq_nbits`）；
- `dsub`：子向量维度（`D / M`）。

### 实践观察

在相同内部测试中：
- PQ 对压缩的正向收益明显。
- PQ 的训练/编码开销较高。
- 相比 SQ，PQ 往往能借助 LUT 在查询阶段获得更好的速度表现，但召回与构建成本仍依赖数据分布与参数组合。

以下柱状图基于示例 benchmark 数据绘制：

![PQ 磁盘索引大小 vs 行数（128D/256D）](/images/vector-search/quantization-survey/pq-index-size-on-disk-vs-rows.png)

![PQ 构建耗时 vs 行数（128D/256D）](/images/vector-search/quantization-survey/pq-build-time-vs-rows.png)

![PQ 查询耗时 vs 行数（128D/256D）](/images/vector-search/quantization-survey/pq-search-time-vs-rows.png)

## Doris 选型建议

可按以下顺序落地：

1. 内存充足且召回优先：`flat`。
2. 希望低风险降内存且质量更稳：`sq8`。
3. 内存压力极大且可接受更低召回：`sq4`。
4. 追求压缩与性能平衡并接受调参：`pq`。

建议的验证流程：

1. 先以 `flat` 建基线。
2. 优先测试 `sq8`，对比 Recall 与 P95/P99 延迟。
3. 内存仍不够时测试 `pq`（可先从 `pq_m = D/2` 起步）。
4. 仅在“内存优先于召回”时考虑 `sq4`。

## 压测注意事项

- 绝对耗时与硬件、线程数、数据集强相关。
- 横向对比时应固定：
  - 向量维度，
  - 索引参数，
  - segment 规模，
  - 查询集与真值集。
- 评估指标建议同时覆盖：
  - Recall@K，
  - 索引体积，
  - 构建耗时，
  - 查询延迟。

## 相关文档

- [向量搜索概述](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN 资源评估指南](./resource-estimation.md)
