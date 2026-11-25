---
{
    "title": "VARIANT 值索引",
    "language": "zh-CN",
    "description": "使用 VARIANT 值索引和 MATCH 搜索整列的值。通过日志示例学习建索引、搜索嵌套 JSON 和给已有 Doris 表添加索引，并了解历史数据何时回退到扫描以及如何查看回退原因。",
    "doc_type": "feature"
}
---

:::caution 实验性功能

VARIANT 值索引自 Doris 4.2 起作为实验性功能提供。

:::

## 概述 {#overview}

当关键词可能出现在 JSON 的不同字段中时，可以用 VARIANT 值索引搜索整列。例如，应用有时把 `timeout` 写在日志消息里，有时写在重试详情数组里。使用值索引后，一条 `payload MATCH_ANY 'timeout'` 就能找到这两种日志。

值索引是针对整个 VARIANT 列的倒排索引。它要求使用 `SNII` 格式，支持 Duplicate Key 表和写时合并（Merge-on-Write）的 Unique Key 表。每个 VARIANT 列可以有一个值索引，也可以同时保留普通子路径索引。

## 快速开始 {#quick-start}

请在测试数据库中使用有建表、写入和查询权限的账号。示例使用单副本，在只有一个 BE 的测试集群也能运行。

```sql
CREATE TABLE service_events (
    id BIGINT NOT NULL,
    payload VARIANT<PROPERTIES("variant_enable_nested_group" = "false")>,
    INDEX idx_payload_values (payload) USING INVERTED
        PROPERTIES ("variant_index_scope" = "values", "parser" = "english"),
    INDEX idx_payload_paths (payload) USING INVERTED
        PROPERTIES ("parser" = "english")
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("inverted_index_storage_format" = "SNII", "replication_num" = "1");

INSERT INTO service_events VALUES
    (1, PARSE_TO_VARIANT('{"message":"Request timeout","labels":{"service":"checkout"}}')),
    (2, PARSE_TO_VARIANT('{"message":"Request completed","labels":{"service":"checkout"},"details":["retry","timeout"]}')),
    (3, PARSE_TO_VARIANT('{"message":"Request completed","labels":{"service":"billing"},"debugflag":true}')),
    (4, PARSE_TO_VARIANT('{"message":"Upstream timeout","labels":{"service":"billing"}}'));

SELECT id FROM service_events WHERE payload MATCH_ANY 'timeout checkout' ORDER BY id;
```

```text
id
1
2
4
```

`MATCH_ANY` 在一行中匹配任意一个搜索词。`MATCH` 是 `MATCH_ANY` 的别名。第二个索引 `idx_payload_paths` 用于下文的子路径查询。

## 参数 {#options}

| 设置项 | 设置位置 | 取值及作用 |
| --- | --- | --- |
| `variant_index_scope` | 索引属性 | 创建值索引时必填，取字符串 `values`。省略时创建用于子路径的普通 VARIANT 倒排索引。 |
| `parser` 或 `analyzer` | 索引属性 | 必须指定一种会分词的内置解析器或分析器，例如 `parser = "english"`。值索引不支持自定义分词策略或 `none`。 |
| `inverted_index_storage_format` | 表属性 | 实际生效的格式必须是 `SNII`。建表时请显式设置。 |
| `support_phrase` | 索引属性 | 可选，布尔字符串，默认 `false`。值索引仅接受 `false`。 |

其他受支持的分词设置（如 `lower_case`）沿用普通倒排索引的默认值。

## 示例 {#examples}

### 要求所有搜索词出现在同一行 {#match-all}

```sql
SELECT id FROM service_events WHERE payload MATCH_ALL 'checkout timeout' ORDER BY id;
```

```text
id
1
2
```

同一行内的搜索词可以分布在不同字段或数组元素里。例如，第 2 行的 `checkout` 在 `labels.service` 中，`timeout` 在 `details` 数组中。

### 只搜索指定字段 {#match-subpath}

```sql
SELECT id FROM service_events WHERE payload['message'] MATCH_ANY 'timeout' ORDER BY id;
```

```text
id
1
4
```

此查询使用普通子路径索引。第 2 行的 `timeout` 只出现在 `details` 中。

### 给已有表添加值索引 {#add-to-existing-table}

