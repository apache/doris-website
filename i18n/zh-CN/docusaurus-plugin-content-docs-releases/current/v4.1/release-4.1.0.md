---
{
    "title": "Release 4.1.0",
    "language": "zh-CN",
    "description": "Apache Doris 4.1.0 版本发布说明"
}
---

# AI & Search

AI 时代正在重新定义数据库的核心价值。传统数据库更多面向人工分析、报表与离线统计，而在新一代 Search & AI 场景下，数据库已成为**智能 Agent、RAG 系统、大模型服务**的关键基础设施，承担实时数据供给、多模态检索、特征存储与模型可观测等核心职责。

为适配这一变革，Apache Doris 在 Search、AI 数据存储与 AI 可观测等领域进行了全面深度优化：一方面强化海量非结构化、半结构化数据的高效存储与管理，支撑 RAG 切片、对话上下文、Agent 执行轨迹、工具调用日志等典型 AI 数据的高吞吐写入与低延迟读取；另一方面构建统一的混合检索能力，实现结构化过滤、全文检索与向量语义检索的深度协同，满足复杂 AI 查询对全面性、精准度与可控性的要求。

同时，Doris 针对模型训练、推理过程中的监控指标、Trace 链路、事件流等可观测数据，优化了宽表存储、随机读取与聚合分析性能，让 AI 系统的运行状态可追溯、可分析、可治理。在 4.1.0 版本中，我们围绕上述场景持续打磨，大幅提升混合检索、长上下文存储、超宽表处理与高并发实时查询能力，使 Doris 真正成为 AI 时代统一的数据存储与检索底座。

## 向量索引

### 新的向量索引算法--IVF

​**IVF（Inverted File，倒排文件）是大规模高维向量场景中最经典、最常用的近似最近邻（ANN）检索算法**​，核心是 "先聚类分桶、再局部搜索"，用少量精度损失换取数量级的速度提升。 与4.0.0 的HNSW 算法相比，它能够通过降低一定的精度的损失，用较少的内存来支持更大规模的向量。可以通过索引属性 `"index_type"="ivf"`来使用 IVF 索引。

```SQL
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
```

### 基于IVF 算法的DiskANN 索引

以Faiss为典型的开源向量搜索库面向的搜索场景通常是小规模（千万级）高性能的向量搜索，这些实现以大量内存的开销作为成本来实现高性能的召回。索引需要全内存这一要求限制了他们在超大规模——比如100亿——向量搜索场景下的应用。​**在 IVF 算法的基础上，Doris 参考微软 SPANN 论文中描述的优化方式，通过内存缓存 + 本地文件系统缓存，实现了 IVF\_ON\_DISK 索引，配合 Doris 的存算分离模式，IVF\_ON\_DISK 可以在超大规模向量搜索场景下以极低的成本实现高效的向量剪枝，提供高性能的向量召回。相比之前的 SOTA —— DiskAnn，IVF\_ON\_DISK 能够极大程度减少索引构建开销，在搜索阶段通过调整 cache 比例，能够达到和 IVF 全内存一个水平线上的查询性能。对于万亿规模的向量搜索场景，IVF\_ON\_DISK 将会成为新的解决方案。**

IVF\_ON\_DISK的使用方式与 IVF 基本一致，只需要指定 `"index_type"="ivf_on_disk"`即可。

```SQL
CREATE TABLE for_ivf_on_disk (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type"="ivf_on_disk",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### 量化

向量量化是另一种用来降低向量索引内存开销的方式。向量量化本质是通过有损的向量压缩技术，以略微降低召回率为代价，换取极大程度减少内存使用的收益。

Doris 提供了多种向量量化方式，包括INT8标量量化，INT4标量量化以及ProductQuantization。在召回率有略微下降的情况下，上述3种量化方式有4到8倍的压缩比。以对 128 维向量做 PQ 压缩为例，DDL 如下

```SQL
CREATE TABLE product_quant (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type"="ivf_on_disk",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024",
      "quantizer"="pq",
      "pq_m"=64,
      "pq_nbits"=8
  )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

向量量化可以和 IVF\_ON\_DISK 一起使用，进一步降低大规模向量检索的机器成本。

### 性能提升

