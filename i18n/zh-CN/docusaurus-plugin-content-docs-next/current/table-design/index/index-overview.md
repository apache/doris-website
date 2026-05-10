---
{
    "title": "索引概述",
    "language": "zh-CN",
    "description": "Apache Doris 索引选型指南：点查索引、跳数索引、倒排索引、BloomFilter、NGram BloomFilter 等多种索引加速不同查询场景。"
}
---

Apache Doris 提供多种索引以加速不同的查询场景。本文将从查询场景出发，帮助你快速理解各类索引的原理、适用范围以及选择策略。

## 快速选型指南

在深入了解索引细节前，可以参考以下原则快速做出选型：

1. **最频繁使用的过滤条件**：将其指定为 Key 列，自动建立前缀索引。前缀索引过滤效果最好，但每个表只能有一个，因此要用在最高频的过滤条件上。
2. **非 Key 字段需要过滤加速**：首选[倒排索引](./inverted-index/overview.md)，它适用面广、支持多条件组合。如果有特殊需求可选用以下两种：
    - 字符串 LIKE 匹配需求：增加 NGram BloomFilter 索引
    - 对索引存储空间敏感：使用 BloomFilter 索引替代倒排索引
3. **文本全文检索**：使用[倒排索引](./inverted-index/overview.md)，配合分词器实现关键词匹配、短语查询、多字段联合检索等能力。
4. **向量相似度检索**：使用[向量索引（ANN 索引）](./vector-index/overview.md)，加速 RAG、语义搜索、推荐、图像/音视频检索等近似最近邻查询。
5. **性能不及预期**：通过 QueryProfile 分析索引过滤掉的数据量和消耗的时间，详见各个索引的专题文档。

## 按查询场景选择索引

Apache Doris 针对不同查询场景提供四类索引：**点查索引**、**跳数索引**、**全文检索索引** 与 **向量索引**。

### 场景一：满足条件的行较少（点查索引）

**适用场景**：精确匹配少量数据，例如根据主键查询、根据用户 ID 拉取明细。

**加速原理**：通过索引直接定位到满足 WHERE 条件的行，并读取这些行，避免逐行扫描。

![Point Query Index](/images/next/table-design/point-query-index.jpg)

Apache Doris 提供两种点查索引：

- **[前缀索引](./prefix-index.md)**：Apache Doris 按照排序键以有序方式存储数据，并每隔 1024 行创建一个稀疏前缀索引。索引中的 Key 是当前 1024 行中第一行的排序列值。当查询涉及已排序列时，系统会找到相关的 1024 行组的第一行并从那里开始扫描。
- **[倒排索引](./inverted-index/overview.md)**：对建立倒排索引的列，构建每个值到对应行号集合的倒排表。等值查询时，先从倒排表中查到行号集合，然后直接读取对应行的数据，避免逐行扫描，从而减少 I/O 加速查询。倒排索引还能加速范围过滤、文本关键词匹配，算法更加复杂但基本原理类似。

:::note
之前的 BITMAP 索引已被功能更强的倒排索引取代。
:::

### 场景二：满足条件的行较多（跳数索引）

**适用场景**：分析类查询，需要过滤大批量数据，例如时间范围聚合、维度筛选等。

**加速原理**：通过索引判断哪些数据块**不**满足 WHERE 条件，跳过这些数据块，只读取可能满足条件的数据块，再做一次逐行过滤得到最终结果。

![Skip Index](/images/next/table-design/skip-index.jpg)

Apache Doris 提供三种跳数索引：

