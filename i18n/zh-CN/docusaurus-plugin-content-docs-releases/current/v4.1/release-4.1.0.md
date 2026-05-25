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

### 新的向量索引算法 —— IVF

**IVF（Inverted File，倒排文件）是大规模高维向量场景中最经典、最常用的近似最近邻（ANN）检索算法**，核心是"先聚类分桶、再局部搜索"，用少量精度损失换取数量级的速度提升。与 4.0.0 的 HNSW 算法相比，IVF 能够通过降低一定的精度，用较少的内存来支持更大规模的向量。可以通过索引属性 `"index_type"="ivf"` 来使用 IVF 索引。

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
```

### 基于 IVF 算法的 DiskANN 索引

以 Faiss 为典型的开源向量搜索库面向的搜索场景通常是小规模（千万级）高性能的向量搜索，这些实现以大量内存的开销作为成本来实现高性能的召回。索引需要全内存这一要求限制了它们在超大规模——比如 100 亿——向量搜索场景下的应用。**在 IVF 算法的基础上，Doris 参考微软 SPANN 论文（[SPANN paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2021/11/SPANN_finalversion1.pdf)）中描述的优化方式，通过内存缓存 + 本地文件系统缓存，实现了 IVF_ON_DISK 索引。配合 Doris 的存算分离模式，IVF_ON_DISK 可以在超大规模向量搜索场景下以极低的成本实现高效的向量剪枝，提供高性能的向量召回。相比之前的 SOTA —— DiskANN，IVF_ON_DISK 能够极大程度减少索引构建开销，在搜索阶段通过调整 cache 比例，能够达到和 IVF 全内存一个水平线上的查询性能。对于万亿规模的向量搜索场景，IVF_ON_DISK 将会成为新的解决方案。**

IVF_ON_DISK 的使用方式与 IVF 基本一致，只需要指定 `"index_type"="ivf_on_disk"` 即可。

```sql
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

Doris 提供了多种向量量化方式，包括 INT8 标量量化、INT4 标量量化以及 ProductQuantization。在召回率有略微下降的情况下，上述 3 种量化方式可提供 4 到 8 倍的压缩比。以对 128 维向量做 PQ 压缩为例，DDL 如下：

