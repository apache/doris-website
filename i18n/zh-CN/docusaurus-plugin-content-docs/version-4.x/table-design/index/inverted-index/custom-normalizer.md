---
{
    "title": "自定义标准化",
    "language": "zh-CN",
    "description": "Doris 倒排索引自定义标准化器（Normalizer）使用指南：将整段文本作为单个词项处理，支持大小写转换、重音符号归一化等关键字精确匹配场景。"
}
---

<!-- 知识类型: 功能说明 + 操作步骤 -->
<!-- 适用场景: 关键字精确匹配 / 不分词的标准化预处理 -->

自定义标准化（Normalizer）用于对文本进行统一的预处理，**不切分文本**，而是将整段文本作为一个完整的词项（Token）处理。它通过组合字符过滤器（char_filter）和词元过滤器（token_filter），实现大小写转换、字符归一化等功能，常用于不需要分词但需要标准化的场景（如关键字搜索）。

**Normalizer 与 Analyzer 的区别**

| 对比项 | Normalizer（标准化器） | Analyzer（分词器） |
| --- | --- | --- |
| 是否切分文本 | 否，整段文本作为单一 Token | 是，按规则切分为多个 Token |
| 典型场景 | 关键字精确匹配（如商品编码、ID） | 全文检索（如文章正文） |
| 常用过滤器 | lowercase、ascii_folding 等 | tokenizer + 多种 filter |

## 适用场景

- **关键字搜索**：商品编码、产品名、用户 ID 等无需分词但需统一格式的字段。
- **大小写不敏感匹配**：将 `ProductA` 与 `producta` 视为相同值。
- **重音/特殊字符归一化**：将 `Café` 归一化为 `cafe`，避免因符号差异导致漏匹配。

## 使用流程

完整流程包含 3 个步骤：

1. （可选）创建自定义 `char_filter` 和 `token_filter`。
2. 创建自定义 Normalizer，组合上述过滤器。
3. 在建表语句中通过倒排索引属性引用该 Normalizer。

### 步骤 1：创建自定义过滤器（可选）

如果内置过滤器无法满足需求，可先创建自定义过滤器。

> `char_filter` 和 `token_filter` 的详细创建方式，请参考[自定义分词](./custom-analyzer.md)文档。

### 步骤 2：创建自定义 Normalizer

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
    "char_filter" = "x_char_filter",          -- 可选，一个或多个字符过滤器
    "token_filter" = "x_filter1, x_filter2"   -- 可选，一个或多个词元过滤器，按顺序执行
);
```

**参数说明**

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `char_filter` | 否 | 一个或多个字符过滤器名称，多个使用逗号分隔 |
| `token_filter` | 否 | 一个或多个词元过滤器名称，按声明顺序依次执行 |

### 步骤 3：在建表中引用 Normalizer

在倒排索引属性中通过 `normalizer` 指定要使用的标准化器。

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

:::caution 注意
`normalizer` 与 `analyzer` 互斥，不能在同一个索引中同时指定。
:::

## 管理自定义 Normalizer

| 操作 | SQL 语句 |
| --- | --- |
| 查看 | `SHOW INVERTED INDEX NORMALIZER;` |
| 删除 | `DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;` |

## 完整示例：忽略大小写与重音符号

**场景**：商品名称字段需要支持大小写不敏感、且忽略重音符号的精确匹配（如 `Café-Products` 与 `cafe-products` 视为相同）。

**实现步骤**：

1. 创建自定义词元过滤器 `my_ascii_folding`（用于去除重音符号）。
2. 创建 Normalizer `lowercase_ascii_normalizer`，组合内置 `lowercase` 和上一步的 `my_ascii_folding`。
3. 创建表并在 `product_name` 字段上应用该 Normalizer。
4. 通过 `tokenize` 函数验证标准化效果。

**SQL 示例**：

```sql
-- 1. 创建自定义词元过滤器（如果需要特定参数）
--    此处创建一个 ascii_folding 过滤器
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. 创建标准化器
--    组合使用 lowercase（内置）和 my_ascii_folding
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

**预期返回结果**：

```json
[
    {"token":"cafe-products"}
]
```

可以看到，`Café-Products` 被整体作为一个 Token 处理（未切分），同时完成了小写转换和重音符号去除。

## 使用限制

1. `char_filter` 和 `token_filter` 中引用的名称必须存在（内置或已创建）。
2. 只有在没有任何表使用该 Normalizer 时，才能删除它。
3. 只有在没有任何 Normalizer 引用某个 `char_filter` 或 `token_filter` 时，才能删除对应的 filter。
4. 自定义标准化语法执行后，约 10 秒后会同步到 BE，之后导入数据将正常生效。
5. `normalizer` 与 `analyzer` 不能在同一个倒排索引中同时指定。