- **ZoneMap 索引**：自动维护每一列的统计信息，为每一个数据文件（Segment）和数据块（Page）记录最大值、最小值、是否有 NULL。对于等值查询、范围查询、IS NULL，可以通过最大值、最小值、是否有 NULL 判断数据文件和数据块是否可能包含满足条件的数据，如果不包含则跳过对应文件或数据块，减少 I/O 加速查询。
- **[BloomFilter 索引](./bloomfilter.md)**：将索引列的可能取值存入 BloomFilter 数据结构。BloomFilter 可以快速判断一个值是否存在，且存储空间占用很低。对于等值查询，如果判断该值不在 BloomFilter 中，就可以跳过对应的数据文件或数据块，减少 I/O 加速查询。
- **[NGram BloomFilter 索引](./ngram-bloomfilter-index.md)**：用于加速文本 LIKE 查询。基本原理与 BloomFilter 索引类似，区别在于存入 BloomFilter 的不是原始文本值，而是对文本进行 NGram 分词后的每个词。对于 LIKE 查询，将 LIKE 的 pattern 也进行 NGram 分词，判断每个词是否在 BloomFilter 中，如果某个词不在则对应的数据文件或数据块就不满足 LIKE 条件，可以跳过这部分数据，减少 I/O 加速查询。

### 场景三：文本全文检索（倒排索引）

**适用场景**：日志分析、内容搜索、客服工单挖掘等需要在文本字段中按关键词、短语、模式匹配查找的场景。

**加速原理**：将文本通过分词器切分成词项（Term），对每个词项构建到对应行号的倒排表。查询时先对检索词做同样的分词，再从倒排表中取出包含这些词的行号集合，并按 AND/OR/NOT 等关系合并，最终直接读取这些行，避免对原文逐行扫描和正则匹配。

![Full-Text Search](/images/next/table-design/full-text-search.jpg)

详细用法见[倒排索引](./inverted-index/overview.md)。Apache Doris 倒排索引支持：

- **关键词检索**：`MATCH_ANY`（任意一个词命中）、`MATCH_ALL`（多个词都命中）。
- **短语查询**：`MATCH_PHRASE` 支持顺序敏感的短语匹配，可指定词距 `slop`；`MATCH_PHRASE_PREFIX` 支持短语 + 末词前缀匹配；`MATCH_REGEXP` 支持对分词后词项做正则匹配。
- **多语言分词**：内置 `english`、`chinese`、`unicode`、`icu`、`basic`、`ik` 等多种分词器，覆盖中英文、混合文本与多语言场景。
- **多列联合检索**：通过 `multi_match` 函数对多个字段做 OR/AND/短语/前缀检索。
- **与普通过滤组合**：与等值、范围、`IN` 等条件以及其他索引任意 AND/OR/NOT 组合，复用同一份倒排索引完成查询。

### 场景四：向量相似度检索（向量索引）

**适用场景**：RAG（检索增强生成）、语义搜索、推荐系统、图像 / 音频 / 视频检索等需要按向量相似度查找 Top-K 最近邻或基于距离阈值过滤的场景。

**加速原理**：传统方式需要将查询向量与每条数据计算一次距离，代价随数据量线性增长。向量索引（ANN，Approximate Nearest Neighbor）通过预先在向量集合上构建图（如 HNSW）或聚类（如 IVF）结构，把搜索空间限制在少量候选向量上，从而以可控的精度损失换取数量级的查询提速。

![Vector Search](/images/next/table-design/vector-search.jpg)

详细用法见[向量索引](./vector-index/overview.md)。Apache Doris 自 4.0 版本起支持 ANN 索引，主要能力包括：

- **多种索引算法**：支持 `hnsw`、`ivf`、`ivf_on_disk`，分别适用于内存高 QPS、内存受限、超大规模磁盘场景。
- **多种距离度量**：支持 `l2_distance`（欧氏距离）和 `inner_product`（内积），对向量做 L2 归一化后可等价实现 Cosine 相似度。
- **TopN / 范围 / 组合查询**：通过 `l2_distance_approximate`、`inner_product_approximate` 实现 ANN TopN，也支持基于距离阈值的范围搜索，以及在同一 SQL 中组合 TopN 与 Range 条件。
- **与标量过滤混合检索**：可与倒排索引等二级索引联动，先用结构化条件（如 `MATCH_ANY 'music'`）过滤候选集，再在候选集上做 ANN TopN，实现“带过滤条件的向量检索”。
- **向量量化**：支持 `flat`、`sq8`、`sq4`、`pq` 等量化方式，在召回率与内存 / 磁盘占用之间灵活权衡。

