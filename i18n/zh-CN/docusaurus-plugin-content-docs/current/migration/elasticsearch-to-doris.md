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

4. **数组处理**：Elasticsearch 数组需要在 Doris 中显式配置。

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
| date | DATE 或 DATETIME | 参见[日期处理](#处理日期类型) |
| ip | STRING | |
| nested | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md)，支持灵活 Schema |
| object | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md) |
| flattened | VARIANT | Doris 3.1.4、4.0.3 起支持 |
| geo_point | STRING | 存储为 "lat,lon" 字符串 |
| geo_shape | STRING | 存储为 GeoJSON 字符串 |

## 迁移选项

### 选项 1：ES Catalog（推荐）

ES Catalog 提供从 Doris 直接访问 Elasticsearch 数据的能力，支持查询和迁移。

#### 前提条件

- Elasticsearch 5.x 或更高版本
- Doris FE/BE 节点与 Elasticsearch 之间的网络连接

#### 步骤 1：创建 ES Catalog

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node1:9200,http://es-node2:9200',
    'user' = 'elastic',
    'password' = 'password'
);
```

带有更多选项：

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node1:9200',
    'user' = 'elastic',
    'password' = 'password',
    'doc_value_scan' = 'true',
    'keyword_sniff' = 'true',
    'nodes_discovery' = 'true',
    'ssl' = 'false',
    'mapping_es_id' = 'true'
);
```

#### 步骤 2：探索 Elasticsearch 数据

```sql
-- 切换到 ES catalog
SWITCH es_catalog;

-- ES 创建一个 default_db 数据库
USE default_db;

-- 列出索引作为表
SHOW TABLES;

-- 预览数据
SELECT * FROM logs_index LIMIT 10;

-- 检查字段映射
DESC logs_index;
```

#### 步骤 3：设计 Doris 表

基于您的 Elasticsearch 索引，设计合适的 Doris 表：

```sql
-- 示例：日志数据表
SWITCH internal;

CREATE TABLE logs (
    `@timestamp` DATETIME NOT NULL,
    log_id VARCHAR(64),
    level VARCHAR(16),
    message TEXT,
    host VARCHAR(128),
    service VARCHAR(64),
    trace_id VARCHAR(64),
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true"),
    INDEX idx_level (level) USING INVERTED,
    INDEX idx_service (service) USING INVERTED
)
DUPLICATE KEY(`@timestamp`, log_id)
PARTITION BY RANGE(`@timestamp`) ()
DISTRIBUTED BY HASH(log_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "replication_num" = "3"
);
```

#### 步骤 4：迁移数据

```sql
-- 基本迁移
INSERT INTO internal.analytics_db.logs
SELECT
    `@timestamp`,
    _id as log_id,
    level,
    message,
    host,
    service,
    trace_id
FROM es_catalog.default_db.logs_index;
```

对于大型索引，按时间范围迁移：

```sql
-- 按天迁移
INSERT INTO internal.analytics_db.logs
SELECT * FROM es_catalog.default_db.logs_index
WHERE `@timestamp` >= '2024-01-01' AND `@timestamp` < '2024-01-02';
```

#### 步骤 5：配置数组字段

Elasticsearch 没有显式的数组类型。要正确读取数组，需要配置 ES 索引映射：

```bash
# 向 ES 索引添加数组字段元数据
curl -X PUT "localhost:9200/logs_index/_mapping" -H 'Content-Type: application/json' -d '{
    "_meta": {
        "doris": {
            "array_fields": ["tags", "ip_addresses"]
        }
    }
}'
```

然后在 Doris 中：

```sql
-- 数组字段将被正确识别
SELECT tags, ip_addresses FROM es_catalog.default_db.logs_index LIMIT 5;
```

## 迁移全文搜索

Doris 的倒排索引提供类似 Elasticsearch 的全文搜索能力。

### 创建倒排索引

```sql
-- 创建带倒排索引的表用于全文搜索
CREATE TABLE articles (
    id BIGINT,
    title VARCHAR(256),
    content TEXT,
    author VARCHAR(64),
    published_at DATETIME,
    tags ARRAY<STRING>,
    INDEX idx_title (title) USING INVERTED PROPERTIES("parser" = "unicode"),
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "parser" = "unicode",
        "support_phrase" = "true"
    ),
    INDEX idx_tags (tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

### 全文搜索查询

```sql
-- Match 查询（类似 ES match）
SELECT * FROM articles
WHERE content MATCH 'apache doris';

-- 短语匹配（类似 ES match_phrase）
SELECT * FROM articles
WHERE content MATCH_PHRASE 'real-time analytics';

-- 多条件组合
SELECT * FROM articles
WHERE title MATCH 'database'
  AND content MATCH 'performance'
  AND published_at > '2024-01-01';
```

### DSL 到 SQL 转换示例

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

## 处理常见问题

### 处理日期类型

Elasticsearch 日期可以有多种格式。确保一致处理：

```sql
-- 带 datetime 的 Doris 表
CREATE TABLE events (
    event_id VARCHAR(64),
    event_time DATETIME,
    event_data JSON
)
DUPLICATE KEY(event_id)
DISTRIBUTED BY HASH(event_id) BUCKETS 8;

-- 带日期转换的迁移
INSERT INTO events
SELECT
    _id,
    CAST(`@timestamp` AS DATETIME),
    event_data
FROM es_catalog.default_db.events_index;
```

### 处理嵌套文档

Elasticsearch 嵌套对象映射到 Doris JSON：

```sql
-- ES 文档带嵌套数据
-- { "user": { "name": "John", "address": { "city": "NYC" } } }

-- Doris 表
CREATE TABLE users (
    id VARCHAR(64),
    user_data JSON
)
DISTRIBUTED BY HASH(id) BUCKETS 8;

-- 在 Doris 中查询嵌套数据
SELECT
    id,
    JSON_EXTRACT(user_data, '$.name') as name,
    JSON_EXTRACT(user_data, '$.address.city') as city
FROM users;
```

### 处理 _id 字段

要保留 Elasticsearch `_id`：

```sql
-- 在 catalog 中启用 _id 映射
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node:9200',
    'mapping_es_id' = 'true'
);

-- 带 _id 查询
SELECT _id, * FROM es_catalog.default_db.index_name LIMIT 10;
```

### 性能优化

提升 ES Catalog 读取性能：

```sql
-- 启用列式扫描（doc_value）
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node:9200',
    'doc_value_scan' = 'true'
);
```

注意：`text` 字段不支持 doc_value，会回退到 `_source`。

## 验证

迁移后，验证：

```sql
-- 比较文档数
SELECT COUNT(*) FROM es_catalog.default_db.logs_index;
SELECT COUNT(*) FROM internal.analytics_db.logs;

-- 验证全文搜索工作正常
SELECT COUNT(*) FROM internal.analytics_db.logs
WHERE message MATCH 'error';

-- 抽查特定文档
SELECT * FROM internal.analytics_db.logs
WHERE log_id = 'specific-doc-id';
```

## 下一步

- [倒排索引](../table-design/index/inverted-index/overview.md) - Doris 中的全文搜索
- [ES Catalog](../lakehouse/catalogs/es-catalog.md) - 完整的 ES Catalog 参考
- [日志存储分析](../log-storage-analysis.md) - 优化 Doris 中的日志分析