选择一张符合上述要求、且目标列还没有值索引的表。要试跑本例，可以把快速开始中的表名改为 `existing_service_events`，去掉建表语句中的 `idx_payload_values` 定义，再建表写入示例数据。账号需要该表的 `ALTER_PRIV` 权限，FE 配置 `enable_light_index_change` 必须为 `true`（默认值）。存算分离模式下，现有分区和以后新建的分区都要求使用 `SNII`。

```sql
SET enable_add_index_for_new_data = true;

CREATE INDEX idx_payload_values ON existing_service_events(payload) USING INVERTED
    PROPERTIES ("variant_index_scope" = "values", "parser" = "english");

SHOW ALTER TABLE COLUMN WHERE TableName = 'existing_service_events';
```

等索引变更任务的状态变为 `FINISHED`。也可以用 `ALTER TABLE ... ADD INDEX` 并设置相同的索引属性。新写入的数据会创建索引。对于尚无物理索引的历史数据，开启回退后查询可以扫描这些数据。后续 compaction 将这部分数据与新写入的数据一同重写时，可以补齐索引。

```sql
SHOW INDEX FROM existing_service_events;
SELECT id FROM existing_service_events WHERE payload MATCH_ANY 'timeout' ORDER BY id;
```

`SHOW INDEX` 列出 `idx_payload_values`，表示索引定义已生效。开启回退时，查询已经可以找到索引变更前写入的第 `1`、`2`、`4` 行。

要从整张表删除值索引，执行以下命令并等待变更任务完成。删除后，`WHERE` 中仍可使用子路径条件。对整个 VARIANT 列使用 `MATCH` 条件需要保留值索引定义。

```sql
DROP INDEX idx_payload_values ON existing_service_events;
```

## 限制 {#limits}

- 对 VARIANT 列或其别名直接使用 `MATCH`、`MATCH_ANY` 或 `MATCH_ALL`，搜索字符串必须是常量。整列查询不支持短语、前缀、边界、正则匹配或 `score()`。若指定 `USING ANALYZER`，必须与值索引的分词器一致。使用 `SEARCH()` 时，请为目标字段配置普通索引。
- 值索引不支持 NestedGroup、声明为 Decimal256 的路径、`field_pattern` 和 `norms = "true"`。表中有值索引时，该表的所有索引都不能执行 `BUILD INDEX`。删除值索引的操作作用于整张表。
- 从旧版本恢复的数据段可能仍使用 V2 或 V3 索引文件，查询可回退到扫描。存算分离模式下，只要表上还保留值索引，新分区就必须继续使用 `SNII`。

## 最佳实践 {#best-practices}

- 搜索词可能出现在不同字段时，用值索引做跨字段搜索。已知目标字段时，用普通子路径索引缩小搜索范围。精确的数值过滤可以直接对指定路径做类型比较，例如 `CAST(payload['status'] AS INT) = 404`。
- 让不同数据来源对同一路径使用一致的类型，尤其是布尔标志和数值指标。给整列建索引会增加写入开销并占用存储空间，适合有跨字段搜索需求的列。

## FAQ {#faq}

### 值索引会搜哪些内容？ {#indexed-values}

它搜索对象和数组中实际存储的标量值，包括字符串、数字和布尔值。`42`、`42.0`、`42.00` 在分词前都按 `42` 处理。JSON 键名、JSON `null` 和存为日期时间、二进制或 UUID 类型的值都不产生搜索词。空对象和空数组没有搜索词，SQL `NULL` 的 MATCH 结果为 `NULL`。

例如，快速开始里的 `payload MATCH_ANY 'debugflag'` 不返回任何行。要按这个键过滤，可以用子路径条件 `CAST(payload['debugflag'] AS BOOLEAN) = TRUE`。

同一路径混用布尔值和数字时，搜索 `true` 或 `false` 的结果可能不稳定。

### 加了索引，为什么查询还在扫描数据？ {#scan-fallback}

加索引前写入的数据可能还在没有该索引的数据段中。保留 `enable_match_without_inverted_index` 和 `enable_fallback_on_missing_inverted_index` 为 `true`（均为默认值），查询就能回退到扫描。扫描可能比使用索引慢。要查看回退原因，设置 `enable_profile = true` 和 `profile_level = 2` 后执行查询。在[查询 Profile](../../../query-acceleration/query-profile.md) 中查找 `VariantValuesIndex`，留意 `reason=missing_index` 或 `reason=legacy_storage_format`。
