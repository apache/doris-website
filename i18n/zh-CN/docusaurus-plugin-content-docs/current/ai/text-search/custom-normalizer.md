---
{
    "title": "自定义标准化",
    "language": "zh-CN",
    "description": "自定义标准化（Normalizer）用于对文本进行统一的预处理，通常用于不需要分词但需要标准化的场景（如关键字搜索）。与分词器（Analyzer）不同，Normalizer 不会对文本进行切分，而是将整个文本作为一个完整的词项（Token）进行处理，支持组合字符过滤器和词元过滤器，"
}
---

## 概述

自定义标准化（Normalizer）用于对文本进行统一的预处理，通常用于不需要分词但需要标准化的场景（如关键字搜索）。与分词器（Analyzer）不同，Normalizer 不会对文本进行切分，而是将整个文本作为一个完整的词项（Token）进行处理，支持组合字符过滤器和词元过滤器，以实现大小写转换、字符归一化等功能。

## 使用自定义标准化

### 创建

自定义标准化器主要由字符过滤器（char_filter）和词元过滤器（token_filter）组成。

> 注意：`char_filter` 和 `token_filter` 的详细创建方式请参考[自定义分词]文档。

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
  "char_filter" = "x_char_filter",          -- 可选，一个或多个字符过滤器
  "token_filter" = "x_filter1, x_filter2"   -- 可选，一个或多个词元过滤器，按顺序执行
);
```

### 查看

```sql
SHOW INVERTED INDEX NORMALIZER;
```

### 删除

```sql
DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;
```

## 建表中使用自定义标准化

在倒排索引属性中使用 `normalizer` 指定自定义标准化器。

**注意**：`normalizer` 与 `analyzer` 互斥，不能同时在同一个索引中指定。

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

## 使用限制

1. `char_filter` 和 `token_filter` 中引用的名称必须存在（内置或已创建）。
2. 只有在没有任何表使用 normalizer 的时候才能删除它。
3. 只有在没有任何 normalizer 使用 char_filter 或 token_filter 的情况下才能删除对应的 filter。
4. 使用自定义标准化语法 10s 后会被同步到 BE，之后导入正常不会报错。

## 完整示例

### 示例：忽略大小写与特殊重音符号

本示例展示如何创建一个标准化器，将文本转换为小写并移除重音符号（例如将 `Café` 标准化为 `cafe`），适用于不区分大小写和重音的精确匹配。

```sql
-- 1. 创建自定义词元过滤器（如果需要特定参数）
-- 此处创建一个 ascii_folding 过滤器
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. 创建标准化器
-- 组合使用 lowercase（内置）和 my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. 建表使用
CREATE TABLE product_table (
    `id` bigint NOT NULL,
    `product_name` text NULL,
    INDEX idx_name (`product_name`) USING INVERTED PROPERTIES("normalizer" = "lowercase_ascii_normalizer")
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

-- 4. 验证测试
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

返回结果：
```json
[
  {"token":"cafe-products"}
]
```
