---
{
    "title": "向量索引实用手册",
    "sidebar_label": "实用手册",
    "language": "zh-CN",
    "description": "Apache Doris 向量索引（ANN）实战手册：建表、建索引、导入、查询、调优与排错的端到端操作指南。",
    "keywords": [
        "Doris 向量索引",
        "ANN 索引",
        "HNSW",
        "IVF",
        "向量检索",
        "vector search",
        "semantic search",
        "RAG",
        "cosine 相似度",
        "向量召回率",
        "BUILD INDEX"
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

<!-- 知识类型: 操作指南 / 端到端流程 -->
<!-- 适用场景: 上线向量检索 / 性能调优 / 故障排查 -->

本文面向需要在 Apache Doris 中落地向量检索（ANN）的用户，提供从表设计到查询调优、排错的完整操作链路。如果你正在评估如何把语义搜索、RAG 或推荐召回迁移到 Doris，可以按本文步骤直接执行。

## 快速导航

| 我想做什么 | 跳转章节 |
|---|---|
| 确认 Doris 版本与表模型是否满足要求 | [前置条件与限制](#前置条件与限制) |
| 选择 HNSW 还是 IVF 索引 | [适用场景与索引选型](#适用场景与索引选型) |
| 完整跑通建表→导入→查询流程 | [端到端操作流程](#端到端操作流程) |
| 用 cosine 相似度排序 | [使用 Cosine 相似度](#使用-cosine-相似度) |
| 调高召回率 / 降低延迟 | [查询与构建调优](#查询与构建调优) |
| 排查索引未生效 / 召回低 / 导入失败 | [常见问题排查](#常见问题排查) |

---

## 适用场景与索引选型

<!-- 知识类型: 架构选型决策 -->

Apache Doris 4.x 起支持 ANN（Approximate Nearest Neighbor，近似最近邻）向量索引，常见落地场景：

- 语义搜索（semantic search）
- RAG 检索增强
- 推荐系统召回
- 图像或多模态检索
- 异常检测

### 索引类型对比

| 索引类型 | 召回率 | 在线查询性能 | 构建速度 | 内存占用 | 适用场景 |
|---|---|---|---|---|---|
| `hnsw` | 高 | 好 | 慢 | 较高 | 在线低延迟检索 |
| `ivf` | 中 | 较好 | 快 | 较省 | 大规模数据集 |
| `ivf_on_disk` | 中 | 中 | 快 | 最省 | 超大规模、内存受限 |

### 支持的距离函数

| 函数 | 排序方向 | 说明 |
|---|---|---|
| `l2_distance_approximate` | `ORDER BY ... ASC` | 欧氏距离，距离越小越相似 |
| `inner_product_approximate` | `ORDER BY ... DESC` | 内积，值越大越相似 |

> Cosine 相似度不能直接通过 `metric_type="cosine"` 配置，需要通过向量归一化后使用 inner product 实现，详见 [使用 Cosine 相似度](#使用-cosine-相似度)。

---

## 前置条件与限制

<!-- 知识类型: 环境要求 -->
<!-- 适用场景: 部署前检查 -->

使用 ANN 索引前请确认以下条件：

| 检查项 | 要求 |
|---|---|
| Doris 版本 | `>= 4.0.0` |
| 表模型 | 仅支持 `DUPLICATE KEY` |
| 向量列类型 | `ARRAY<FLOAT> NOT NULL` |
| 维度一致性 | 写入向量维度必须与索引 `dim` 一致 |

最简建表示例：

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

---

## 端到端操作流程

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次落地向量检索 -->

完整流程包括 4 个步骤：建表 → 配置索引 → 导入数据 → 构建并监控索引。

### Step 1：创建向量表

建表有两种方式，根据数据规模与导入模式选择：

| 方式 | 优点 | 缺点 | 推荐场景 |
|---|---|---|---|
| 建表时直接定义 ANN 索引 | 写入即可查 | 导入更慢 | 小规模、流式写入 |
| 先建表导入数据，再 `CREATE INDEX` + `BUILD INDEX` | 导入快、构建时机可控 | 需要额外构建步骤 | 大规模批量导入 |

建表时直接定义 ANN 索引的示例：

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_embedding (embedding) USING ANN PROPERTIES (
        "index_type" = "hnsw",
        "metric_type" = "l2_distance",
        "dim" = "768"
    )
)
ENGINE = OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### Step 2：配置向量索引参数

<!-- 知识类型: 配置参数 -->

通用参数：

| 参数 | 取值 | 说明 |
|---|---|---|
| `index_type` | `hnsw` / `ivf` / `ivf_on_disk` | 索引类型 |
| `metric_type` | `l2_distance` / `inner_product` | 距离度量 |
| `dim` | 整数 | 向量维度 |
| `quantizer` | `flat` / `sq8` / `sq4` / `pq` | 量化方式（可选） |

HNSW 专属参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `max_degree` | `32` | 节点最大邻居数 |
| `ef_construction` | `40` | 构建期搜索宽度 |

IVF 专属参数（`ivf` 与 `ivf_on_disk` 共用）：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `nlist` | `1024` | 聚类中心数 |

后建索引示例：

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "max_degree" = "64",
    "ef_construction" = "128"
);
```

### Step 3：导入数据

批量导入推荐顺序：

1. 建表，**暂不构建索引**
2. 批量写入数据（Stream Load / S3 TVF / SDK）
3. 数据写入完成后统一构建索引

生产环境优先推荐该批量模式，可显著降低导入耗时。

### Step 4：构建索引并监控

如采用后建索引方式，需要手动触发：

```sql
BUILD INDEX idx_embedding ON document_vectors;

SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

构建状态包括：`PENDING`、`RUNNING`、`FINISHED`、`CANCELLED`。

---

## 查询模式

<!-- 知识类型: 操作示例 -->

### TopN 近邻搜索

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### 范围搜索

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### 带过滤条件的混合搜索

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

Doris 在混合过滤场景中采用 **pre-filtering** 策略，可同时兼顾性能和召回率。

---

## 使用 Cosine 相似度

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 业务指标为 cosine -->

ANN 索引不支持直接配置 `metric_type="cosine"`。如果业务需要按 cosine 相似度排序，请采用如下模式：

1. 数据写入前对向量做 L2 归一化（转为单位向量）
2. 建 ANN 索引时使用 `metric_type="inner_product"`
3. 查询时使用 `inner_product_approximate(...)`，并按 `ORDER BY ... DESC` 排序

**原理说明：**

- `cos(x, y) = (x · y) / (||x|| · ||y||)`
- 归一化后 `||x|| = ||y|| = 1`，因此 `cos(x, y) = x · y`

在单位向量空间中，cosine 排序与 inner product 排序等价。

---

## 查询与构建调优

<!-- 知识类型: 性能调优 -->
<!-- 适用场景: 召回率不达标 / 延迟过高 -->

### 查询参数

| 索引类型 | 调优参数 | 影响 |
|---|---|---|
| HNSW | `hnsw_ef_search` | 越大召回率越高，延迟也越高 |
| IVF | `nprobe` 或 `ivf_nprobe`（视版本而定） | 越大召回率越高 |

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### 构建建议

1. 大规模数据建议先做 compaction，再触发最终索引构建
2. 控制 segment 规模，避免过大影响召回
3. 在同一数据集上对多组参数进行 A/B 压测

### 容量评估

- 向量内存粗估公式：`dim * 4 bytes * row_count`
- 在此基础上叠加 ANN 索引结构开销
- 为非向量列与执行算子预留内存水位

10M / 100M 规模下单机与分布式的容量参考可见 [大规模性能测试](./performance-large-scale.md)。

---

## 索引管理

<!-- 知识类型: 操作命令 -->

常用管理 SQL：

```sql
-- 查看索引列表
SHOW INDEX FROM document_vectors;

-- 查看数据规模
SHOW DATA ALL FROM document_vectors;

-- 删除索引
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

如需调整索引参数，建议**删除旧索引后重建**。

---

## 常见问题排查

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: Troubleshooting -->

### 索引未生效

按顺序排查：

1. 索引是否存在：执行 `SHOW INDEX`
2. 索引是否构建完成：执行 `SHOW BUILD INDEX`
3. 查询是否使用了 `_approximate` 后缀的距离函数

### 召回率低

| 排查方向 | 处理建议 |
|---|---|
| HNSW 参数 | 调大 `max_degree`、`ef_construction`、`hnsw_ef_search` |
| IVF 探测参数 | 调大 `nprobe` / `ivf_nprobe` |
| Segment 规模 | compaction 后重建索引 |

### 查询延迟高

| 排查方向 | 处理建议 |
|---|---|
| 冷查询 vs 热查询 | 索引加载耗时差异，可在服务启动后预热 |
| `hnsw_ef_search` 过大 | 适当下调以降低延迟 |
| 并行扫描未开启 | 设置 `optimize_index_scan_parallelism = true` |
| BE 内存压力 | 检查 BE 内存水位与 GC 行为 |

### 导入失败

| 常见原因 | 处理建议 |
|---|---|
| 维度不一致 | 检查写入向量维度与索引 `dim` |
| 向量列出现 NULL | 业务侧补齐或过滤 NULL |
| 向量数组格式非法 | 校验 JSON / Stream Load payload 格式 |

---

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：ANN 索引能用在 UNIQUE KEY 或 AGGREGATE KEY 表上吗？**

不能。ANN 索引**仅支持 DUPLICATE KEY 模型**。

**Q2：可以同时建 ANN 索引和倒排索引吗？**

可以。在同一张表上建立 ANN 索引和倒排索引，结合文本过滤与向量排序，可实现 RAG 线上常见的**混合检索**模式。

**Q3：要使用 cosine 相似度怎么办？**

ANN 不支持 `metric_type="cosine"`。把向量归一化后用 `inner_product`，效果等价。详见 [使用 Cosine 相似度](#使用-cosine-相似度)。

**Q4：BUILD INDEX 卡在 RUNNING 怎么办？**

通过 `SHOW BUILD INDEX` 查看进度。大表构建本身耗时较长，先确认是否处于正常构建中；若长时间无进展，检查 BE 内存与磁盘状态。

**Q5：如何调整 ANN 索引的参数？**

ANN 索引参数不支持原地修改。建议**先 DROP INDEX，再用新参数 CREATE INDEX**，最后 BUILD INDEX。
