---
{
    "title": "实用手册",
    "sidebar_label": "实用手册",
    "language": "zh-CN",
    "description": "Apache Doris 向量索引实战手册，覆盖建表、建索引、导入、构建、查询调优和常见问题排查。"
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

本文给出 Apache Doris 向量检索（ANN）的生产实践流程，覆盖从表设计到参数调优、问题排查的完整链路。

## 1. 适用范围

Apache Doris 4.x 支持 ANN 向量索引，常见场景包括：

- 语义搜索
- RAG 检索
- 推荐系统
- 图像或多模态检索
- 异常检测

支持的索引类型：

- `hnsw`：高召回、在线查询性能好
- `ivf`：构建更快、内存更省，适合大规模场景

支持的近似距离函数：

- `l2_distance_approximate`（`ORDER BY ... ASC`）
- `inner_product_approximate`（`ORDER BY ... DESC`）

## 2. 前置条件与限制

使用 ANN 索引前请确认：

1. Doris 版本：`>= 4.0.0`
2. 表模型：ANN 仅支持 `DUPLICATE KEY`
3. 向量列：必须为 `ARRAY<FLOAT> NOT NULL`
4. 维度一致：导入向量维度必须与索引 `dim` 一致

建表示例：

```sql
CREATE TABLE document_vectors (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

## 3. 端到端操作流程

### Step 1：创建向量表

常用两种方式：

1. 建表时直接定义 ANN 索引。
   - 数据写入时同步建索引。
   - 导入完成即可查询。
   - 导入速度通常更慢。
2. 先建表导入数据，再 `CREATE INDEX` + `BUILD INDEX`。
   - 更适合批量导入。
   - 对 compaction 和构建时机控制更灵活。

示例（建表时定义索引）：

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

### Step 2：配置向量索引

通用参数：

- `index_type`：`hnsw` 或 `ivf`
- `metric_type`：`l2_distance` 或 `inner_product`
- `dim`：向量维度
- `quantizer`：`flat`、`sq8`、`sq4`、`pq`（可选）

HNSW 参数：

- `max_degree`（默认 `32`）
- `ef_construction`（默认 `40`）

IVF 参数：

- `nlist`（默认 `1024`）

示例：

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

批量场景建议顺序：

1. 建表（暂不构建索引）
2. 批量导入（Stream Load / S3 TVF / SDK）
3. 统一构建索引

生产环境建议优先使用批量导入方式。

### Step 4：构建索引与监控

如果索引是后建方式，需要手动执行：

```sql
BUILD INDEX idx_embedding ON document_vectors;
SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

状态包括：`PENDING`、`RUNNING`、`FINISHED`、`CANCELLED`。

## 4. 查询模式

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

### 带过滤条件搜索

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

Doris 在混合过滤场景中采用 pre-filtering，有助于兼顾性能和召回。

## 5. 调优清单

### 查询参数

- HNSW：`hnsw_ef_search`（越大通常召回更高，延迟也更高）
- IVF：`nprobe`（或 `ivf_nprobe`，视版本而定）

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### 构建建议

1. 大规模数据建议先 compaction 再做最终索引构建。
2. 控制 segment 规模，避免过大影响召回。
3. 在同一数据集上对多组参数做 A/B 压测。

容量规划可参考 [ANN 资源评估指南](./resource-estimation.md)。

## 6. 索引管理

常用管理 SQL：

```sql
SHOW INDEX FROM document_vectors;
SHOW DATA ALL FROM document_vectors;
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

如需调整参数，建议删除旧索引后重建。

## 7. 常见问题排查

### 索引未生效

检查：

1. 是否存在索引：`SHOW INDEX`
2. 是否构建完成：`SHOW BUILD INDEX`
3. 是否使用了 `_approximate` 距离函数

### 召回率低

排查方向：

- HNSW 参数（`max_degree`、`ef_construction`、`hnsw_ef_search`）
- IVF 探测参数（`nprobe`/`ivf_nprobe`）
- Segment 大小及 compaction 后重建

### 查询延迟高

排查方向：

- 冷查询与热查询差异（索引加载）
- `hnsw_ef_search` 是否过大
- 并行扫描设置是否开启
- BE 是否存在内存压力

### 导入失败

常见原因：

- 维度不一致（`dim` 与实际向量）
- 向量列出现 NULL
- 向量数组格式非法

## 8. 混合检索建议

可在同一张表中同时建立 ANN 索引和倒排索引，结合文本过滤与向量排序实现混合检索，这也是 RAG 线上常见模式。
