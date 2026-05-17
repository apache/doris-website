---
{
    "title": "IVF",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中使用 IVF 索引加速大规模向量搜索：原理、参数调优、召回率优化与性能基准。",
    "keywords": [
        "IVF",
        "倒排文件索引",
        "Inverted File Index",
        "向量索引",
        "ANN 索引",
        "近似最近邻搜索",
        "Apache Doris 向量搜索",
        "nlist",
        "nprobe",
        "召回率优化",
        "向量数据库"
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

# IVF：在 Apache Doris 中使用 IVF 索引加速向量搜索

<!-- 知识类型: Feature 概念 + 操作步骤 + 配置参数 -->
<!-- 适用场景: 向量索引选型 / 索引构建 / 召回率与性能调优 -->

**一句话定义**：IVF（Inverted File Index，倒排文件索引）是一种通过聚类划分向量空间、缩小搜索范围的近似最近邻（ANN）索引，自 Apache Doris 4.x 起原生支持。

本文回答以下问题：

- IVF 索引是什么？为什么能加速向量检索？
- 在 Apache Doris 中如何创建、构建、删除 IVF 索引？
- 如何选择 `nlist`、`nprobe` 等关键参数以平衡召回率与性能？
- 哪些因素会影响召回率？如何避免性能衰减？

## 快速导航

| 你的目标 | 跳转章节 |
| --- | --- |
| 理解 IVF 的基本原理 | [什么是 IVF 索引](#什么是-ivf-索引) |
| 创建并使用 IVF 索引 | [在 Apache Doris 中使用 IVF](#在-apache-doris-中使用-ivf) |
| 调优召回率 | [召回率优化](#召回率优化) |
| 排查查询性能问题 | [查询性能](#查询性能) |
| 复现性能基准 | [Benchmark](#benchmark) |
| 常见问题 | [FAQ](#faq) |

---

## 什么是 IVF 索引

<!-- 知识类型: 概念解释 -->

### 从倒排索引到向量倒排

IVF（Inverted File，倒排文件）一词起源于信息检索领域。以文本检索为例：

- **正向索引**：每个文档维护一份单词列表。查询时必须遍历全部文档。

    | Document | Words |
    | --- | --- |
    | Document 1 | the, cow, says, moo |
    | Document 2 | the, cat, and, the, hat |
    | Document 3 | the, dish, ran, away, with, the, spoon |

- **倒排索引**：每个单词维护一份"包含该词的文档列表"，查询时只需扫描相关列表。

    | Word | Documents |
    | --- | --- |
    | the | Document 1, Document 3, Document 4, Document 5, Document 7 |
    | cow | Document 2, Document 3, Document 4 |
    | says | Document 5 |
    | moo | Document 7 |

如今文本通常以向量嵌入的形式表示。IVF 借鉴倒排思想：将聚类中心视作"字典"，每个聚类中心维护一份"属于该聚类的向量列表"，查询时只需检查少数选定的聚类。

### IVF 为何能加速向量搜索

当数据集增长到百万乃至十亿级向量时，精确 kNN 搜索（计算查询向量与全库每条向量的距离）相当于一次大规模矩阵乘法，计算成本不可承受。

近似最近邻（ANN）搜索通过牺牲少量精度换取数量级的速度提升。IVF 是工业界使用最广泛、最有效的 ANN 方法之一，核心思想是 **"分而治之"**：

1. 将整个向量数据集划分为若干聚类，每个聚类由一个 **质心（centroid）** 代表；
2. 查询时先识别质心最接近查询向量的少数聚类，仅在这些聚类内部搜索，跳过其余数据。

![ivf search](/images/vector-search/dataset-points-query-clusters.png)

---

## 在 Apache Doris 中使用 IVF

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 建表 / 索引构建 / 索引管理 -->

Apache Doris 自 4.x 版本起支持基于 IVF 的 ANN 索引。索引类型固定为 `ANN`，通过 `index_type=ivf` 指定使用 IVF 算法。

### 索引构建方式对比

创建 ANN 索引有两种方式，适用于不同场景：

| 方式 | 构建时机 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 建表时定义索引 | 数据导入时同步构建 | 数据写入完成即可加速查询 | 拖慢写入；Compaction 可能引发索引重建，造成资源浪费 | 索引参数已确定的生产环境 |
| `CREATE INDEX` + `BUILD INDEX` | 数据导入完成后异步构建 | 不影响导入；便于参数调优 | 构建期间查询无加速 | 调参阶段、超大表初始化 |

### 方式一：建表时定义索引

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="ivf",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

### 方式二：CREATE INDEX + BUILD INDEX

**步骤 1**：建表（不带索引）并导入数据。

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

**步骤 2**：执行 `CREATE INDEX` 添加索引定义。此时只是登记索引元信息，存量数据上尚未真正构建索引。

```sql
CREATE INDEX idx_test_ann ON sift_1M (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="l2_distance",
  "dim"="128",
  "nlist"="1024"
);

SHOW DATA ALL FROM sift_1M;
```

预期输出（`LocalIndexSize` 仍为 0）：

```text
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```

**步骤 3**：执行 `BUILD INDEX` 在存量数据上构建索引。该任务异步执行。

```sql
BUILD INDEX idx_test_ann ON sift_1M;
```

**步骤 4**：通过 `SHOW BUILD INDEX` 查看任务状态。

```sql
SHOW BUILD INDEX WHERE TableName = "sift_1M";
```

任务完成后再次查看数据大小，可以看到索引体积（`LocalIndexSize`）已生成：

```text
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764392359610 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 14:18:22.360 | 2025-12-01 14:18:27.885 | 5036          | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```

### 删除索引

调参阶段经常需要测试不同参数组合以确保召回率，可使用 `DROP INDEX` 灵活管理索引：

```sql
ALTER TABLE sift_1M DROP INDEX idx_test_ann;
```

### 执行向量查询

ANN 索引同时支持 **TopN 搜索** 与 **范围搜索（range search）** 加速。

**生产环境最佳实践**：高维向量的字符串表示在 SQL 解析阶段会引入额外开销，因此不建议在高并发场景直接使用原始 SQL。推荐两种优化方式：

1. 使用 Prepare Statement 预解析 SQL；
2. 使用 Doris 官方的向量搜索 [Python library](https://github.com/uchenily/doris_vector_search)，该库已封装 Prepare Statement 调用，并将查询结果直接转换为 pandas DataFrame，便于 AI 应用开发。

示例代码：

```python
from doris_vector_search import DorisVectorClient, AuthOptions

auth = AuthOptions(
    host="127.0.0.1",
    query_port=9030,
    user="root",
    password="",
)

client = DorisVectorClient(database="test", auth_options=auth)

tbl = client.open_table("sift_1M")

query = [0.1] * 128  # Example 128-dimensional vector

# SELECT id FROM sift_1M ORDER BY l2_distance_approximate(embedding, query) LIMIT 10;
result = tbl.search(query, metric_type="l2_distance").limit(10).select(["id"]).to_pandas()

print(result)
```

预期输出：

```text
       id
0  123911
1  926855
2  123739
3   73311
4  124493
5  153178
6  126138
7  123740
8  125741
9  124048
```

---

## 召回率优化

<!-- 知识类型: 性能调优 -->
<!-- 适用场景: 索引调参 / 召回率不达标排查 -->

向量搜索的核心指标是召回率，**任何性能数据都必须在召回率达标的前提下才有意义**。影响召回率的因素主要有：

1. IVF 的索引参数（`nlist`）和查询参数（`nprobe`）
2. 索引向量量化
3. Segment 的大小与数量

本节讨论第 1 与第 3 项。向量量化将在其他文档中介绍。

### 索引超参数：nlist 与 nprobe

IVF 在索引构建与查询阶段分别使用关键参数：

**索引构建阶段**：

1. **聚类**：使用聚类算法（如 k-means）将向量划分为 `nlist` 个聚类，计算并存储每个聚类的质心。
2. **向量分配**：将每个向量分配到与其质心最接近的聚类，加入对应的倒排列表。

**查询阶段**：

1. **选择聚类**：计算查询向量到 `nlist` 个质心的距离，挑选最近的 `nprobe` 个聚类。
2. **聚类内穷举**：在选中的 `nprobe` 个聚类中逐一比较向量，找出最近邻。

| 参数 | 作用 | 影响 | Doris 默认值 |
| --- | --- | --- | --- |
| `nlist` | 聚类（倒排列表）数量 | 越大粒度越细，搜索更快但聚类成本上升、邻居更易分散到不同聚类 | 1024 |
| `nprobe` | 查询时探测的聚类数量 | 越大召回率越高、延迟越大；越小越快但容易漏召 | 64 |

**SIFT_1M 数据集实测结果**：

| nlist | nprobe | recall@100 |
| --- | --- | --- |
| 1024 | 64 | 0.9542 |
| 1024 | 32 | 0.9034 |
| 1024 | 16 | 0.8299 |
| 1024 | 8 | 0.7337 |
| 512 | 32 | 0.9384 |
| 512 | 16 | 0.8763 |
| 512 | 8 | 0.7869 |

### 超参数选择实践

虽然无法事先给出确切的最优参数，但可以按以下方法系统性地选取：

1. 建立一张无索引的临时表 `table_multi_index`，包含 2 至 3 个向量列；
2. 通过 Stream Load 等方式将数据导入该表；
3. 在每个向量列上分别使用不同参数 `CREATE INDEX` 与 `BUILD INDEX`；
4. 对比各列的召回率，挑选最合适的参数组合。

示例：

```sql
ALTER TABLE tbl DROP INDEX idx_embedding;
CREATE INDEX idx_embedding ON tbl (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="inner_product",
  "dim"="768",
  "nlist"="1024"
);
BUILD INDEX idx_embedding ON tbl;
```

### 索引覆盖的行数

Doris 内表的数据按以下层次组织：

- **Table** → 按分桶键均匀分布到 N 个 **Tablet**（数据迁移和 rebalance 的基本单位）
- **Tablet** → 每次导入或 Compaction 新增一个 **Rowset**（版本管理单位）
- **Rowset** → 实际数据存储于 **Segment** 文件

向量索引与倒排索引一样，作用于 Segment 粒度。Segment 大小由 BE 配置项 `write_buffer_size` 与 `vertical_compaction_max_segment_size` 决定。导入或 Compaction 过程中，当 memtable 累计到一定大小后会下刷为一个 Segment 文件，并为该 Segment 构建向量索引（多个索引列对应多个索引）。

每个 IVF 索引参数组合可有效覆盖的数据规模有限，**当 Segment 行数超过阈值时召回率会下降**。

> 提示：通过 `SHOW TABLETS FROM <table>` 查看表的 Compaction 状态，点开对应 URL 可看到 Segment 数量。

### Compaction 对召回率的影响

Compaction 会合并多个小 Segment 为更大的 Segment，使原先适配较小数据规模的索引参数失效，从而降低召回率。

**最佳实践**：在 `BUILD INDEX` 之前先触发一次 FULL COMPACTION，在充分合并后的 Segment 上构建索引可以：

- 保持召回率稳定；
- 减少索引构建引入的写放大。

---

## 查询性能

<!-- 知识类型: 性能调优 -->
<!-- 适用场景: 在线查询性能优化 / 内存容量规划 -->

### 索引文件的冷加载

Doris 的 ANN 索引基于 Meta 开源的 [faiss](https://github.com/facebookresearch/faiss) 实现。**IVF 索引必须全部加载进内存后才能加速查询**。

最佳实践：在高并发查询前先执行一次冷查询，确保涉及的所有 Segment 索引文件均已加载，否则首次查询性能会显著衰减。

### 内存空间与性能

> **IVF 索引（无量化压缩）占用的内存空间约为其检索向量内存大小的 1.02 倍。**

例如 128 维、1M 行数据集的 IVF FLAT 索引内存占用约为：

```text
128 * 4 * 1,000,000 * 1.02 ≈ 500 MB
```

参考值：

| dim | rows | 预估内存 |
| --- | --- | --- |
| 128 | 1M | 496 MB |
| 768 | 1M | 2.9 GB |

为保证查询性能，BE 必须有足够的内存容纳全部索引；否则索引文件频繁 IO 会导致查询性能大幅衰减。

---

## Benchmark

<!-- 知识类型: 性能基准 -->
<!-- 适用场景: 性能复现 / 选型评估 -->

**部署建议**：基准测试应模拟生产环境，FE 与 BE 分开部署，客户端运行在另一台独立机器上。

**测试框架**：[VectorDBBench](https://github.com/zilliztech/VectorDBBench)。

### Performance768D1M

压测命令：

```bash
# load
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --skip-search-serial --skip-search-concurrent

# search
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --search-concurrent --search-serial --num-concurrency 10,40,80 --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --session-var ivf_nprobe=64 --skip-load --skip-drop-old
```

---

## FAQ

<!-- 知识类型: FAQ -->

**Q1：IVF 与 HNSW 应该如何选择？**
IVF 适合内存充足、需要平衡构建成本与查询延迟的大规模场景；HNSW 在查询延迟上更具优势但内存占用更高。详见 [HNSW 文档](./hnsw.md)。

**Q2：为什么 `BUILD INDEX` 之后召回率仍然不高？**
常见原因包括：`nprobe` 设置过小、Segment 过大导致索引覆盖不足、未在 BUILD 前执行 FULL COMPACTION。请参见 [召回率优化](#召回率优化)。

**Q3：高并发查询前为什么要执行冷查询？**
IVF 索引必须全部加载进内存才能加速。冷查询的目的是预热，将索引从磁盘加载到内存，避免在线查询首次命中时性能衰减。

**Q4：`nlist` 默认值 1024 是否需要调整？**
Doris 默认 `nlist=1024`、`nprobe=64`，适用于大多数中等规模数据集。建议结合实际数据量与召回率要求按 [超参数选择实践](#超参数选择实践) 调整。

**Q5：`DROP INDEX` 后会立即释放内存吗？**
`DROP INDEX` 会移除索引定义，索引文件随后被清理。调参时建议结合 `CREATE/BUILD INDEX` 流程使用。

---

## Troubleshooting

<!-- 知识类型: 故障排查 -->

| 现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 召回率显著低于预期 | `nprobe` 过小 / Segment 过大 / 未做 FULL COMPACTION | 增大 `nprobe`；BUILD 前执行 FULL COMPACTION；调整 `nlist` |
| 查询首次延迟很高，后续正常 | 索引尚未加载进内存（冷加载） | 高并发前先执行冷查询预热 |
| BE 内存吃紧、查询性能衰减 | 索引未能完全驻留内存，发生频繁 IO | 扩容 BE 内存；考虑使用量化压缩降低内存占用 |
| `BUILD INDEX` 长时间未完成 | 异步任务、数据量大 | 通过 `SHOW BUILD INDEX WHERE TableName = "<tbl>"` 查看进度 |
| 数据导入变慢 | 建表时同步构建索引 | 改用 `CREATE INDEX` + `BUILD INDEX` 方式异步构建 |