```sql
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

向量量化可以和 IVF_ON_DISK 一起使用，进一步降低大规模向量检索的机器成本。

### 性能提升

在查询性能上，4.1.0 中引入了 Ann Index Only Scan 的优化，该优化使向量搜索查询完全避免了在执行期间对原始列的 IO 读操作，**向量索引的性能比 4.0.0 版本提升了 4 倍。在 100 万向量的规模下，在 16c、64g 内存的机器上提供 900 的 QPS，同时满足 97% 召回率，能够满足大部分业务的需求。**

<img width="1107" height="1280" alt="Image" src="https://github.com/user-attachments/assets/d787bae2-8551-4898-8961-5aea8335ddbe" />

相比专用向量数据库，Doris 具有更好的索引构建性能，这得益于 Doris 的数据分层架构。在 4.1.0 中，我们进一步强化了这一优势。现在 Doris 在构建索引的时候会在内存中攒批，以 batch 的形式进行向量索引的构建，可以在保证索引质量的同时最大程度提高索引构建的并行度。根据 VectorDBBench 已有的公开数据（截至 2026 年 1 月），Doris 比专业的向量索引库（如 Milvus、Qdrant、pgvector）的索引构建速度都更快。

## Search() 函数：在 SQL 中统一文本搜索与分析

传统日志和文本分析场景中，搜索依赖 Elasticsearch，分析依赖 OLAP 数据库，两套系统、两份数据、一条同步链路。4.1 引入的 `search()` 函数将文本搜索能力直接嵌入 SQL，用一条 SQL 同时完成搜索过滤与聚合分析，消除中间数据搬运。

### 核心能力

- **兼容 ES query_string 语法：** `search()` 接受一个 DSL 字符串参数，语法兼容 Elasticsearch `query_string`，已有 ES 查询迁移时大部分只需换个函数名。同时支持 Lucene 模式，实现完整的 MUST / SHOULD / MUST_NOT 语义。
- **丰富的查询算子：** 内置 TERM、PHRASE、WILDCARD、REGEXP、PREFIX、NOT、NESTED 等多种算子，可任意嵌套组合，一行 DSL 替代多个 MATCH 拼接。
- **BM25 相关性打分：** 内置 BM25 打分（IDF 加权 + 文档长度归一化），通过 `score()` 列暴露分数，并在存储层做 TopN 优化，无需全量结果传输。
- **嵌套搜索（Nested）：** 配合 VARIANT 类型，`NESTED` 算子可直接在嵌套 JSON 数组内部搜索，无需 ETL 预处理或拆表，适用于 AI Agent Trace、车联网事件流等半结构化场景。
- **多字段搜索：** 支持 `best_fields`（精确匹配同一字段）和 `cross_fields`（跨字段分散匹配）两种策略，排障时无需提前确定目标字段。

### 性能优势

与传统的多个 MATCH 表达式独立求值再做位图求交的方式不同，`search()` 将所有条件编译为一棵查询树，并基于 Lucene 的 Weight/Scorer 架构统一求值：

- **逐文档推进 + AND 短路：** 不物化完整位图，第一个条件不满足即跳过，数据倾斜时优势更明显。
- **共享 `IndexReader`：** 多字段共享已打开的 reader 实例，避免重复打开文件和加载索引。
- **DSL 级缓存：** 以整段 DSL 表达式作为缓存键，相同查询的结果可跨 segment 复用。

条件越多，与多个独立 MATCH 的性能差距越大。

### 典型用法

```sql
-- TERM + PHRASE + NOT
SELECT request_id, error_msg, latency_ms
FROM inference_logs
WHERE search('
  level:ERROR
  AND error_msg:"CUDA out of memory"
  AND NOT module:healthcheck
  AND model_name:gpt*
')
  AND log_time > NOW() - INTERVAL 1 HOUR
ORDER BY latency_ms DESC LIMIT 100;

-- BM25
SELECT request_id, error_msg, score() AS relevance
FROM inference_logs
WHERE search('error_msg:"memory allocation failed" OR error_msg:"CUDA error"')
ORDER BY relevance DESC LIMIT 20;

-- 在 VARIANT 内搜索
SELECT * FROM agent_logs
WHERE search('NESTED(steps, status:error AND tool:code_exec)');

-- search + 聚合
SELECT model_name, COUNT(*) AS error_count,
       PERCENTILE_APPROX(latency_ms, 0.99) AS p99_latency
FROM inference_logs
WHERE search('level:ERROR AND error_msg:"CUDA out of memory"')
  AND log_time > NOW() - INTERVAL 1 HOUR
GROUP BY model_name ORDER BY error_count DESC;
```

`search()` 返回一个布尔谓词，可直接参与 JOIN、窗口函数和子查询，使文本检索成为标准 SQL 能力的一部分。

## 突破百万 Token 上下文：原生支持 100MB 级超大 JSON 全量存储

在长文本、多轮交互、RAG 与 Agent 场景中，**百万 Token 上下文能力**已经从"可选项"变成"刚需"。而 Apache Doris 此次升级，直接实现**单条 100MB 级超大 JSON 原生存储**，彻底打通"数据库 + 大模型上下文"的全链路壁垒。

这意味着用户一整段交互生命周期的数据 —— 包括超长多轮会话、全文长文档、音视频转写文本、完整的 Agent 执行轨迹、工具调用全链路日志、RAG 切片上下文等 —— **无需拆分、截断或依赖外部存储**，可直接、完整、原生地存入 Doris 数据库。

更关键的是，所有超长文本入库之后，你可以像查询普通结构化字段那样，对 100MB 级上下文进行精确检索、条件过滤、聚合统计与 JOIN 关联，真正实现"上下文数据可存、可查、可管、可治理"。

在此之前，业界常见的方案是：元数据存数据库，超长上下文/原始文本存对象存储（如 S3）。查询时需要先查元数据，再去拉取对象文件，然后做文本拼接和解析。这套链路长、依赖多、一致性难以保证、故障点多、查询延迟高。

依托 Doris 百万 Token 级超大文本能力，"数据库 + S3 + 元数据管理 + 文本拼接"这一复杂架构可以被显著简化、甚至直接替代：

- **去掉额外的对象存储依赖**
- **去掉元数据与原始文本的一致性维护逻辑**
- **省掉分段存储和拼接解析的开发成本**
- **同时获得**更低的查询延迟、更强的事务保证以及更简的运维架构

最终把超长上下文从"大模型输入的负担"转化为可直接承载、可高效查询、可安全治理的结构化数据资产，为 RAG、智能助手、多轮会话和长文档理解等场景提供极简、可靠、高性能的底层支撑。

## 元数据分离重构：为万列超宽场景深度赋能

在 Search & AI 场景下，大量业务数据天然具备 **超宽、稀疏、半结构化** 的特征：例如 RAG 切片元数据、Agent 执行轨迹、工具调用日志、模型训练与推理特征、车联网遥测数据、智能驾驶事件流等。这类数据普遍包含**大量动态扩展字段**，schema 灵活多变，列数迅速增长，且数据访问存在明显的冷热分化。业务的查询模式同样高度多样化：有的只需访问少量高频热列，有的需要整行读取，还有大量场景对随机点查、高吞吐写入和 Compaction 稳定性都提出了严苛要求。

面对这种万列级超宽表场景，Doris 围绕宽表存储与高效访问做了一系列针对性增强。在 Apache Doris 4.1 之前，系统默认使用 Segment V2 存储格式。该格式在设计上借鉴了 Parquet 等经典列存文件结构，将各类元数据信息集中存放在文件尾部（Footer）。在传统批量扫描和高吞吐分析场景下，这一结构能够保证良好的顺序读性能；然而在随机读、点查与小规模查询等场景下问题就会集中暴露：每次读取都需要先加载并解析完整 Footer 元数据，带来大量无谓的 I/O 和解析开销，最终直接导致随机读性能不佳，难以满足 AI、车联网、实时检索等对随机读敏感的业务诉求。

Segment V3 借鉴了 Lance 以及 Vortex 等新型文件存储格式的做法，将元数据从 footer 中分离，解决万列场景下最容易碰到的元数据膨胀、文件打开慢和随机读开销问题。

- **列元数据外置：** 将 `ColumnMetaPB` 从 Segment Footer 中抽离，按需加载，减少 Footer 膨胀。
- **整数 Plain 编码：** 数值类型默认使用 `PLAIN_ENCODING`，配合压缩降低读取时的 CPU 开销。
- **Binary Plain Encoding V2：** 去除尾部 offsets，改为流式布局，压缩字符串和 JSONB 的存储体积。
- **适用场景：** 超宽表、大量 VARIANT 子列、对象存储冷启动敏感、AI 与车联网等高频随机读的半结构化数据。
- **使用方式：** 建表时指定 `"storage_format" = "V3"`。

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

例如在 7000 列宽表、共 10000 个 segment 上的效果：

<img width="1024" height="1024" alt="Image" src="https://github.com/user-attachments/assets/c551bdee-270c-4273-b22e-7d8f0ba3be75" />

- **文档：** [存储格式](https://doris.apache.org/zh-CN/docs/4.x/table-design/storage-format)

### 稀疏列优化：稀疏分片与 Sparse Cache

对于热路径少、长尾路径多的宽 JSON，4.1 重点优化稀疏读取路径，防止长尾路径集中到单个稀疏列。

- **冷热分层：** 热路径仍保留为列式子列，长尾路径进入稀疏存储，避免子列数持续膨胀。
- **稀疏分片：** 通过 `variant_sparse_hash_shard_count` 将长尾路径按 hash 分散到多个物理稀疏列，降低单列读放大。
- **Sparse Cache：** 为稀疏列新增读缓存，减少高频访问与随机读时的重复 I/O、重复解码与重复反序列化。
- **适用场景：** 车联网遥测、广告画像、用户特征、埋点日志、安全日志等超宽 JSON；key 总量大、甚至不设限，但真正高频查询的热路径只有几十到几百个。

```sql
CREATE TABLE user_feature_wide (
    uid BIGINT,
    features VARIANT<
        'user_id' : BIGINT,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_sparse_hash_shard_count' = '32'
        )
    >
)
DUPLICATE KEY(uid)
DISTRIBUTED BY HASH(uid) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

