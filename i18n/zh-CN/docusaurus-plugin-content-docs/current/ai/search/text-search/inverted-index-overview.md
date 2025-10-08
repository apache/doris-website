---
{
    "title": "倒排索引概述",
    "language": "zh-CN"
}
---

## 简介

Apache Doris 通过倒排索引提供强大的全文检索能力。倒排索引是信息检索领域常用的索引技术，能够快速进行文本搜索、数值和日期类型的等值和范围查询。

## 什么是倒排索引？

[倒排索引](https://zh.wikipedia.org/wiki/%E5%80%92%E6%8E%92%E7%B4%A2%E5%BC%95)将文本分成一个个词，构建 词 → 文档编号 的映射关系，可以快速查找一个词在哪些文档出现。

在 Doris 的倒排索引实现中：
- Table 的一行对应一个文档
- 一列对应文档中的一个字段
- 倒排索引使用独立的文件，可以在不重写数据文件的情况下高效地创建和删除索引

## 核心特性

### 1. 全文检索
- 使用 `MATCH_ANY` 和 `MATCH_ALL` 进行关键词检索
- 使用 `MATCH_PHRASE` 进行短语查询
- 支持词距（slop）控制
- 使用 `MATCH_PHRASE_PREFIX` 进行前缀匹配
- 使用 `MATCH_REGEXP` 进行正则表达式查询
- 支持多种分词器：英文、中文和 Unicode

### 2. 查询加速
- 对字符串、数值、日期时间类型进行快速过滤（=, !=, >, >=, <, <=）
- 使用 `array_contains` 支持数组类型
- 支持完善的逻辑组合（AND、OR、NOT）

### 3. 灵活的索引管理
- 在建表时定义索引
- 对已有表增加索引，支持增量构建
- 删除索引无需重写表数据

## 了解更多

关于倒排索引的详细信息，请参考以下文档：

- [**倒排索引概述**](../../table-design/index/inverted-index/overview.md) - 了解索引原理和使用场景
- [**索引管理**](../../table-design/index/inverted-index/index-management.md) - 如何创建、删除和查看倒排索引
- [**索引构建**](../../table-design/index/inverted-index/index-build.md) - 使用 BUILD INDEX 为存量数据构建索引
- [**文本检索算子**](../../table-design/index/inverted-index/search-operators.md) - 全文检索算子和查询加速
- [**自定义分词**](../../table-design/index/inverted-index/custom-analyzer.md) - 创建自定义分词器和分析器
- [**BM25 打分**](../../table-design/index/inverted-index/bm25-scoring.md) - 全文检索的相关性评分

## 快速示例

```sql
-- 创建带倒排索引的表
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "chinese")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;

-- 全文检索
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- 短语检索
SELECT * FROM docs WHERE content MATCH_PHRASE '全文检索';
```

## 下一步

- 了解 [SEARCH 函数](./search-function.md) 以简化全文检索查询语法
- 探索 [向量搜索](../vector-search.md) 实现AI驱动的相似度搜索
