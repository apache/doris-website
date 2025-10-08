---
{
    "title": "SEARCH 函数",
    "language": "zh-CN"
}
---

## 概述

`SEARCH` 函数为 Apache Doris 提供了功能全面的轻量级 DSL（领域特定语言）全文检索查询能力。它通过提供统一的查询接口来简化复杂的文本搜索操作，充分利用倒排索引实现高性能文本搜索。

## 设计目标

SEARCH 函数主要解决以下核心问题：

### 1. 简化用户使用文本检索算子拼接SQL复杂度
- **统一入口**: 收拢所有的文本检索查询到统一入口
- **轻量级DSL语法**: 提供统一的轻量级DSL查询语法
- **降低SQL复杂度**: 无需手动组合多个文本检索算子

### 2. 多条件索引下推优化
- **直接索引利用**: 支持复杂文本检索条件直接下推到索引查询层执行
- **性能优化**: 充分利用倒排索引性能
- **统一优化**: 方便索引查询层统一对组合查询进行优化，进一步加速查询性能
- **避免重复解析**: 同时避免SQL语法解析一遍后又需要重新拼接条件到索引查询层

### 3. 精确化相关性评分策略
- **明确打分语义**: 解决文本检索中"哪些条件参与打分，哪些仅作过滤"的核心难题
- **打分与过滤分离**: 通过SEARCH函数明确指定参与相关性评分的条件
- **准确评分**: SQL中的其他WHERE条件作为filter，不参与相关性计算，确保评分准确性

### 4. 方便Elasticsearch用户前移
- **熟悉的语法**: 解决部分ES用户前移Doris过程中需要重新改写query string为SQL的问题
- **Query String兼容**: 提供类似Elasticsearch query_string的功能

## 当前版本特性（MVP）

### 支持的功能 ✅

| 功能 | 说明 | 示例 |
|------|------|------|
| **基础词项查询** | 精确词项匹配 | `SEARCH('title:Machine')` |
| **ANY查询** | 匹配多个值中的任意一个 | `SEARCH('tags:ANY(java python golang)')` |
| **ALL查询** | 匹配所有指定的值 | `SEARCH('tags:ALL(machine learning)')` |
| **布尔逻辑** | 支持AND、OR、NOT操作符和复杂嵌套 | `SEARCH('(title:A OR title:B) AND category:C')` |
| **多字段搜索** | 单次查询可同时搜索多个字段 | `SEARCH('title:hello OR content:world')` |

### 计划支持的功能 ❌ (TODO)

以下功能计划在未来版本中支持：

- ❌ **短语查询** (PHRASE) - 精确短语匹配
- ❌ **前缀查询** (PREFIX) - 基于前缀的匹配
- ❌ **通配符查询** (WILDCARD) - 使用 * 和 ? 的模式匹配
- ❌ **正则表达式** (REGEXP) - 基于正则的搜索
- ❌ **范围查询** (RANGE) - 数值/日期范围搜索
- ❌ **列表查询** (LIST/IN) - 匹配值列表
- ❌ **Variant子列支持** - variant类型子列的搜索
- ❌ **参数配置选项** - 高级查询选项

## DSL 语法规范

### 已支持语法 ✅

#### 基础查询

```sql
-- 词项查询：精确单词匹配
SELECT * FROM table WHERE SEARCH('title:apache');

-- ANY查询：匹配任意一个指定值
SELECT * FROM table WHERE SEARCH('tags:ANY(java python golang)');

-- ALL查询：匹配所有指定值
SELECT * FROM table WHERE SEARCH('tags:ALL(programming tutorial)');
```

#### 布尔操作

```sql
-- AND 操作符
SELECT * FROM table WHERE SEARCH('title:apache AND status:active');

-- OR 操作符
SELECT * FROM table WHERE SEARCH('title:apache OR title:doris');

-- NOT 操作符
SELECT * FROM table WHERE SEARCH('category:tech AND NOT status:deleted');

-- 复杂分组
SELECT * FROM table WHERE SEARCH('(title:apache OR title:doris) AND NOT (status:deleted OR status:archived)');
```

#### 多字段搜索

```sql
-- 跨字段搜索
SELECT * FROM table WHERE SEARCH('title:database OR content:system');

-- 复杂多字段查询
SELECT * FROM table WHERE SEARCH('title:apache AND (content:database OR tags:ANY(sql nosql))');
```

### 暂不支持语法 ❌ (降级为词项查询)

以下查询当前未实现，将降级为基础词项查询：