在查询性能上，4.1.0 中引入了 Ann Index Only Scan 的优化，该优化使向量搜索查询完全避免了在执行期间对原始列的IO读操作，**向量索引的性能比4.0.0 版本提升了4倍，在100万向量的规模下，在16c，64g内存的机器上提供900的qps，同时满足97%召回率，能够满足大部分业务的需求。**

相比专用向量数据库，Doris 具有更好的索引构建性能，这得益于 Doris 的数据分层架构。在 4.1.0 中，我们进一步强化了这个优势。现在 Doris 在构架索引的时候会在内存进行攒批，以 batch 的形式进行向量索引的构建可以在保证索引质量的同时最大程度提高索引构建的并行度。根据 VectorDBBench 已有的公开数据（截止2026年1月），Doris 比专业的向量索引库，例如Milvus，Qdrant，pgvector 的索引构建速度都更快。

## Search() 函数：在 SQL 中统一文本搜索与分析

传统日志和文本分析场景中，搜索依赖 Elasticsearch，分析依赖 OLAP 数据库，两套系统、两份数据、一条同步链路。4.1 引入的 `search()` 函数将文本搜索能力直接嵌入 SQL，用一条 SQL 同时完成搜索过滤与聚合分析，消除中间数据搬运。

### 核心能力

* ​**兼容 ES query\_string 语法**​：`search()` 接受一个 DSL 字符串参数，语法兼容 Elasticsearch query\_string，已有 ES 查询迁移时大部分只需换个函数名。同时支持 Lucene 模式，实现完整的 MUST / SHOULD / MUST\_NOT 语义。
* ​**丰富的查询算子**​：内置 TERM、PHRASE、WILDCARD、REGEXP、PREFIX、NOT、NESTED 等多种算子，可任意嵌套组合，一行 DSL 替代多个 MATCH 拼接。
* ​**BM25 相关性打分**​：内置 BM25 打分（IDF 加权 + 文档长度归一化），通过 `score()` 列暴露分数，并在存储层做 TopN 优化，无需全量结果传输。
* ​**嵌套搜索（Nested）**​：配合 VARIANT 类型，`NESTED` 算子可直接在嵌套 JSON 数组内部搜索，无需 ETL 预处理或拆表，适用于 AI Agent Trace、车联网事件流等半结构化场景。
* ​**多字段搜索**​：支持 `best_fields`（精确匹配同一字段）和 `cross_fields`（跨字段分散匹配）两种策略，排障时无需提前确定目标字段。

## 突破百万 Token 上下文：原生支持 100MB 级超大JSON全量存储

在长文本、多轮交互、RAG 与 Agent 场景中，**百万 Token 上下文能力**已经从 "可选项" 变成 "刚需"。而 Apache Doris 此次升级，直接实现​**单条 100MB 级超大JSON原生存储**​，彻底打通 "数据库 + 大模型上下文" 的全链路壁垒。

## 元数据分离重构：为万列超宽场景深度赋能

Segment V3 借鉴了Lance 以及Vortex 等新型文件存储格式的做法，将元数据从footer 中分离，解决万列场景下最容易碰到的元数据膨胀、文件打开慢和随机读开销问题。

```SQL
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## 更快的OLAP

|               | Apache Doris 4.1 | Apache Doris 4.0 | 提升比例         |
| --------------- | ------------------ | ------------------ | ------------------ |
| SSB SF1000    | 10934 ms         | 12495 ms         | **14.28%** |
| TPC-H SF1000  | 53275 ms         | 65312 ms         | **22.59%** |
| TPC-DS SF1000 | 159562 ms        | 190031 ms        | **19.10%** |

## 存算分离

目前，Apache Doris 存算分离架构的用户规模已正式突破 ​**2000 家**​。

## 数据湖

4.1.0 版本在数据湖方向实现了重大突破，全方位提升了 Doris 作为统一湖仓分析引擎的核心竞争力。

## 离线计算

新增标准 SQL `MERGE INTO`，支持在单条语句中完成 **UPSERT / DELETE** 操作。

## 核心引擎

新增 UNNEST、Recursive CTE、ASOF JOIN 等核心语法支持。

## 行为变更

* 增加了一个fe的config： max\_bucket\_num\_per\_partition 限制每一个partition 最多的bucket 的数量，默认值768。
