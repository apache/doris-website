---
{
    "title": "Elasticsearch 迁移到 Doris",
    "language": "zh-CN",
    "description": "从 Elasticsearch 迁移数据到 Apache Doris 的完整指南"
}
---

本指南介绍如何将数据从 Elasticsearch 迁移到 Apache Doris。Doris 可以作为 Elasticsearch 的强大替代方案，用于日志分析、全文搜索和通用 OLAP 工作负载，通常具有更好的性能和更低的运维复杂度。

## 为什么从 Elasticsearch 迁移到 Doris？

| 方面 | Elasticsearch | Apache Doris |
|------|---------------|--------------|
| 查询语言 | DSL（基于 JSON） | 标准 SQL |
| JOIN | 有限支持 | 完整 SQL JOIN |
| 存储效率 | 存储使用较高 | 列式压缩 |
| 运维复杂度 | 集群管理复杂 | 运维更简单 |
| 全文搜索 | 原生倒排索引 | 支持倒排索引 |
| 实时分析 | 良好 | 优秀 |

## 注意事项

1. **全文搜索**：Doris 支持[倒排索引](../table-design/index/inverted-index/overview.md)，提供类似 Elasticsearch 的全文搜索能力。

2. **索引到表映射**：每个 Elasticsearch 索引通常映射到一个 Doris 表。

3. **嵌套文档**：Elasticsearch nested 类型映射到 Doris [VARIANT](../data-operate/import/complex-types/variant.md) 类型，支持灵活的 Schema 处理。

4. **数组处理**：Elasticsearch 没有显式的数组类型。通过 ES Catalog 正确读取数组时，需要在 ES 索引映射中使用 `_meta.doris.array_fields` 配置数组字段元数据。

5. **日期类型**：Elasticsearch 日期可以有多种格式。迁移时确保一致的日期处理 — 使用显式转换到 DATETIME。

6. **_id 字段**：要保留 Elasticsearch 文档 `_id`，在 ES Catalog 配置中启用 `mapping_es_id`。

7. **性能**：为了获得更好的 ES Catalog 读取性能，启用 `doc_value_scan`。注意 `text` 字段不支持 doc_value，会回退到 `_source`。

## 数据类型映射

| Elasticsearch 类型 | Doris 类型 | 说明 |
|--------------------|------------|------|
| null | NULL | |
| boolean | BOOLEAN | |
| byte | TINYINT | |
| short | SMALLINT | |
| integer | INT | |
| long | BIGINT | |
| unsigned_long | LARGEINT | |
| float | FLOAT | |
| half_float | FLOAT | |
| double | DOUBLE | |
| scaled_float | DOUBLE | |
| keyword | STRING | |
| text | STRING | 考虑在 Doris 中使用倒排索引 |
| date | DATE 或 DATETIME | 参见上方日期类型 |
| ip | STRING | |
| nested | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md)，支持灵活 Schema |
| object | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md) |
| flattened | VARIANT | Doris 3.1.4、4.0.3 起支持 |
| geo_point | STRING | 存储为 "lat,lon" 字符串 |
| geo_shape | STRING | 存储为 GeoJSON 字符串 |

## 迁移选项

### 选项 1：ES Catalog（直接查询和迁移）

[ES Catalog](../lakehouse/catalogs/es-catalog.md) 提供从 Doris 直接访问 Elasticsearch 数据的能力，支持查询和迁移。

**前提条件**：Elasticsearch 5.x 或更高版本；Doris FE/BE 节点与 Elasticsearch 之间的网络连接。

### 选项 2：Logstash Pipeline

使用 Logstash 从 Elasticsearch 读取数据，通过 HTTP（Stream Load）写入 Doris。此方法在迁移过程中提供数据转换能力。

### 选项 3：自定义脚本 + Scroll API

需要更多控制时，使用自定义脚本结合 Elasticsearch Scroll API 读取数据，通过 Stream Load 加载到 Doris。

## Doris 中的全文搜索

Doris 的[倒排索引](../table-design/index/inverted-index/overview.md)提供类似 Elasticsearch 的全文搜索能力。

### DSL 到 SQL 转换参考

| Elasticsearch DSL | Doris SQL |
|-------------------|-----------|
| `{"match": {"title": "doris"}}` | `WHERE title MATCH 'doris'` |
| `{"match_phrase": {"content": "real time"}}` | `WHERE content MATCH_PHRASE 'real time'` |
| `{"term": {"status": "active"}}` | `WHERE status = 'active'` |
| `{"terms": {"tag": ["a", "b"]}}` | `WHERE tag IN ('a', 'b')` |
| `{"range": {"price": {"gte": 10}}}` | `WHERE price >= 10` |
| `{"bool": {"must": [...]}}` | `WHERE ... AND ...` |
| `{"bool": {"should": [...]}}` | `WHERE ... OR ...` |
| `{"exists": {"field": "email"}}` | `WHERE email IS NOT NULL` |

## 下一步

- [倒排索引](../table-design/index/inverted-index/overview.md) - Doris 中的全文搜索
- [ES Catalog](../lakehouse/catalogs/es-catalog.md) - 完整的 ES Catalog 参考
- [日志存储分析](../log-storage-analysis.md) - 优化 Doris 中的日志分析