```sql
-- ⚠️ 短语查询（将降级为词项查询）
SELECT * FROM table WHERE SEARCH('content:"machine learning"');

-- ⚠️ 前缀查询（将降级为词项查询）
SELECT * FROM table WHERE SEARCH('title:data*');

-- ⚠️ 通配符查询（将降级为词项查询）
SELECT * FROM table WHERE SEARCH('title:d*ta');

-- ⚠️ 正则表达式（将降级为词项查询）
SELECT * FROM table WHERE SEARCH('title:/[a-z]+/');

-- ⚠️ 范围查询（将降级为词项查询）
SELECT * FROM table WHERE SEARCH('age:[18 TO 65]');
```

## 使用示例

### 示例1：基本词项搜索

```sql
-- 搜索标题中包含"Machine"的文档
SELECT id, title FROM search_test WHERE SEARCH('title:Machine');

-- 搜索并过滤
SELECT id, title, category
FROM search_test
WHERE SEARCH('title:Python') AND category = 'Technology';
```

### 示例2：ANY查询

```sql
-- 查找包含任意指定标签的文档
SELECT id, title FROM search_test
WHERE SEARCH('tags:ANY(python javascript golang)');

-- 与其他条件组合
SELECT id, title FROM search_test
WHERE SEARCH('tags:ANY(machine learning tutorial)')
AND created_date > '2024-01-01';
```

### 示例3：ALL查询

```sql
-- 查找包含所有指定词项的文档
SELECT id, title FROM search_test
WHERE SEARCH('tags:ALL(machine learning)');

-- 复杂ALL查询与分组
SELECT id, title FROM search_test
WHERE SEARCH('(tags:ALL(tutorial programming)) AND category:tech');
```

### 示例4：复杂布尔查询

```sql
-- 多个布尔操作符
SELECT id, title FROM search_test
WHERE SEARCH('(title:Learning OR content:Tutorial) AND category:Technology AND NOT tags:deprecated');

-- 嵌套条件
SELECT * FROM search_test
WHERE SEARCH('((title:apache OR title:doris) AND category:database) OR (tags:ANY(sql nosql) AND NOT status:archived)');
```

## 性能考虑

### 查询优化建议

1. **使用具体字段**: 指定字段名以获得更好的索引利用
   ```sql
   -- 推荐
   SEARCH('title:apache')

   -- 效率较低
   SEARCH('apache') -- 搜索所有索引字段
   ```

2. **结合WHERE子句**: 使用SEARCH进行文本匹配，WHERE进行精确过滤
   ```sql
   SELECT * FROM table
   WHERE SEARCH('content:database')
   AND category = 'tech'
   AND created_date > '2024-01-01';
   ```

3. **利用索引下推**: 让SEARCH条件充分利用索引优化
   - 所有SEARCH条件都下推到倒排索引层
   - 其他WHERE条件在索引查找后进行过滤

### 性能基准

预期查询性能（实际结果可能有所不同）：

| 数据规模 | 查询类型 | 预期响应时间 |
|---------|---------|------------|
| 1万行 | 词项查询 | < 20ms |
| 1万行 | ANY/ALL查询 | < 50ms |
| 10万行 | 复杂布尔查询 | < 200ms |

## 限制和已知问题

### 当前限制

1. **降级行为**: 不支持的查询类型（短语、前缀、通配符等）会降级为词项查询，不会报错
2. **无Variant支持**: 暂时无法搜索variant类型的子列
3. **无配置选项**: 高级参数（default_operator、minimum_should_match等）尚未提供

### 从Elasticsearch迁移

从Elasticsearch的`query_string`迁移时：

✅ **支持的迁移:**
- 基本词项查询
- 布尔逻辑（AND/OR/NOT）
- 多字段搜索
- 括号分组

❌ **需要变通方案:**
- 短语查询 → 单独使用MATCH_PHRASE算子
- 通配符/前缀 → 使用MATCH_REGEXP或LIKE
- 范围查询 → 使用标准SQL比较操作符

## 下一步

- 查看 [倒排索引概述](./inverted-index-overview.md) 了解索引基础
- 学习 [文本检索算子](../../table-design/index/inverted-index/search-operators.md) 了解其他查询方法
- 探索 [BM25打分](../../table-design/index/inverted-index/bm25-scoring.md) 了解相关性排序
- 了解 [向量搜索](../vector-search.md) 实现AI驱动的相似度搜索

## 功能路线图

### 下一版本计划
- ✨ Variant子列索引支持
- ✨ 通配符查询（WILDCARD）
- ✨ 配置参数支持

### 未来版本
- 🔜 短语查询（PHRASE）
- 🔜 前缀查询（PREFIX）
- 🔜 正则表达式（REGEXP）
- 🔜 范围查询（RANGE）
