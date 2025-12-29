---
{
    "title": "文本搜索",
    "sidebar_label": "概述",
    "language": "zh-CN",
    "description": "文本搜索用于在数据集中检索包含特定词项或短语的文档，并根据相关性对结果进行排序。"
}
---

## 概述

文本搜索用于在数据集中检索包含特定词项或短语的文档，并根据相关性对结果进行排序。

相比向量搜索擅长“找全”——利用语义相似性扩展召回范围，文本搜索更擅长“找准”——提供可控、可解释的精确匹配，确保关键词命中与过滤条件的确定性。

在生成式 AI 应用中，尤其是检索增强生成（RAG）场景下，文本搜索与向量搜索相辅相成，两者协同，兼顾语义广度与词法精度，既提升召回率，又保证结果的准确性与可解释性，共同构建可靠的检索基础，为大模型提供更准确、更相关的上下文。

## Doris 文本搜索的演进

从 2.0.0 版本开始，Doris 引入了 倒排索引（Inverted Index），以支持高性能的全文搜索。随着检索场景的多样化与查询复杂度的提升，Doris 在后续版本中持续扩展文本搜索能力，使其能够在更广泛的场景中发挥作用。

### 基础阶段（2.0+）
引入列级倒排索引，提供基础全文检索算子（MATCH_ANY、MATCH_ALL）和多语言分词器，支持在大规模数据集中进行高效的关键词检索。

### 功能扩展（2.x → 3.x）
完善算子体系，新增短语匹配（MATCH_PHRASE）、前缀搜索（MATCH_PHRASE_PREFIX）、正则匹配（MATCH_REGEXP）等高级文本搜索算子，并在 3.1 版本引入自定义分词能力，进一步满足不同应用场景下的文本搜索需求。

### 能力增强（4.0+）
新增文本搜索相关性打分能力与统一的搜索入口，正式引入 BM25 打分算法与 SEARCH 函数。

- BM25 相关性打分：通过 score() 函数根据文本相关性对结果进行排序，可与向量相似度分数结合，实现混合排序。

- SEARCH 函数：提供统一的查询 DSL，支持跨列查询与布尔逻辑组合，简化复杂查询构建，同时进一步提升查询性能。

---

## Doris 核心文本搜索特性

### 丰富的文本算子

Doris 提供了一套覆盖多种检索模式的全文搜索算子，可满足从基础关键词匹配到复杂短语查询的不同需求。

当前版本支持的主要算子包括：

* **`MATCH_ANY` / `MATCH_ALL`**：支持任意词匹配（OR）与全词匹配（AND），适用于通用关键词检索。
* **`MATCH_PHRASE`**：精确短语匹配，支持自定义词距（slop）与顺序控制，常用于邻近词语查询。
* **`MATCH_PHRASE_PREFIX`**：短语前缀匹配，用于自动补全和增量搜索。
* **`MATCH_REGEXP`**：基于正则表达式的匹配，适合模式化文本检索。

这些算子可独立使用，也可通过 `SEARCH()` 函数组合构建复杂逻辑查询。
例如：

```sql
-- 精确短语搜索
SELECT * FROM docs WHERE content MATCH_PHRASE '倒排 索引';

-- 前缀搜索
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX '数据 仓';
```

[查看所有算子 →](./search-operators.md)

---

### 自定义分词（3.1+）

在文本搜索中，分词方式直接决定了检索精度与召回效果。
从 3.1 版本起，Doris 支持 **自定义分词器（Custom Analyzer）**，允许用户根据业务需求灵活定义分词流程，通过组合字符过滤器（char_filter）、分词器（tokenizer）和词元过滤器（token_filter）实现更细粒度的文本控制。

典型使用方式包括：

* **自定义字符过滤**：在分词前进行符号替换、去除或标准化。
* **选择分词算法**：支持 `standard`、`ngram`、`edge_ngram`、`keyword`、`icu` 等多种类型，用于处理不同语言和结构的文本。
* **应用词元过滤**：如 `lowercase`、`word_delimiter`、`ascii_folding` 等，用于规范化和精炼分词结果。

```sql
-- 示例：定义自定义分词器
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
  "tokenizer" = "keyword",
  "token_filter" = "asciifolding, lowercase"
);

-- 在建表时使用自定义分词器
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[了解自定义分词 →](./custom-analyzer.md)

---

### BM25 相关性打分（4.0+）

Doris 实现了 **BM25（Best Matching 25）** 算法用于文本相关性计算，为全文搜索提供排序与打分能力。

* 基于词频（TF）、逆文档频率（IDF）和文档长度的概率模型
* 对长短文本均具良好鲁棒性
* 可通过参数 `k1`、`b` 调整加权策略

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY '实时 OLAP 分析'
ORDER BY relevance DESC
LIMIT 10;
```

[了解更多打分机制 →](./scoring.md)

---

### SEARCH 函数：统一查询入口（4.0+）

`SEARCH()` 函数提供统一的文本检索语法入口，支持多列搜索与布尔逻辑组合，使复杂查询表达更简洁：

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[完整 SEARCH 函数指南 →](./search-function.md)

## 快速开始

### 步骤 1:创建带倒排索引的表

```sql
CREATE TABLE docs (
  id BIGINT,
  title STRING,
  content STRING,
  category STRING,
  tags ARRAY<STRING>,
  created_at DATETIME,
  -- 文本搜索索引
  INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
  INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
  INDEX idx_category(category) USING INVERTED,
  INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### 步骤 2:运行文本查询

```sql
-- 简单关键词搜索
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- 短语搜索
SELECT * FROM docs WHERE content MATCH_PHRASE '全文检索';

-- 使用 SEARCH 进行布尔查询
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:数据库 OR tags:ANY(sql nosql))');

-- 基于相关性的排序
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY '实时 分析 OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## 混合搜索:文本 + 向量

在 RAG 应用中结合文本搜索和向量相似度实现全面检索:

```sql
-- 混合检索:语义相似度 + 关键词过滤
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
  -- 向量过滤实现语义相似度
  cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
  -- 文本过滤实现关键词约束
  AND SEARCH('title:搜索 AND content:引擎 AND category:技术')
ORDER BY text_relevance DESC
LIMIT 10;
```

## 管理倒排索引

### 创建索引

```sql
-- 在建表时创建
CREATE TABLE t (
  content STRING,
  INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- 在现有表上创建
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- 为现有数据构建索引
BUILD INDEX idx_content ON docs;
```

### 删除索引

```sql
DROP INDEX idx_content ON docs;
```

### 查看索引

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

[索引管理指南 →](../../table-design/index/inverted-index/overview.md)

## 延伸阅读

### 核心文档

- [倒排索引概述](../../table-design/index/inverted-index/overview.md) — 架构、索引原理和管理
- [文本搜索算子](./search-operators.md) — 完整算子参考和查询加速
- [SEARCH 函数](./search-function.md) — 统一查询 DSL 语法和示例
- [相关性打分](./scoring.md) — 相关性排序算法和用法

### 高级主题

- [自定义分析器](./custom-analyzer.md) — 构建特定领域的分词器和过滤器
- [向量搜索](../vector-search/overview.md) — 使用嵌入向量进行语义相似度搜索
