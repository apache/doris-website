---
{
    "title": "向量搜索",
    "language": "zh-CN"
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

在生成式 AI 的应用中，单纯依赖大模型自身的参数记忆往往存在局限：一方面，模型的知识存在时效性，无法覆盖所有最新的信息；另一方面，直接依赖模型“生成”容易导致幻觉。因此，RAG（检索增强生层）应运而生。RAG 的关键任务，并不是让模型凭空生成答案，而是要从外部知识库中检索出与用户查询最相关的 Top-K 个信息片段，作为模型生成的依据。为了实现这一点，需要一种机制来衡量“用户查询”与“知识库文档”之间的语义相关性。向量表示正是常用的工具：通过将查询和文档统一编码为语义向量，就可以利用向量相似度来衡量两者的相关程度。随着预训练语言模型的发展，生成高质量的语义向量已成为主流做法。这样，RAG 的检索部分就转化为一个典型的向量相似度搜索问题，即从大规模向量集合中找出与查询最相似的 K 个向量（也就是候选知识片段）。值得注意的是，RAG 的向量检索不仅应用于文本，还可以扩展到多模态生成场景。例如，在多模态 RAG 系统中，图片、语音、视频等数据也可以被编码成向量，以便检索并提供给生成模型作为上下文。比如用户上传一张图片，系统可以先检索出相关描述或知识片段，再结合生成模型生成解释性内容或答案；在医学问答中，RAG 则可以通过检索病例资料和医学文献，辅助生成更准确的诊断建议。
## 暴力搜索
Apache Doris 从最早 2.0 版本开始支持基于向量距离的最近邻搜索，通过 SQL 实现向量搜索是一个非常自然且简单的过程。
```
SELECT id,
       l2_distance(embedding, [1.0, 2.0, xxx, 10.0]) AS distance
FROM   vector_table
ORDER  BY distance
LIMIT  10; 
```

当数据量不大（小于1百万行）时，Apache Doris 的向量精确近邻搜索性能完全可以满足要求，并且可以返回召回率100%准确率100%的严格最近邻（K-Nearest Neighbor）。不过当数据量进一步增加后，大多数用户开始希望通过损失一部分召回率和精度的代价，实现查询性能的大幅度提高，此时这个问题就变成了向量近似最近邻搜索（Approximate Nearest Neighbor）。

## 近似最近邻搜索

Apache Doris 从 4.0 版本开始正式支持 ANN search。没有引入额外的数据类型，向量在 Doris 中可以被存储为定长的数组类型，而对于基于向量距离的索引，我们基于 faiss 实现了新的索引类型：ANN。
以常见的 [sift](http://corpus-texmex.irisa.fr/) 数据集为例，可以建表如下
```
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quant"="flat"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
- index_type: hnsw 表示使用基于 [hierarchical navigable small world 算法](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)的索引
- metric: l2_distance 表示使用 l2_distance 作为距离函数
- dim: 128 表示向量的维度为 128 
- quantizer: flat 表示向量的每个维度使用原始的 float32 存储


| 参数 | 是否必填 | 支持/可选值 | 默认值 | 说明 |
|------|----------|-------------|--------|------|
| `index_type` | 是 | 仅支持：hnsw | （无） | 指定所使用的 ANN 索引算法。当前只支持 HNSW。 |
| `metric_type` | 是 | `l2_distance`，`inner_product` | （无） | 指定向量相似度/距离度量方式。L2 为欧氏距离，inner_product 可用于余弦相似时需先归一化向量。 |
| `dim` | 是 | 正整数 (> 0) | （无） | 指定向量维度，后续导入的所有向量的维度必须与此一致，否则报错。 |
| `max_degree` | 否 | 正整数 | `32` | HNSW 图中单个节点的最大邻居数（M），影响索引内存与搜索性能。 |
| `ef_construction` | 否 | 正整数 | `40` | HNSW 构建阶段的候选队列大小（efConstruction），越大构图质量越好但构建更慢。 |
| `quantizer` | 否 | `flat`，`sq8`，`sq4` | `flat` | 指定向量编码/量化方式：`flat` 为原始存储，`sq8`/`sq4` 为对称量化（8/4 bit）以降低内存占用。 |

通过 S3 TVF 导入数据
```sql
INSERT INTO sift_1M
SELECT *
FROM S3("uri" =
"https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv", "format" = "csv");

select count(*) from sift_1M
--------------

+----------+
| count(*) |
+----------+
|  1000000 |
+----------+
```
sift 数据集一起发布了一组 groud truth，用于进行结果的验证，选取其中的一组数据，先用精准距离函数进行 topN 的召回：
```
SELECT id, l2_distance(embedding,     [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as distance FROM sift_1M ORDER BY distance limit 10
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
10 rows in set (0.29 sec)
```
当使用 l2_distance 或者 inner_product 时，doris 需要计算查询向量与 1000000 个待查询向量之间的 l2 distance，然后通过 TopN 算子得到全局的 TopN。使用 l2_distance_approximate/inner_product_approximate 可以触发查询向量索引的执行路径：
```
SELECT id, l2_distance_approximate(embedding,     [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as distance FROM sift_1M ORDER BY distance limit 10
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
可以看到使用 ANN 索引后，查询耗时从290ms减少到了20ms。
Doris 中，ann 索引是建立在 segment 粒度上的，同时 doris 的表天然的也是分布式表，所以在每个 segment 返回各自的 topn 之后，TopN 算子会把多个 tablet 的 segment 返回的数据 merge 到一起，最终得到一个全局的 topN。

需要注意的是，当 l2_distance 作为索引的 metric 时，distance 越小，表示距离越近，而 inner_product 则正好相反，inner_product 越大，则表示两个向量更加接近。因此，如果使用 inner_product 作为 metric，那么需要使用 ORDER BY dist DESC 才能通过索引获得 topn。
## 近似范围搜索

除了常见的 TopN 最近邻搜索（即返回与目标向量最近的前 N 条记录）之外，向量检索中还有一类常见的查询方式是 基于距离阈值的范围搜索。
 这种查询方式并不是要求返回固定数量的结果，而是希望找出所有与目标向量之间的距离 满足某种条件 的数据点。例如，用户可能想要找到所有距离大于某个阈值的向量，或者所有距离小于某个阈值的向量。这种范围搜索在实际应用中非常有用，特别是在需要获取与查询向量 “足够相似”或“足够不相似” 的候选集合时。例如，推荐系统中可能希望获取一批“接近但不完全相同”的商品或内容，以增加多样性；异常检测中可能会希望找出那些与正常模式距离较远的数据点。
一个典型的 SQL 为：
```
SELECT  count(*) FROM sift_1M  WHERE l2_distance_approximate(embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) > 300
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
Compound Search 是指将 AnnSearch 与 RangeSearch 写在同一个 SQL 中，意在返回满足某个范围要求的 topN。
```
SELECT id, l2_distance_approximate(embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as dist FROM sift_1M  WHERE l2_distance_approximate(embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) > 300 ORDER BY dist limit 10
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
对于 Compound Search，一个关键点是谓词的过滤与 TopN 的过滤谁的执行步骤在前谁在后。如果谓词先过滤，然后在剩余的结果中再进行TopN 的过滤，这种模式被称为前过滤，反之则称之为后过滤。通常来说，后过滤的执行速度是要远比前过滤更快的，然而后过滤的问题是结果的召回率会很低，因此 doris 选择实现前过滤。
在 Doris 中，Compound Search 的两个阶段均可通过索引进行加速，不过在某些场景下（比如第一阶段的 Range Search 过滤率很高的时候），两阶段均走索引可能会导致召回率出现大幅下降的情况，因此 Doris 会自适应判断是否需要走索引来完成两阶段的计算，自适应算法会考虑谓词的过滤率与索引类型综合做出决定。
## 带过滤条件的 ANN 搜索
带过滤条件的 ANN 搜索是指在 ANN TopN Search 之前执行一些其他的谓词过滤，返回满足用户要求的条件下的 topn。
用一个 8 维的小向量来说明如何进行混合搜索。
```
create table ann_with_fulltext (
            id int not null,
            embedding array<float> not null,
            comment String not null,
            value int null,
            INDEX idx_comment(`comment`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for comment',
            INDEX ann_embedding(`embedding`) USING ANN PROPERTIES("index_type"="hnsw","metric_type"="l2_distance","dim"="8")
        ) duplicate key (`id`) 
        distributed by hash(`id`) buckets 1
        properties("replication_num"="1");

INSERT INTO ann_with_fulltext VALUES
(1, [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8], 'this is about music', 10),
(2, [0.2,0.1,0.5,0.3,0.9,0.4,0.7,0.1], 'sports news today',   20),
(3, [0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2], 'latest music trend',  30),
(4, [0.05,0.06,0.07,0.08,0.09,0.1,0.2,0.3], 'politics update',40)
```
用户输入一个 query embedding `[0.1,0.1,0.2,0.2,0.3,0.3,0.4,0.4]`，只想在 comment 包含 “music” 的文档中，找出与 query 最相似的前 2 条。
```
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
带过滤条件的 ANN 搜索中为了能够让 topn 通过向量索引进行加速，需要确保谓词列都有倒排索引。
## 查询参数

除了在构建 hnsw 索引时可以指定参数外，在查询 hnsw 索引时也可以通过 session variables 指定参数。

- hnsw_ef_search：HNSW索引的EF搜索参数。ef_search 用来控制搜索阶段时 candidates 队列的最大长度，ef_search 越大则搜索的精度越高，代价是搜索的耗时越高。默认值为 32。

- hnsw_check_relative_distance：是否启用相对距离检查机制，以提升HNSW搜索的准确性。默认为 true。

- hnsw_bounded_queue： 是否使用有界优先队列来优化HNSW的搜索性能。默认为 true。
## 向量量化
在采用 FLAT 编码时，HNSW 索引本身（包含原始向量和图索引结构）可能会占据大量内存。HNSW 索引需要全量加载到内存后才能工作，因此HNSW索引对于内存的使用量在超大规模数据集时可能会是瓶颈。
向量量化技术就是通过对 FLOAT32 进行压缩编码减少内存的开销，Doris 目前支持两种类型的 Scalar Quantization（标量量化）：INT8 和 INT4，对应索引定义里的 SQ8 和 SQ4。以 SQ8 为例子，建表如下

```
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quant"="sq8"    -- 指定使用 INT8 进行量化
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```
在 768 维的 Cohere-MEDIUM-1M 与 Cohere-LARGE-10M（768D）上进行测试，可以看到相比 FLAT 编码，SQ8 可以将索引大小减少到原来的 1/3。
数据集

| 数据集 | 向量维度 | 存储/索引方案 | 总磁盘占用 | 数据部分 | 索引部分 | 备注 |
|--------|----------|---------------|------------|----------|----------|------|
| Cohere-MEDIUM-1M | 768D | Doris (FLAT)    | 5.647 GB (2.533 + 3.114) | 2.533 GB | 3.114 GB | 1M 向量，原始 + HNSW FLAT 索引 |
| Cohere-MEDIUM-1M | 768D | Doris SQ INT8   | 3.501 GB (2.533 + 0.992) | 2.533 GB | 0.992 GB | INT8 对称量化 |
| Cohere-LARGE-10M | 768D | Doris (FLAT)    | 56.472 GB (25.328 + 31.145) | 25.328 GB | 31.145 GB | 10M 向量 |
| Cohere-LARGE-10M | 768D | Doris SQ INT8   | 35.016 GB (25.329 + 9.687) | 25.329 GB | 9.687 GB | INT8 量化，索引显著减小 |

量化会对索引构建产生额外的开销，主要原因是索引构建过程中需要大量的距离函数的计算，INT8 量化后每次距离计算都需要引入额外的解码开销。以 128 维的向量为例子，索引的构建时间会随着行数的增加而增加，而SQ相比FLAT会引入大约10倍的索引构建开销。

![ANN-SQ-BUILD_COSTS](/images/ann-sq-build-time.png)


## 性能调优
向量搜索是一个典型的基于二级索引的点查场景，当用户对QPS以及平均延迟要求较高时，我们有如下的使用建议，通过调优，在 FE 32C 64GB + BE 32C 64GB 的机器上，doris 可以达到 3000+ 的 QPS。测试数据集为 Cohere-MEDIUM-1M。
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
现在常用的 embedding 模型输出的向量通常具有 768 或更高的维度，如果这 768 维度的向量作为字面量通过 SQL 直接传给 doris 的 parser，那么可能会出现 parse sql 的时间大于查询真正的执行时间的情况。因此建议使用 prepared statement 执行查询。目前 doris 不支持通过 mysql client 直接执行 prepare stmt 相关的命令，需要通过 jdbc 来访问
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
doris 的 ann 索引是建立在 segment 上的，segment 数量过多会导致各种额外的开销过多，理想情况下带有 ann 索引的表的每个 tablet 下 segment 的数量不应该超过 5 个。可以修改 be.conf 中的 write_buffer_size 和vertical_compaction_max_segment_size 来增大每个 segment 的大小，减少 segment 的数量，建议将上述两个参数设置为 1073741824(10GB)。
### 减少 rowset 数量
减少 rowset 数量的目的与减少 segment 数量的目的一样，都是为了减少查询时额外的调度开销，每次导入操作都会生成一个rowset，因此建议用户使用 streamload 或者 INSERT INTO SELECT 来导入数据。
### Ann 索引常驻内存
目前 doris 使用的 ann 索引算法都是基于内存的，如果某个被查询的 segment 的索引不在内存，那么会触发一次磁盘 IO，因此为了性能考虑，建议让 ann 索引常驻内存，通过在 be.conf 中设置enable_segment_cache_prune=false 可以确保 ann 索引常驻内存。
### parallel_pipeine_task_num = 1
Ann TopN 查询中从 scanner 返回的数据很少，不需要很高的 pipeline task 并行度，建议 set parallel_pipeline_task_num = 1
### enable_profile = false
当查询对于延迟极其敏感时，需要关闭 query profile。
## 使用限制
1. Doris 要求 ANN Index 对应的列必须是 NOT NULLABLE 的 `Array<Float>`，并且在后续的导入过程中，需要确保该列的每一个向量的长度均等于索引属性中指定的维度（dim），否则会报错。

2. ANN Index 只能在 DuplicateKey 的表模型上使用。

3. Doris 使用前过滤语意（谓词计算在AnnTopN 计算之前）当 SQL 中的谓词涉及到的列有非二级索引列时，为了保证结果的正确性，此时 Doris 会回退到暴力计算。
比如
```
SELECT id, l2_distance_approximate(embedding, [xxx]) AS distance
    FROM sift_1M
    WHERE round(id) > 100
    ORDER BY distance limit 10;
```

Id 虽然是主键，但是没有在 id 列构建倒排索引这种能够精确定位行号的二级索引，这类谓词在 doris 中的执行是在索引分析之后执行的，因此此时为了确保 ann topn 的前过滤语意，此时 doris 会回退到暴力计算

4. 如果 SQL 中指定的距离函数与 DDL 中索引的 metric 类型不匹配，那么此时 doris 无法通过 ANN 索引进行 TOPN 的计算，哪怕你是用的是 l2_distance_approximate/inner_product_approximate。

5. 如果 metric 类型是 inner_product，那么只有 ORDER BY inner_product_approximate() DESC LIMIT N（这里的 DESC 不能省略）才能通过 ANN 索引加速。

6. xxx_approximate() 函数的第一个参数为 ColumnArray，第二个参数为 CAST 或者 ArrayLiteral 时，才能触发索引分析，交换位置会回退暴力搜索。