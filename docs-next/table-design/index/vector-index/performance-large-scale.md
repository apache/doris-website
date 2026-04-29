---
{
    "title": "大规模性能实测",
    "language": "zh-CN",
    "description": "总结 Doris ANN Index 在单机与分布式环境下的大规模导入与查询性能测试结果。"
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

本文总结了在单机和分布式两种部署下的大规模测试结果。测试的目的，是展示 Doris 在不同数据规模下的查询表现，以及在数据规模持续增长时，如何将向量查询能力从单机扩展到分布式部署。

## 测试矩阵

- 单机：FE / BE 分离部署，BE 使用 1 台 16C64GB 机器。
- 分布式：3 台 BE，每台 16C64GB。
- 测试数据集：
  - Performance768D10M
  - Performance1536D5M
  - Performance768D100M

## 单机实测（16C64GB）

单机结果给出了中大规模数据集上的 ANN 查询性能基线。

### 导入性能

| 项目 | Performance768D10M | Performance1536D5M |
|------|---------------------|--------------------|
| 向量维度 | 768 | 1536 |
| metric_type | inner_product | inner_product |
| 数据量 | 10M 行 | 5M 行 |
| 导入 batch 参数 | `NUM_PER_BATCH=500000`<br/>`--stream-load-rows-per-batch 500000` | `NUM_PER_BATCH=250000`<br/>`--stream-load-rows-per-batch 250000` |
| 导入耗时 | 76m41s | 41m |
| `show data all` | 56.498 GB (25.354 GB + 31.145 GB) | 55.223 GB (25.346 GB + 29.878 GB) |

Performance768D10M 导入过程中的 CPU 监控如下。可以看到，导入期间 CPU 使用率整体较为平稳。

<img src="/images/vector-search/Performance768D-CPU-Import.png" alt="Performance768D10M import CPU" width="900" height="435" />

Performance1536D5M 的数据量较小，导入时的 batch size 也更小，因此导入阶段的 CPU 使用率波动更为频繁。

<img src="/images/vector-search/Performance1536D5M-CPU-Import.png" alt="Performance1536D5M import CPU" width="900" height="432" />

### 查询性能

从两个单机 workload 的结果可以看到，Doris 在保持较高召回率的同时，能够达到数百 QPS，并维持较低查询延迟。

#### 汇总

| 数据集 | BestQPS | Recall@100 |
|--------|---------|------------|
| Performance768D10M | 481.9356 | 0.9207 |
| Performance1536D5M | 414.7342 | 0.9677 |

#### Performance768D10M（`inner_product`, 10M 行）

| 并发数 | QPS | P95 延迟 | P99 延迟 | 平均延迟 |
|--------|-----|----------|----------|----------|
| 10 | 116.2000 | 0.0932 | 0.0933 | 0.0861 |
| 40 | 455.9485 | 0.1102 | 0.1225 | 0.0877 |
| 80 | 481.9356 | 0.2331 | 0.2674 | 0.1658 |

#### Performance1536D5M（`inner_product`, 5M 行）

| 并发数 | QPS | P95 延迟 | P99 延迟 | 平均延迟 |
|--------|-----|----------|----------|----------|
| 10 | 144.3221 | 0.0764 | 0.0800 | 0.0693 |
| 40 | 401.9732 | 0.1271 | 0.1404 | 0.0994 |
| 80 | 414.7342 | 0.2772 | 0.3222 | 0.1925 |

在单机查询场景下，冷查询阶段需要将索引加载到内存，因此 CPU 利用率相对较低，系统主要在等待 IO 完成；进入热查询阶段后，CPU 利用率明显提升并接近 100%。

<img src="/images/vector-search/Performance768D10M.png" alt="Performance768D10M query CPU" width="900" height="430" />

## 分布式实测（3 × 16C64GB）

分布式测试聚焦于更大规模的数据集，该数据规模已经超出单台 16C64GB 机器较为合适的内存承载范围。

3BE 场景使用 `Performance768D100M` 数据集。由于单机内存上限为 64GB，采用向量量化压缩以降低内存开销。该测试的重点，是展示 Doris 在 100M 规模下如何通过多 BE 部署继续提供向量查询能力，而不是与单机小规模场景做一一对应的绝对数值比较。

### 导入性能

| 项目 | 数值 |
|------|------|
| 数据集 | Performance768D100M |
| 数据量 | 100M 行 |
| 维度 | 768 |
| batch 参数 | `NUM_PER_BATCH=500000`<br/>`--stream-load-rows-per-batch 500000` |
| 索引参数 | `"dim"="768", "index_type"="hnsw", "metric_type"="l2_distance", "pq_m"="384", "pq_nbits"="8", "quantizer"="pq"` |
| build index 用时 | 4h5min |
| `show data all` | 198.809 GB (137.259 GB + 61.550 GB) |

build index 后的数据分布：

- 3 个 bucket
- 每个 bucket 34 个 rowset，每个 rowset 约 1.99 GB
- 每个 rowset 6 个 segment

build index 期间 CPU 使用率整体稳定在约 50%，说明构建过程未长时间打满 CPU，仍保留了一定资源余量。

<img src="/images/vector-search/Performance-3BE-Import.jpg" alt="Performance768D100M import CPU" width="900" height="444" />

### 查询性能

#### 汇总

| 指标 | 数值 |
|------|------|
| BestQPS | 77.6247 |
| Recall@100 | 0.9294 |

#### 明细（`l2_distance`, 100M 行）

| 并发数 | QPS | P95 延迟 | P99 延迟 | 平均延迟 |
|--------|-----|----------|----------|----------|
| 10 | 46.5836 | 0.2628 | 0.2791 | 0.2145 |
| 20 | 75.3579 | 0.3251 | 0.3541 | 0.2651 |
| 30 | 77.6247 | 0.5222 | 0.5766 | 0.3860 |
| 40 | 76.6313 | 0.7089 | 0.7854 | 0.5212 |

下图为查询阶段的 CPU 监控，可以看到各节点 CPU 使用率保持在较高水平，说明查询负载较充分地利用了分布式计算资源。

<img src="/images/vector-search/Performance3BE.png" alt="Performance768D100M query CPU" width="900" height="323" />

## 总结

- 在千万级向量数据规模下，Doris 在单机场景能够提供较强的 ANN 查询性能，达到数百 QPS，并保持较高召回率。
- 在 100M 向量数据集上，Doris 可通过多 BE 部署继续提供在线向量查询能力。
- 由于不同测试组采用了不同的数据规模、距离度量和索引参数，这些结果更适合用于观察规模扩展表现，而不适合做一一对应的绝对数值对比。

## 说明

- 两组测试的距离度量不同（`inner_product` 与 `l2_distance`），不建议直接横向对比绝对数值。
- 单机 `Performance768D10M` 在并发 10 下的结果已剔除冷查询影响后进行修正。

## 复现方式

单机：

```bash
export NUM_PER_BATCH=500000
vectordbbench doris ... --case-type Performance768D10M --stream-load-rows-per-batch 500000

export NUM_PER_BATCH=250000
vectordbbench doris ... --case-type Performance1536D5M --stream-load-rows-per-batch 250000
```

分布式 3BE：

```bash
export NUM_PER_BATCH=500000
vectordbbench doris ... --case-type Performance768D100M --stream-load-rows-per-batch 500000
```
