---
{
    "title": "向量搜索",
    "sidebar_label": "概述",
    "language": "zh-CN",
    "description": "在生成式 AI 的应用中，单纯依赖大模型自身的参数“记忆”存在明显局限：一方面，模型知识具有时效性，无法覆盖最新信息；另一方面，完全依赖模型直接“生成”容易产生幻觉（Hallucination）。因此，RAG（检索增强生成）应运而生。其核心目标不是让模型凭空构造答案，"
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

在生成式 AI 的应用中，单纯依赖大模型自身的参数“记忆”存在明显局限：一方面，模型知识具有时效性，无法覆盖最新信息；另一方面，完全依赖模型直接“生成”容易产生幻觉（Hallucination）。因此，RAG（检索增强生成）应运而生。其核心目标不是让模型凭空构造答案，而是从外部知识库中检索出与用户查询最相关的 Top-K 信息片段，作为生成依据。为实现这一点，需要一种机制衡量“用户查询”与“知识库文档”之间的语义相关性。向量表示正是常用手段：将查询与文档统一编码为语义向量后，可通过向量相似度衡量相关程度。随着预训练模型的发展，生成高质量语义向量已成主流，RAG 的检索阶段也演化为一个标准的向量相似度搜索问题——从大规模向量集合中找出与查询最相似的 K 个向量（候选知识片段）。需要注意，RAG 的向量检索不限于文本，也可扩展到多模态：图片、语音、视频等数据同样可以编码为向量供生成模型使用。例如，用户上传图片后，系统先检索相关描述或知识片段，再辅助生成解释性内容；在医学问答中，可检索病例资料与医学文献，生成更准确的诊断建议。
## 暴力搜索
Apache Doris 自 2.0 版本起支持基于向量距离的最近邻搜索，通过 SQL 实现向量搜索是一个自然且简单的过程。

```sql
SELECT id, l2_distance(embedding, [1.0, 2.0, xxx, 10.0]) AS distance
FROM   vector_table
ORDER  BY distance
LIMIT  10; 
```

当数据量不大（小于 100 万行）时，Apache Doris 的精确最近邻（K-Nearest Neighbor）搜索性能足以满足需求，可获得 100% 召回与 100% 精确。但随着数据进一步增长，用户通常愿意牺牲少量召回与精度以换取显著的查询加速，此时问题就转化为向量近似最近邻搜索（Approximate Nearest Neighbor，ANN）。

## 近似最近邻搜索

Apache Doris 自 4.0 版本开始正式支持 ANN 搜索。系统未引入额外数据类型，向量仍以定长数组存储；针对向量距离检索，我们基于 Faiss 实现了新的 ANN 索引类型。
以下以常见的 [SIFT](http://corpus-texmex.irisa.fr/) 数据集为例，建表示例如下：
```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="flat"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
- index_type: hnsw 表示使用 [Hierarchical Navigable Small World 算法](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)
- metric: l2_distance 表示使用 L2 距离作为距离函数
- dim: 128 表示向量维度为 128 
- quantizer: flat 表示按原始 float32 存储各维度


| 参数 | 是否必填 | 支持/可选值 | 默认值 | 说明 |
|------|----------|-------------|--------|------|
| `index_type` | 是 | 仅支持：hnsw | （无） | 指定所使用的 ANN 索引算法。当前只支持 HNSW。 |
| `metric_type` | 是 | `l2_distance`，`inner_product` | （无） | 指定向量相似度/距离度量方式。L2 为欧氏距离，inner_product 可用于余弦相似时需先归一化向量。 |
| `dim` | 是 | 正整数 (> 0) | （无） | 指定向量维度，后续导入的所有向量的维度必须与此一致，否则报错。 |
| `max_degree` | 否 | 正整数 | `32` | HNSW 图中单个节点的最大邻居数（M），影响索引内存与搜索性能。 |
| `ef_construction` | 否 | 正整数 | `40` | HNSW 构建阶段的候选队列大小（efConstruction），越大构图质量越好但构建更慢。 |
| `quantizer` | 否 | `flat`，`sq8`，`sq4`, `pq` | `flat` | 指定向量编码/量化方式：`flat` 为原始存储，`sq8`/`sq4` 为标量量化（8/4 bit）, `pq` 为乘积量化。 |
| `pq_m` | 'quantizer=pq' 时需要指定 | 正整数 | （无） | 指定将原始的高维向量分割成多少个子向量(向量维度 dim 必须能被 pq_m 整除)。 |
| `pq_nbits` | 'quantizer=pq' 时需要指定 | 正整数 | （无） | 指定每个子向量量化的比特数, 它决定了每个子空间码本的大小(k = 2 ^ pq_nbits), 在faiss中pq_nbits值一般要求不大于24。 |

通过 S3 TVF 导入数据：
```sql
INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");

select count(*) from sift_1M
--------------

+----------+
| count(*) |
+----------+
|  1000000 |
+----------+
```
使用 `l2_distance_approximate` / `inner_product_approximate` 会触发 ANN 索引路径。函数名必须与索引的 `metric_type` 完全匹配（例如：`metric_type=l2_distance` → 使用 `l2_distance_approximate`；`metric_type=inner_product` → 使用 `inner_product_approximate`）。排序规则：L2 距离使用升序（越小越近）；Inner Product 使用降序（越大越近）。

```sql
SELECT id,
       l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
       ) AS distance
FROM sift_1M
ORDER BY distance
LIMIT 10;
--------------

+--------+----------+
| id     | distance |
+--------+----------+
| 178811 | 210.1595 |
| 177646 | 217.0161 |
| 181997 | 218.5406 |
| 181605 | 219.2989 |
| 821938 | 221.7228 |
| 807785 | 226.7135 |
| 716433 | 227.3148 |
| 358802 | 230.7314 |
| 803100 | 230.9112 |
| 866737 | 231.6441 |
+--------+----------+
10 rows in set (0.02 sec)
```
要与精确的真实结果进行比较，请使用 `l2_distance` 或 `inner_product`（不带 `_approximate` 后缀）。在此示例中，精确搜索耗时约 290 毫秒：
```
10 rows in set (0.29 sec)
```

使用 ANN 索引后，查询延迟从约 290 毫秒降至约 20 毫秒。

ANN 索引以 segment 为粒度构建。在分布式表中，每个 segment 返回其本地 TopN 结果；然后 TopN 算子在 tablet 和 segment 之间合并结果以产生全局 TopN。

排序说明：
- 对于 `metric_type = l2_distance`，距离越小表示向量越接近 → 使用 `ORDER BY dist ASC`。
- 对于 `metric_type = inner_product`，数值越大表示向量越接近 → 使用 `ORDER BY dist DESC` 通过索引获取 TopN。

## 近似范围搜索

除了常见的 TopN 最近邻搜索（即返回与目标向量最近的前 N 条记录）之外，向量检索中还有一类常见的查询方式是 基于距离阈值的范围搜索。
这类查询不返回固定数量，而是找出所有与目标向量距离满足条件的数据点。例如：查找距离大于或小于某阈值的向量。范围搜索在需要“足够相似”或“足够不相似”候选集的场景中很有用：推荐系统中可获取“接近但不完全相同”内容以增加多样性；异常检测中可定位远离正常模式的数据点。

一个典型的 SQL 为：

```sql
SELECT count(*)
FROM   sift_1M
WHERE  l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300 
--------------

+----------+
| count(*) |
+----------+
|   999271 |
+----------+
1 row in set (0.19 sec)
```
在 Doris 中，这类基于范围的向量搜索同样通过 ANN 索引 来加速执行。通过 ANN 索引，系统能够快速筛选出候选向量集合，然后再计算精确的近似距离，从而显著降低计算开销、提升查询效率。目前支持的范围查询条件包括 `>, >=, <, <=`。
## 组合搜索
Compound Search 指在同一条 SQL 中同时进行 ANN TopN 与 Range 条件过滤，返回满足范围约束的 TopN。

```sql
SELECT id,
       l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as dist
FROM sift_1M
WHERE l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300
ORDER BY dist limit 10
--------------

+--------+----------+
| id     | dist     |
+--------+----------+
| 243590 |  300.005 |
| 549298 | 300.0317 |
| 429685 | 300.0533 |
| 690172 | 300.0916 |
| 123410 | 300.1333 |
| 232540 | 300.1649 |
| 547696 | 300.2066 |
| 855437 | 300.2782 |
| 589017 | 300.3048 |
| 930696 | 300.3381 |
+--------+----------+
10 rows in set (0.12 sec)
```
对于 Compound Search，一个关键点是谓词过滤与 TopN 的执行顺序：若先做谓词过滤再在剩余集合上取 TopN，称为“前过滤”；反之为“后过滤”。后过滤通常更快，但可能显著降低召回，因此 Doris 采用前过滤策略。
在 Doris 中，Compound Search 的两个阶段均可通过索引加速。但在某些场景（如第一阶段 Range 过滤率极高）双阶段同时使用索引可能导致召回下降。Doris 会自适应判断是否对两阶段均使用索引，依据谓词过滤率与索引类型综合决策。
## 带过滤条件的 ANN 搜索
带过滤条件的 ANN 搜索是指在执行 ANN TopN 之前先应用其他谓词过滤，返回满足条件的 TopN。
下面用一个 8 维示例说明混合搜索流程。

```sql
CREATE TABLE ann_with_fulltext (
  id int NOT NULL,
  embedding array<float> NOT NULL,
  comment String NOT NULL,
  value int NULL,
  INDEX idx_comment(`comment`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for comment',
  INDEX ann_embedding(`embedding`) USING ANN PROPERTIES("index_type"="hnsw","metric_type"="l2_distance","dim"="8")
) DUPLICATE KEY (`id`) 
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO ann_with_fulltext VALUES
(1, [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8], 'this is about music', 10),
(2, [0.2,0.1,0.5,0.3,0.9,0.4,0.7,0.1], 'sports news today',   20),
(3, [0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2], 'latest music trend',  30),
(4, [0.05,0.06,0.07,0.08,0.09,0.1,0.2,0.3], 'politics update',40)
```
假设用户输入查询向量 `[0.1,0.1,0.2,0.2,0.3,0.3,0.4,0.4]`，只在 comment 含 “music” 的文档中检索最相似的前 2 条：
```sql
SELECT id, comment,
       l2_distance_approximate(embedding, [0.1,0.1,0.2,0.2,0.3,0.3,0.4,0.4]) AS dist
FROM ann_with_fulltext
WHERE comment MATCH_ANY 'music'       -- 先用倒排索引过滤
ORDER BY dist ASC                     -- 在过滤后的结果集上做 ANN TopN
LIMIT 2;

+------+---------------------+----------+
| id   | comment             | dist     |
+------+---------------------+----------+
|    1 | this is about music | 0.663325 |
|    3 | latest music trend  | 1.280625 |
+------+---------------------+----------+
2 rows in set (0.04 sec)
```
带过滤条件的 ANN 搜索要想利用向量索引加速 TopN，需要确保涉及的过滤列具备倒排等二级索引。
## 查询参数

除了在构建 HNSW 索引时可指定参数外，查询阶段也可通过会话变量调节行为。

- hnsw_ef_search：HNSW索引的EF搜索参数。ef_search 用来控制搜索阶段时 candidates 队列的最大长度，ef_search 越大则搜索的精度越高，代价是搜索的耗时越高。默认值为 32。

- hnsw_check_relative_distance：是否启用相对距离检查机制，以提升HNSW搜索的准确性。默认为 true。

- hnsw_bounded_queue： 是否使用有界优先队列来优化HNSW的搜索性能。默认为 true。
## 向量量化
采用 FLAT 编码时，HNSW 索引（原始向量 + 图结构）可能占用大量内存。HNSW 必须全量驻留内存才能工作，因此在超大规模数据集上易成瓶颈。
标量量化(SQ)通过压缩 FLOAT32 减少内存开销。乘积量化(PQ)通过分解高维向量并分别量化子向量来降低内存开销。Doris 当前支持两种标量量化：INT8 与 INT4（SQ8 / SQ4）。以 SQ8 为例：

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="sq8"    -- 指定使用 INT8 进行量化
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
在 768 维的 Cohere-MEDIUM-1M 与 Cohere-LARGE-10M 数据集测试中，SQ8 可将索引大小压缩至 FLAT 的约 1/3。
数据集

| 数据集 | 向量维度 | 存储/索引方案 | 总磁盘占用 | 数据部分 | 索引部分 | 备注 |
|--------|----------|---------------|------------|----------|----------|------|
| Cohere-MEDIUM-1M | 768D | Doris (FLAT)    | 5.647 GB (2.533 + 3.114) | 2.533 GB | 3.114 GB | 1M 向量，原始 + HNSW FLAT 索引 |
| Cohere-MEDIUM-1M | 768D | Doris SQ INT8   | 3.501 GB (2.533 + 0.992) | 2.533 GB | 0.992 GB | INT8 对称量化 |
| Cohere-MEDIUM-1M | 768D | Doris PQ(pq_m=384,pq_nbits=8)   | 3.149 GB (2.535 + 0.614) | 2.535 GB | 0.614 GB | 乘积量化 |
| Cohere-LARGE-10M | 768D | Doris (FLAT)    | 56.472 GB (25.328 + 31.145) | 25.328 GB | 31.145 GB | 10M 向量 |
| Cohere-LARGE-10M | 768D | Doris SQ INT8   | 35.016 GB (25.329 + 9.687) | 25.329 GB | 9.687 GB | INT8 量化，索引显著减小 |

量化会带来额外构建开销，原因是构建阶段需要大量距离计算，且每次计算需对量化值解码。以 128 维向量为例，随行数增长构建时间上升，SQ 相比 FLAT 可能引入约 10 倍构建成本。

类似的, Doris也支持乘积量化, 不过需要注意的是在使用PQ时需要提供额外的参数:

- `pq_m`: 表示将原始的高维向量分割成多少个子向量(向量维度 dim 必须能被 pq_m 整除)。
- `pq_nbits`: 表示每个子向量量化的比特数, 它决定了每个子空间码本的大小, 在faiss中pq_nbits值一般要求不大于24。

特别需要注意的是, pq量化在训练阶段对训练的数据量有要求, 至少需要与每一个聚类中心数量一样多(即 训练点个数 n >= 2 ^ pq_nbits)。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="pq",    -- 指定使用 PQ 进行量化
      "pq_m"="2",          -- 使用PQ时需要指定, 表示将高维向量分割成 pq_m 个低维子向量
      "pq_nbits"="2"       -- 使用PQ时需要指定, 表示每个子空间码本的比特数
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```

![ANN-SQ-BUILD_COSTS](/images/ann-index-quantization-build-time.jpg)


## 性能调优
向量搜索是典型的二级索引点查场景。若对 QPS 与延迟要求较高，可参考以下建议。经调优，在 FE 32C 64GB + BE 32C 64GB 机器上，Doris 可达到 3000+ QPS（数据集：Cohere-MEDIUM-1M）。
### 查询性能
| 并发 | 方案 | QPS | 平均延迟 (s) | P99 延迟 (s) | CPU 使用率 | 召回率 |
|------|------|------|---------------|--------------|------------|--------|
| 240 | Doris | 3340.4399 | 0.071368168 | 0.163399825 | 40% | 91.00% |
| 240 | Doris SQ INT8 | 3188.6359 | 0.074728852 | 0.160370195 | 40% | 88.26% |
| 240 | Doris SQ INT4 | 2818.2291 | 0.084663868 | 0.174826815 | 43% | 80.38% |
| 240 | Doris 暴力计算 | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |
| 480 | Doris | 4155.7220 | 0.113387271 | 0.261086075 | 60% | 91.00% |
| 480 | Doris SQ INT8 | 3833.1130 | 0.123040214 | 0.276912867 | 50% | 88.26% |
| 480 | Doris SQ INT4 | 3431.0538 | 0.137636995 | 0.281631249 | 57% | 80.38% |
| 480 | Doris 暴力计算 | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |

### 使用 prepared statement
常见 embedding 模型输出通常为 768 维或更高。如果将该向量作为字面量直接写入 SQL，解析耗时可能超过实际执行时间，因此建议使用 Prepared Statement。当前 Doris 不支持通过 mysql client 直接执行相关命令，需要通过 JDBC 调用。
```
1. 在 jdbc url 里面开启服务端 prepared statement
url = jdbc:mysql://127.0.0.1:9030/demo?useServerPrepStmts=true
2. 使用 prepared statement
// use `?` for placement holders, readStatement should be reused

PreparedStatement readStatement = conn.prepareStatement("SELECT id, l2_distance_approximate(embedding, cast (? as ARRAY<FLOAT>)) AS distance
  FROM l2_distance_approximate
  ORDER BY distance
  LIMIT 10");
  
...

readStatement.setString("[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]");

ResultSet resultSet = readStatement.executeQuery();
```
### 减少 segment 数量
Doris 的 ANN 索引建立在 segment 上，segment 过多会引入额外开销。理想情况下，带 ANN 索引的表每个 tablet 下 segment 数不应超过 5 个。可通过调整 be.conf 中 `write_buffer_size` 与 `vertical_compaction_max_segment_size` 增大单 segment 大小以减少数量；建议两者设置为 10737418240（10GB）。
### 减少 rowset 数量
减少 rowset 数量与减少 segment 的目的相同：降低调度开销。每次导入都会生成一个 rowset，建议使用 stream load 或 `INSERT INTO SELECT` 做批量导入。
### Ann 索引常驻内存
当前 ANN 索引算法基于内存，若查询到的 segment 索引未驻留内存会触发磁盘 I/O。为性能考虑建议常驻，可在 be.conf 中设置 `enable_segment_cache_prune=false`。
### parallel_pipeine_task_num = 1
ANN TopN 查询返回行数很少，无需高并行度，建议 `SET parallel_pipeline_task_num = 1`。
### enable_profile = false
若对延迟极其敏感，建议关闭 query profile（`enable_profile=false`）。

## Python SDK

在 AI 时代，Python 已经成为数据处理与智能应用开发的主流语言。为了让开发者更方便地在 Python 环境中使用 Doris 的向量搜索能力，一些社区小伙伴为 Doris 贡献了 Python SDK。

* https://github.com/uchenily/doris_vector_search: 针对向量距离检索做了性能优化，是目前市面上性能最好的 doris vector search python sdk


## 使用限制
1. Doris 要求 ANN Index 对应的列必须是 NOT NULLABLE 的 `Array<Float>`，并且在后续的导入过程中，需要确保该列的每一个向量的长度均等于索引属性中指定的维度（dim），否则会报错。

2. ANN Index 只能在 DuplicateKey 的表模型上使用。

3. Doris 使用前过滤语意（谓词计算在AnnTopN 计算之前）当 SQL 中的谓词涉及到的列有非二级索引列时，为了保证结果的正确性，此时 Doris 会回退到暴力计算。
比如
```sql
SELECT id, l2_distance_approximate(embedding, [xxx]) AS distance
    FROM sift_1M
    WHERE round(id) > 100
    ORDER BY distance limit 10;
```

虽然 id 是主键，但未在该列上构建倒排等可精确定位行号的二级索引，此类谓词在 Doris 中会在索引分析之后执行。为保证 ANN TopN 的前过滤语义，系统会回退为暴力计算。

4. 如果 SQL 中指定的距离函数与 DDL 中索引的 metric 类型不匹配，那么此时 doris 无法通过 ANN 索引进行 TOPN 的计算，哪怕你是用的是 l2_distance_approximate/inner_product_approximate。

5. 如果 metric 类型是 inner_product，那么只有 ORDER BY inner_product_approximate() DESC LIMIT N（这里的 DESC 不能省略）才能通过 ANN 索引加速。

6. xxx_approximate() 函数的第一个参数为 ColumnArray，第二个参数为 CAST 或者 ArrayLiteral 时，才能触发索引分析，交换位置会回退暴力搜索。