## 索引管理方式

根据是否需要用户手动管理，Apache Doris 的索引可分为两类：

| 管理方式 | 索引类型 | 说明 |
|---------|---------|------|
| 自动维护 | 前缀索引、ZoneMap 索引 | Apache Doris 内建智能索引，无需用户管理 |
| 手动创建 | [倒排索引](./inverted-index/overview.md)、[BloomFilter 索引](./bloomfilter.md)、[NGram BloomFilter 索引](./ngram-bloomfilter-index.md)、[向量索引](./vector-index/overview.md) | 用户根据查询场景自行选择，并手动创建、删除 |

## 索引特点对比

下表汇总了各类索引的优势与局限，便于快速选型：

| 类型 | 索引 | 优点 | 局限 |
|------|------|------|------|
| 点查索引 | [前缀索引](./prefix-index.md) | 内置索引，性能最好 | 一个表只有一组前缀索引 |
| 点查索引 / 全文检索 | [倒排索引](./inverted-index/overview.md) | 支持分词和关键词匹配，任意列可建索引，多条件组合，持续增加函数加速 | 索引存储空间较大，与原始数据相当 |
| 跳数索引 | ZoneMap 索引 | 内置索引，索引存储空间小 | 支持的查询类型少，只支持等于、范围 |
| 跳数索引 | [BloomFilter 索引](./bloomfilter.md) | 比 ZoneMap 更精细，索引空间中等 | 支持的查询类型少，只支持等于 |
| 跳数索引 | [NGram BloomFilter 索引](./ngram-bloomfilter-index.md) | 支持 LIKE 加速，索引空间中等 | 支持的查询类型少，只支持 LIKE 加速 |
| 向量索引 | [ANN 索引](./vector-index/overview.md) | 支持向量相似度 TopN / 范围 / 组合检索，可与标量过滤联动；支持多种量化方式平衡召回与资源 | 仅适用于 `Array<Float>` 列且要求 NOT NULL，仅支持 DUPLICATE KEY 表模型 |

## 索引对运算符与函数的支持

下表列出各类索引对常用运算符和函数的加速支持情况：

| 运算符 / 函数 | 前缀索引 | 倒排索引 | ZoneMap 索引 | BloomFilter 索引 | NGram BloomFilter 索引 |
|--------------|---------|---------|--------------|-----------------|-----------------------|
| `=` | YES | YES | YES | YES | NO |
| `!=` | YES | YES | NO | NO | NO |
| `IN` | YES | YES | YES | YES | NO |
| `NOT IN` | YES | YES | NO | NO | NO |
| `>`, `>=`, `<`, `<=`, `BETWEEN` | YES | YES | YES | NO | NO |
| `IS NULL` | YES | YES | YES | NO | NO |
| `IS NOT NULL` | YES | YES | NO | NO | NO |
| `LIKE` | NO | NO | NO | NO | YES |
| `MATCH`, `MATCH_*` | NO | YES | NO | NO | NO |
| `array_contains` | NO | YES | NO | NO | NO |
| `array_overlaps` | NO | YES | NO | NO | NO |
| `is_ip_address_in_range` | NO | YES | NO | NO | NO |

## 索引设计原则

数据库表的索引设计与优化跟数据特点和查询模式密切相关，需根据实际场景测试和调优。虽然没有“银弹”，Apache Doris 仍持续降低用户使用索引的难度。在实际设计时，可参考前文“[快速选型指南](#快速选型指南)”中的三条原则进行索引选择和测试。
