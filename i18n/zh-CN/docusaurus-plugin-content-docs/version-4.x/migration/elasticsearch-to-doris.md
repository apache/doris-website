---
{
    "title": "Elasticsearch 迁移到 Doris",
    "language": "zh-CN",
    "description": "通过 ES Catalog 迁移索引并验证字段、文档 ID 与搜索语义。"
}
---

通过 ES Catalog 可以查询 Elasticsearch 索引，再用 `INSERT INTO ... SELECT` 写入 Doris 内部表。本页演示一次性小规模迁移；它不会自动同步后续更新或删除。迁移搜索工作负载时，还需要分别验证分词、评分、嵌套对象及查询语义。

## 前提条件

本示例使用 Elasticsearch 7.x 或 8.x 的无类型映射 API；其他版本请按源端 API 调整索引初始化方式，并核查 Catalog 的支持范围。

- 一个可访问的 Elasticsearch 集群及可创建示例索引、写入和读取数据的账户。生产迁移账户还需要 Catalog 元数据查询权限，详见 [ES Catalog](../lakehouse/catalogs/es-catalog.md)。
- 所有 Doris FE/BE 均能访问 ES；Doris 账户具备建 Catalog、建库、建表、读外表及写目标表权限。
- 使用空目标表，并将连接地址及认证信息替换为实际值。示例使用单副本和单分桶，仅供验证。

## 基本用法

### 1. 准备源索引

在 Elasticsearch Dev Tools 或等效 HTTP 客户端中执行：

```http
PUT /migration_demo
{
  "mappings": {
    "properties": {
      "title": { "type": "keyword" }
    }
  }
}

PUT /migration_demo/_doc/one?refresh=true
{ "title": "first" }

PUT /migration_demo/_doc/two?refresh=true
{ "title": "second" }
```

预期结果：索引中有两条可查询文档，`_id` 分别为 `one` 和 `two`。

### 2. 创建 Catalog 并保留文档 ID

```sql
CREATE CATALOG migration_es PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-host:9200',
    'user' = '<es_user>',
    'password' = '<es_password>',
    'mapping_es_id' = 'true'
);
DESC migration_es.default_db.migration_demo;

CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.es_demo (
    doc_id VARCHAR(512),
    title STRING
)
DUPLICATE KEY(doc_id)
DISTRIBUTED BY HASH(doc_id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.es_demo (doc_id, title)
SELECT _id, title FROM migration_es.default_db.migration_demo;

SELECT doc_id, title FROM migration_target.es_demo ORDER BY doc_id;
```

```text
+--------+--------+
| doc_id | title  |
+--------+--------+
| one    | first  |
| two    | second |
+--------+--------+
```

## 参数参考

| 参数 | 类型 | 是否必需 | 默认值 | 描述 |
| --- | --- | --- | --- | --- |
| `hosts` | STRING | 是 | 无 | ES HTTP 地址，所有 FE/BE 必须能够访问 |
| `user` / `password` | STRING | 取决于 ES 认证 | 空 | 启用 Basic 认证时填写 |
| `mapping_es_id` | boolean | 否 | `false` | 暴露文档 `_id`，本例设为 true |
| `doc_value_scan` | boolean | 否 | `true` | 尝试通过 doc values 读取支持的字段 |
| `nodes_discovery` | boolean | 否 | `true` | 自动发现节点；隔离网络中可能需要关闭 |

完整参数、认证及数组标注格式见 [ES Catalog](../lakehouse/catalogs/es-catalog.md)。

## 类型和搜索语义

- `object`、`nested` 通过 ES Catalog 映射为 JSON，不是自动映射为 VARIANT；导入其他目标类型前应显式转换并测试。
- ES 字段可能同时包含标量和数组。按 Catalog 参考设置 `_meta.doris.array_fields`，检查 `DESC` 和真实样本；不要仅由一条样本推断整列类型。
- 日期格式、时区、数值范围及缺失字段需要逐项验证。`text` 字段的分词行为与用于精确匹配的 `keyword` 不同。
- Doris [倒排索引](../table-design/index/inverted-index/overview.md) 支持全文检索，但 ES DSL、评分、nested 查询及分析器并非自动等价。应针对真实查询验证结果，不要逐条机械替换语法。

## 校验与错误处理

在源索引不变化的窗口内比较两端文档数和不同 `_id` 数；本例都应为 2。再抽样比较原始 `_source` 与目标字段，检查缺失值、JSON 数组和日期。

元数据请求失败时检查索引读取、集群状态和节点 HTTP 权限；分页读取失败时检查源节点可达性及节点发现设置。迁移过程中索引变化可能影响一致性；需要稳定快照或明确的停写窗口。重复 INSERT 会追加重复行，恢复前先确认已经导入的范围。

## 建议

先验证字段读取与查询语义，再分批迁移。需要持续镜像时，单独设计按文档 ID 的更新、删除、顺序和重放机制；Catalog 不是 CDC 任务。更多切换步骤见 [迁移概览](./overview.md)。