- **优化效果：** 热点路径继续走列式子列；长尾路径的读取压力被分散到多个稀疏列；对于反复访问同一批长尾路径的查询，抖动也更小。
- **性能测试结果：** [Variant Workload 性能](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#%E6%80%A7%E8%83%BD)
- **文档：** [Sparse 模式指南](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#sparse-%E6%A8%A1%E5%BC%8F)（关键词：稀疏分片）

### DOC 模式：万列场景下更稳的抽取

如果半结构化数据更关注写入快或整段 JSON 文档的频繁读取，DOC 模式会更合适。它先保留原始 JSON，把子列抽取延迟到 compaction 阶段，将写入阶段最重的部分往后推，降低小批量入库到列存时的写放大。

- **延迟物化：** 写入阶段先保留原始 JSON/Map 结构，减少小批量写入时立即展开大量子列的开销。
- **DOC 分片：** 通过 `variant_doc_hash_shard_count` 将 Doc Store 拆分为多个物理分片，加速整段 JSON 返回，并提升 Map 路径抽取的性能。
- **物化阈值控制：** 通过 `variant_doc_materialization_min_rows` 控制物化阈值，低于阈值的批次首次不做子列抽取，统一在 compaction 时处理。
- **适用场景：** AI/LLM 输出、Trace/Span、上下文快照、归档事件流、车联网原始事件回放等需要返回完整文档的场景。
- **使用方式：** 开启 `variant_enable_doc_mode` 后，根据写入批大小设置 `variant_doc_materialization_min_rows`，根据 key 总数或整段 JSON 大小估算 `variant_doc_hash_shard_count`。DOC 模式与稀疏列互斥，建议二选一，并同时配合 `storage_format = "V3"` 使用。

```sql
CREATE TABLE trace_archive (
    ts DATETIME,
    trace_id STRING,
    span VARIANT<
        'service_name' : STRING,
        properties(
            'variant_enable_doc_mode' = 'true',
            'variant_doc_materialization_min_rows' = '100000',
            'variant_doc_hash_shard_count' = '32'
        )
    >
)
DUPLICATE KEY(ts, trace_id)
DISTRIBUTED BY HASH(trace_id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

- **优化效果：** 小批量写入时不会先做大规模子列物化和抽取，写入路径上的 CPU 和内存压力更轻；对于常需要返回整段 JSON 的查询，`SELECT variant_col` 可直接读取 Doc Store。
- **性能测试结果：** [Variant Workload 性能](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#%E6%80%A7%E8%83%BD)
- **文档：** [DOC 模式模板](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide#doc-mode-template)（关键词：DOC 模式）

## 更快的 OLAP

Doris 一直以极速的查询体验被业界称道。我们始终把"更快"作为永恒的追求，从未停止。在 OLAP 场景下，查询性能直接决定分析效率、资源成本与业务响应速度，更快的响应一直是引擎迭代的核心方向。为此，Doris 4.1 围绕三条核心路径对执行引擎和查询优化器做了系统性增强：

- **减少无效处理：** 通过精准的数据剪裁与计算下推，只处理必要的数据
- **降低数据流转：** 优化 Shuffle 机制与网络传输，最小化跨节点开销
- **提升执行效率：** 持续升级算子与表达式性能，压榨硬件算力

一系列深度优化让 Doris 在标准 benchmark 和真实业务场景中再次取得显著的性能提升，继续向更快的实时分析目标迈进。

### 多表分析场景

为了客观公正地衡量数据库在真实业务场景下的性能，业界普遍采用标准化的基准测试。其中 TPC-H、TPC-DS 与 SSB 正是衡量多表关联分析能力的"三驾马车"：

- **TPC-H：** 模拟决策支持场景，通过一系列即席查询与并发数据修改，重点考察数据库在多表 join、聚合等方面的综合性能。
- **TPC-DS：** 作为 TPC-H 的继任者，TPC-DS 更贴近现实，数据模型与查询模式覆盖零售、电商等多行业的复杂业务，是衡量现代数据仓库性能的权威标准。
- **SSB（Star Schema Benchmark）：** 聚焦星型模型的性能测试，简化了 TPC-H 模型，更专注于事实表和维表之间的大规模关联查询，是检验数据库处理经典数仓模型能力的试金石。

| Benchmark | Apache Doris 4.1 | Apache Doris 4.0 | 提升比例 |
| --- | ---: | ---: | ---: |
| SSB SF1000    | 10934 ms  | 12495 ms  | 14.28% |
| TPC-H SF1000  | 53275 ms  | 65312 ms  | 22.59% |
| TPC-DS SF1000 | 159562 ms | 190031 ms | 19.10% |

### 宽表分析场景

作为业界目前公认最严苛的单表查询性能测试标准，ClickBench 基于真实的网站访问日志数据，通过 100GB 级数据量与 43 条高难度查询，全面考察数据库在列存、向量化执行、压缩算法等方面的硬实力。

在严苛的 c7a.metal-48xl 机型实测中，Apache Doris 4.1 **在冷查询和存储空间两项中均登顶榜首，综合得分仅以微小差距位列第二**，紧随 **ClickHouse (web)** 之后。具体结果如下：

冷查询：

<img width="2693" height="256" alt="Image" src="https://github.com/user-attachments/assets/169a73e0-7523-4547-9d30-096c197a8348" />

综合得分：

<img width="2462" height="256" alt="Image" src="https://github.com/user-attachments/assets/e259b134-b483-4c75-8aeb-069ff4d1f145" />

### 重要优化

在 Apache Doris 4.1 中，我们引入了数十项性能优化。通过选择更智能的执行路径，减少了数据计算与跨网络的数据传输；通过优化关键算子与函数，提升了执行路径上关键节点的性能；通过新增对用户透明的自动化缓存机制，显著加速了真实场景下的执行速度。以下是 Apache Doris 4.1 引入的几个重要优化点。

#### 聚合下推

Aggregate Pushdown Through Join 智能地将聚合率高的聚合算子"拆分"并"下推"到 join 操作的两侧。先对参与 join 的单表数据做局部聚合，大幅减少 join 前的数据行数，最后对 join 后的少量数据做全局聚合。这种"先压缩、再关联"的策略，就像在数据洪流中设置多级闸门，从源头减少参与连接的数据量，从而大幅降低内存使用和计算延迟，是提升复杂关联查询性能的关键手段。

在我们构造的测试集上，**整体性能提升超过 200%。提升超过 50% 的用例占一半以上，将近 1/3 的用例提升超过 100 倍。**

#### 聚合展开优化

聚合展开优化能智能识别聚合展开中粒度最细的聚合组及其聚合率。在条件满足时，将执行模型从多组并行聚合转换为先执行最细粒度的聚合组以大幅减少数据量，再基于该结果执行其他聚合组，从而显著降低计算延迟。

在我们构造的测试集上，**整体性能提升超过 10%。超过 1/5 的用例提升超过 20%，最大提升达到 160%，最大回归不超过 5%。**

#### 嵌套列剪裁

嵌套列剪裁技术深入数据类型内部，能精确解析嵌套字段的层级结构。当查询请求指向深层子字段时，优化器会生成一个精细化的读取计划，只从磁盘读取该子字段对应的物理数据，跳过其他兄弟字段。Apache Doris 4.1 中的嵌套列剪裁同时支持内部表数据和 ORC、Parquet 格式的外部表数据。

在我们构造的测试集上，**整体性能提升超过 60%。在最极端的场景下，提升超过 700%。**

#### Condition Cache

在大规模分析场景中，查询常常包含重复的过滤条件（Condition），例如：

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

这类查询会对同一份数据分片（Segment）反复执行相同的过滤逻辑，造成冗余的 CPU 和 IO 开销。

为了解决这一问题，Apache Doris 引入了 Condition Cache 机制。它可以缓存某个 Segment 上特定条件的过滤结果，并在后续查询中直接复用，从而减少不必要的扫描和过滤，显著降低查询延迟。

在复杂查询场景下，整体性能提升超过 10%。

详细原理请参考 Apache Doris 官方文档：[Condition Cache](https://doris.apache.org/docs/4.x/query-acceleration/condition-cache)

#### 中间结果缓存

在分析型查询场景下，同一个聚合查询经常会在底层数据未发生变化的情况下被反复执行。例如：

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

每次执行都会重新扫描相同的 Tablet 并重新计算完全一致的聚合结果，浪费大量 CPU 和 I/O 资源。

为了解决这一问题，Apache Doris 提供了 Query Cache 机制。它会缓存 pipeline 执行引擎产生的中间聚合结果，当后续查询具有相同的执行上下文时，直接返回缓存结果，从而大幅降低查询延迟。

详细原理请参考 Apache Doris 官方文档：[Query Cache](https://doris.apache.org/docs/4.x/query-acceleration/query-cache)

#### Case When 优化

Case When 是分析型场景中非常核心的语法，是将原始数据转化为业务洞察的核心工具，能够完成业务逻辑的语义转换、行级动态分类与多维度条件聚合等复杂功能。通过优化 Case When 语句的执行性能，可以显著提升关键场景的执行效率。

Apache Doris 4.1 通过引入分支合并、分支消除、公共子表达式抽取、枚举值抽取与下推等优化技术，显著提升了包含 Case When 语句的查询的执行性能。

在我们构造的测试集上，**性能平均提升超过 200%，极端场景下提升超过 50 倍。**

#### 其他

除上述优化外，Apache Doris 4.1 在 Join order 选择和 Shuffle 方式选择上更加智能，降低了查询执行的整体内存使用，提升了 Join 与 Exchange 算子的执行性能，并优化了 Like、FROM_UNIXTIME、Count 等关键函数的执行性能。

## 存算分离

目前，Apache Doris 存算分离架构的用户规模已正式突破 **2000 家**。越来越多的企业在生产环境中选择存算分离架构，其稳定性和查询性能也成为用户高度关注的核心指标。为此，我们持续投入深度优化，不断打磨架构的可靠性与执行效率。

### File Cache 优化

通过持久化 File Cache 元数据，避免启动时消耗大量 IO，优化启动速度。同时新增系统表 `information_schema.file_cache_info`，对 File Cache 的使用提供更好的可观测性，以 SQL 方式暴露 File Cache 中的 block 详情，支持按 `tablet_id`、`be_id`、`cache_path`、`type` 等维度统计缓存空间占用，帮助用户快速定位热点数据、缓存倾斜、异常膨胀等问题。

**典型用法 1：**

```sql
mysql> select * from information_schema.file_cache_info where TABLET_ID = 1761571031445;
+----------------------------------+---------------+-------+--------+-------------+-----------------+---------------+
| HASH                             | TABLET_ID     | SIZE  | TYPE   | REMOTE_PATH | CACHE_PATH      | BE_ID         |
+----------------------------------+---------------+-------+--------+-------------+-----------------+---------------+
| 468448215c52334ae5bee147259b1027 | 1761571031445 | 15120 | index  |             | /mnt/disk1/project/filecache | 1761571031251 |
| 71bb73d34cd8ffe280b16dd329df5ba1 | 1761571031445 | 13117 | index  |             | /mnt/disk1/project/filecache | 1761571031251 |
| 77c6b69d1a7c4fe740a11bab5c1bbaa3 | 1761571031445 | 12249 | index  |             | /mnt/disk1/project/filecache | 1761571031251 |
+----------------------------------+---------------+-------+--------+-------------+-----------------+---------------+
```

**典型用法 2：**

```sql
SELECT be_id, tablet_id, type, SUM(size) AS cache_bytes
    FROM information_schema.file_cache_info
    WHERE tablet_id = 1761571031445
    GROUP BY be_id, tablet_id, type
    ORDER BY cache_bytes DESC;
```

该能力尤其适用于以下场景：排查某张表或分区为何占用大量本地缓存；观察本地缓存文件块归属于哪张表或哪个分区；观察各 BE 上的缓存分布是否均衡；为扩缩容、冷查询优化、缓存策略调优等场景下的容量规划提供更直接的依据。

### 极致弹性优化

在存算分离模式下，可以在分钟级内快速完成百万规模的扩缩容。Balance 调度不再依赖全局 tablet 数量，弹性能力大幅提升。

### 冷查询优化

通过基于 Doris 页扫描语义的 prefetching，对 Doris 内表的冷查询做了极致性能优化。调整参数可以充分利用远端存储的带宽，从而获得最优的 IO 性能。

### 更好地支持超大规模部署

对 FE 对象中的每个 replica/tablet 进行"瘦身"，在 tablet 数达到百万级别时 FE 的内存使用降低 30% 以上。

### Meta-service 性能优化

通过引入 cache 机制，减少了对 meta-service 模块的大量重复请求，从而提升元数据吞吐。同时优化了存算分离模式下查询某些系统表时对 meta-service 的访问。

### 对象存储成本优化

通过节点级合并，解决了高频导入场景下大量对象请求和大量小对象文件的问题，成本优化幅度超过 90%。

## 数据湖

4.1.0 版本在数据湖方向实现了重大突破，从格式支持能力、查询性能到生态兼容性，全方位提升 Doris 作为统一湖仓分析引擎的核心竞争力。用户仅通过 Doris SQL 即可完成 Iceberg、Paimon 等主流开放湖格式数据的读、写、管理与维护，无需依赖 Spark 等外部引擎。

### Lakehouse 全生命周期管理

Doris 4.1.0 实现了对主流开放湖格式数据的全生命周期管理能力。用户可以通过 Doris SQL 完成从库表创建到数据增删改的所有操作，真正实现"一个引擎管理整个数据湖"。

- **Iceberg V2/V3 完整读写支持**

  Doris 现已完整支持 Iceberg V2 和 V3 格式的 INSERT、UPDATE、DELETE、MERGE INTO 操作，同时支持 Iceberg V3 标准中的多项新特性，如 Deletion Vector 和 Row Lineage。这意味着用户无需依赖 Spark 等外部引擎，就可以在 Doris 中完成 Iceberg 数据湖的读、写、维护 —— 从数据入湖、行级更新到增量删除，整个 TTL 都可以在 Doris 内闭环完成。

  **文档：** [Iceberg Catalog](https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog)

- **Paimon 库表管理**

  用户现在可以通过 Doris SQL 直接对 Paimon 库表进行管理操作，包括 CREATE DATABASE、CREATE TABLE 等 DDL 操作。我们计划在 4.1 后续版本进一步支持 Paimon 表的写入操作，实现 Paimon 数据的全生命周期管理。

  **文档：** [Paimon Catalog](https://doris.apache.org/docs/4.x/lakehouse/catalogs/paimon-catalog)

### 数据湖查询性能优化

本版本引入了多项针对性的优化措施，显著提升数据湖数据的查询性能。

- **Iceberg sorted write**

  新增了 Iceberg 表的排序写入能力 —— 用户可以在写入或 compaction 时指定按特定列对 Iceberg 数据进行排序。排序后的数据文件会携带排序元数据（lower/upper bounds），查询引擎据此可以进行高效的数据文件剪裁，跳过不相关的数据文件。在 TPC-DS 标准测试集下，排序后数据的查询性能提升约 15%。

  **文档：** [Iceberg Sorted Write](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/catalogs/iceberg-catalog#%E5%88%9B%E5%BB%BA%E5%92%8C%E5%88%A0%E9%99%A4%E8%A1%A8)

- **Iceberg Manifest Cache**

  新增 Iceberg Manifest 级别的元数据缓存机制。Iceberg 查询规划阶段，FE 需要逐级读取并解析 ManifestList → Manifest → DataFile/DeleteFile 的元数据链。在高频查询热点分区或执行小批量查询时，相同的 Manifest 文件会被反复读取和解析，带来大量 I/O 与 CPU 开销。本版本引入 Manifest 缓存避免重复解析同一个 Manifest，复杂的元数据解析可以降低到数百毫秒级。

- **Parquet Page Cache**

  新增 Parquet 格式的 Page Cache 特性，可将解压后的数据页缓存在内存中。在高频查询场景下，可显著降低因重复解压和磁盘 I/O 造成的查询延迟，进一步提升湖上数据的交互式查询体验。在 ClickBench Parquet 测试集上，整体性能提升超过 **20%**。

  **文档：** [Parquet Page Cache](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/best-practices/optimization#parquet-page-cache)

### 数据湖生态扩展

4.1.0 大幅扩展了 Catalog 接入方式和底层存储系统支持，让 Doris 能够更灵活地融入各种数据湖架构。

- **Catalog 服务扩展**
  - **Iceberg/Paimon JDBC Catalog**

    支持以 JDBC 数据库作为后端存储的 Iceberg/Paimon 元数据服务。

    **Iceberg 文档：** [Iceberg JDBC](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/iceberg-jdbc)

    **Paimon 文档：** [Paimon JDBC](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/paimon-jdbc)

  - **阿里云 DLF Iceberg/Paimon REST Catalog**

    阿里云用户可以通过 Doris 直接访问由 DLF（Data Lake Formation）托管的 Iceberg/Paimon 数据湖，实现对云上数据湖的无缝接入。

    **文档：** [阿里云 DLF](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/metastores/aliyun-dlf)

- **存储系统适配**
  - **华为云 OBS 并行文件系统：** 新增对华为云 OBS 并行文件系统的支持，满足华为云用户在数据湖场景下的存储需求。**文档：** [华为 OBS](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/storages/huawei-obs)
  - **JuiceFS：** 新增对 JuiceFS 分布式文件系统的支持，进一步扩展 Doris 在多云和混合存储环境下的适配能力。**文档：** [JuiceFS](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/storages/juicefs)

### 联邦分析易用性增强

在 4.1.0 中，Doris 还增强了数据互操作性与易用性。

- **缓存准入控制**

  在 Lakehouse 场景下，全表扫描的 ETL 作业或即席查询可能读取大量冷数据，迅速塞满缓存并驱逐高频访问的热数据，导致缓存污染和整体查询性能下降。4.1.0 引入缓存准入控制能力，用户可以通过配置规则精细化管理哪些查询数据允许写入 Data Cache，从而保护热数据的缓存命中率。

  - **多维度规则配置：** 支持基于用户、Catalog、Database、Table 四个维度配置 blocklist（禁止缓存）或 allowlist（允许缓存）规则。规则按精度从细到粗依次匹配（Table → Database → Catalog → Global），同级别 blocklist 优先。
  - **动态热加载：** 规则以 JSON 文件存于指定目录，修改后无需重启 FE 节点即自动生效。
  - **决策可观测：** 通过 EXPLAIN 可以查看查询的缓存准入决策（ADMITTED/DENIED）、命中规则和匹配时间，方便验证与调优。

    **文档：** [Data Cache](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/data-cache)

- **MaxCompute 数据写入**

  支持在 MaxCompute 外部 Catalog 中执行 CREATE TABLE、DROP TABLE、INSERT INTO 等操作，打通从 Doris 到 MaxCompute 的完整数据导出链路。同时支持 MaxCompute 中的 ARN 跨账号访问。至此，Doris 与 MaxCompute 之间双向读写链路建立完毕，让用户更便捷地融入阿里云生态。

  **文档：** [MaxCompute Catalog](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/catalogs/maxcompute-catalog)

- **Parquet 元数据分析**

  新增 Parquet 元数据表值函数（TVF），用户可通过 SQL 查询 Parquet 文件的元数据信息（如分区、row group、列统计等）。适用于数据工程师排查 Parquet 文件结构问题、验证分区剪裁效果、调优数据湖查询性能等场景。

  **文档：** [Parquet Meta TVF](https://doris.apache.org/zh-CN/docs/4.x/sql-manual/sql-functions/table-valued-functions/parquet-meta)

### 其他

- **新增 `INSERT INTO TVF` 将查询结果导出到本地/HDFS/S3 文件**

  支持通过 `INSERT INTO tvf(...)` 语法将查询结果导出到本地文件系统、HDFS 或 S3 等外部存储。将 TVF 视为可写的"表"，统一了数据读写访问模式（SELECT 读、INSERT 写）。适用于需要定期导出分析结果的 ETL 场景，语义上比 `OUTFILE` 更一致、更易扩展。

  **文档：** [INSERT INTO TVF 文件导出](https://doris.apache.org/zh-CN/docs/4.x/lakehouse/file-analysis#%E5%9C%BA%E6%99%AF%E5%9B%9B%E5%AF%BC%E5%87%BA%E6%9F%A5%E8%AF%A2%E7%BB%93%E6%9E%9C%E5%88%B0%E6%96%87%E4%BB%B6)

## ETL & ELT

Apache Doris 始终以离线在线一体化为核心架构目标，致力于在同一个引擎中同时支持实时交互分析与大规模离线批处理，彻底突破传统数仓"实时与离线分裂、多套系统冗余部署"的架构瓶颈。为实现这一目标，Doris 持续深化原生 ETL/ELT 计算能力。

### MERGE INTO

在数仓场景中，经常需要将增量数据（如 CDC）合并到目标表中，也存在一些 ETL 作业，包含：

- **更新已存在的数据（UPDATE）**
- **插入新数据（INSERT）**
- **删除数据（DELETE）**

传统方式需要多步 SQL 或复杂的逻辑，维护成本较高。新增的标准 SQL `MERGE INTO` 支持在单条语句中完成 **UPSERT / DELETE** 操作。

```sql
MERGE INTO target t
USING source s
ON t.id = s.id
WHEN MATCHED THEN
    UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN
    INSERT (id, value) VALUES (s.id, s.value);
```

### 落盘能力增强

在大规模分析场景（如大表 Join、高基数聚合、全局排序）中，查询执行往往高度依赖内存资源。一旦数据规模超过内存容量，查询很容易 OOM 或性能急剧下滑。传统数据库通常需要**加大机器内存或扩容集群**来解决，资源成本高、使用门槛高，也限制了在轻量环境下的使用场景。在 Doris 4.0 中我们引入了落盘能力，4.1 版本对执行引擎的 **Spill to Disk** 能力进行了全面增强，实现了：

- **多级递归落盘（Recursive Spill）**

  让算子能够多阶段、分层地将中间数据安全写入磁盘，并在需要时高效读回，避免一次性内存炸裂。

- **算子级全面覆盖**

  覆盖 Hash Join、Aggregation、Sort 等核心算子，在极端大数据量下依然能稳定执行。

- **自适应内存控制机制**

  动态触发落盘，在内存使用和磁盘 IO 之间取得平衡，保证查询稳定性。

#### 突破性能力

在增强的 Spill 机制下，Doris 实现了一个极具代表性的能力突破：仅用单 BE 节点 + 8GB 内存，成功跑通了所有 TPC-DS 10TB 查询。

这意味着：

- **不再依赖**大内存服务器或大规模集群
- **依然可以**在资源受限环境下完成超大规模分析任务
- **甚至可以**在普通笔记本（如 MacBook）上完成 TB 级数据分析

## 核心引擎

### UNNEST

随着日志、埋点、JSON 等半结构化数据的广泛使用，越来越多数据以 ARRAY 或嵌套结构存储。在数据分析场景下，用户通常需要将这些嵌套数据打平，再进行过滤、聚合等操作。

同时，主流数据分析引擎（如 PostgreSQL、Trino）均已提供 UNNEST 语法用于数组展开，这一能力已成为用户跨系统迁移或使用多引擎时的通用依赖。

此前 Doris 没有统一支持数组展开，用户往往要依赖复杂函数或重写 SQL，使用门槛较高，对其他系统的兼容性也较差。

```sql
SELECT user_id, tag
FROM user_profile,
UNNEST(tags) AS t(tag);
```

### 递归公共表表达式（Recursive CTE）

在组织架构、图结构、层级关系（如父子节点、路径查找）等场景中，用户需要执行递归查询。例如：

- **展开组织树**
- **分类层级遍历**
- **图路径搜索**

```sql
WITH RECURSIVE org_tree AS (
    SELECT id, parent_id, name
    FROM org
    WHERE parent_id IS NULL

    UNION ALL

    SELECT o.id, o.parent_id, o.name
    FROM org o
    JOIN org_tree t ON o.parent_id = t.id
)
SELECT * FROM org_tree;
```

### ASOF JOIN

在金融、物联网、监控等场景下，经常需要基于时间做**"最近匹配"**的关联查询，例如：

- **将交易数据与最新行情匹配**
- **将设备事件与最近状态匹配**
- **时间序列数据对齐**

传统的等值 JOIN 无法满足这种"时间上最近匹配"的需求。ASOF JOIN 支持基于时间列以**最近值匹配（<= 或 >=）**的方式进行 Join。

```sql
SELECT t1.ts, t1.value, t2.price
FROM trades t1
ASOF JOIN prices t2
ON t1.symbol = t2.symbol
AND t1.ts >= t2.ts;
```

## 存储

- **列压缩与编码优化**

  存储层持续优化列存压缩与编码策略，新增更高效的二进制列编码与预解码能力，优化整型列默认编码，逐步将默认压缩算法调整为 ZSTD。在宽表与明细数据场景下，可进一步降低存储占用，提升冷读性能。

- **S3 连续导入**

  支持基于 S3 文件源创建连续导入作业，系统可以自动检测新增文件并持续执行导入，适用于对象存储场景下的增量数据接入。

  **文档：** [Continuous Load S3](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-s3)

- **MySQL / PostgreSQL 实时同步**

  支持将 MySQL、PostgreSQL 数据库变更实时接入 Doris，覆盖全量初始化与后续增量同步，帮助用户更便捷地构建业务数据库到 Doris 的实时分析链路，满足业务库实时数仓、数据汇聚、分析加速等场景诉求。

  **文档：**

  - **[Continuous Load MySQL](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-mysql-single)**
  - **[Continuous Load PostgreSQL](https://doris.apache.org/zh-CN/docs/4.x/data-operate/import/streaming-job/continuous-load-postgresql-single)**

- **自适应写入调度**

  支持自适应调整 MemTable Flush 线程池大小，可以根据集群实时负载自动匹配更合适的写入并发，在高写入场景下更好地平衡吞吐、资源占用与稳定性。

- **主键模型多流更新**

  主键模型支持通过 sequence_mapping 进行多流合并更新，不同数据流可以分别更新同一张表的不同列，并按各自 sequence 字段完成合并，适合实时流更新与离线数据补写并行写入的场景。

- **Routine Load 灵活列更新**

  Routine Load 支持灵活的部分列更新，允许对非主键列进行灵活更新，同一批次内不同行可以更新不同列。适用于状态变更、特征回填、标签更新等场景，进一步简化数据维护流程。

- **Routine Load 动态参数调优**

  支持通过 ALTER ROUTINE LOAD 动态调整导入属性，包括列映射、过滤条件、分区等配置，降低线上任务调优和修改的成本。

- **Routine Load 自适应批处理**

  Routine Load 支持基于积压情况自适应调整批处理参数，在高吞吐场景下更好地平衡消费效率与稳定性。

- **导入审计可观测**

  支持将 Stream Load 记录写入审计日志系统表，方便统一查询导入历史，便于排障与审计分析。

## TIMESTAMP WITH TIME ZONE

在全球化业务和多时区数据处理场景中（如跨地域日志、用户行为分析、金融交易），时间数据往往携带显式时区信息。例如：

- **用户行为发生在不同国家/时区**
- **服务器与客户端存在时区差**
- **需要统一进行跨时区对齐分析**

在之前的版本中，Doris 主要使用 DATETIME（无时区）类型，用户必须手工处理时区转换，容易出错且增加开发成本。而在主流数据库（如 PostgreSQL）中，TIMESTAMP WITH TIME ZONE 已经成为标准类型，被广泛用于跨系统数据交互和兼容。

TIMESTAMPTZ 是 Doris 中用来存储带时区信息的日期时间数据类型，对应标准 SQL 的 TIMESTAMP WITH TIME ZONE。TIMESTAMPTZ 的取值范围与 DATETIME 相同，即 [0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999]。TIMESTAMPTZ 支持指定精度，格式为 TIMESTAMPTZ(p)，其中 p 表示精度，取值范围 [0, 6]，默认值为 0。也就是说，TIMESTAMPTZ 等价于 TIMESTAMPTZ(0)。默认输出格式为 `'yyyy-MM-dd HH:mm:ss.SSSSSS+XX:XX'`，其中 +XX:XX 表示时区偏移（SSSSSS 的位数由精度 p 决定）。

TIMESTAMPTZ 的实现并不会逐行存储时区信息，而是采用如下机制：

- **存储时：** 将输入时间值统一转换为 UTC（协调世界时）后再存储。
- **查询时：** 根据会话的时区设置（由 `time_zone` 变量指定），将 UTC 时间自动转换为对应时区的时间进行展示。

因此可以把 TIMESTAMPTZ 理解为带有时区转换能力的 DATETIME 类型，Doris 内部自动完成时区转换。

- **输入字符串包含时区信息时**（如 `"2020-01-01 00:00:00+03:00"`），Doris 会使用该时区信息进行转换。
- **输入字符串不包含时区信息时**（如 `"2020-01-01 00:00:00"`），Doris 会使用当前会话的时区设置进行转换。

TIMESTAMPTZ 与 DATETIME 类型支持相互转换，转换过程中会根据时区进行相应调整。TIMESTAMPTZ 支持隐式转换为 DATETIME，使得不直接支持 TIMESTAMPTZ 的函数也能处理此类型数据。

```sql
select cast("2020-01-01 00:00:00" as timestamptz);
+--------------------------------------------+
| cast("2020-01-01 00:00:00" as timestamptz) |
+--------------------------------------------+
| 2020-01-01 00:00:00+08:00                  |
+--------------------------------------------+

select cast("2020-01-01 00:00:00.123456" as timestamptz(5));
+------------------------------------------------------+
| cast("2020-01-01 00:00:00.123456" as timestamptz(5)) |
+------------------------------------------------------+
| 2020-01-01 00:00:00.12345+08:00                      |
+------------------------------------------------------+
```

# 行为变更

- 新增 FE 配置 `max_bucket_num_per_partition`，用于限制建表或新增分区时单个分区的最大 bucket 数，默认值为 768。
