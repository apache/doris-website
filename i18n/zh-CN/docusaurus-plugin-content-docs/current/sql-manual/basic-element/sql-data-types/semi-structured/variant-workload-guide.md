---
{
    "title": "VARIANT 使用与配置指南",
    "language": "zh-CN",
    "description": "帮助用户判断何时使用 VARIANT、宽列场景如何在默认模式、Sparse 和 DOC mode 之间做选择，以及如何确定起步配置。"
}
---

## 概览

`VARIANT` 用来存储半结构化 JSON，并对常用路径执行子列列式提取（Subcolumnization）。

这篇文档用来帮你给新的 `VARIANT` 场景选方案。适合在设计阶段先回答下面这些问题：

- 这个场景应该用 `VARIANT`，还是直接建静态列？
- JSON 很宽时，应该先用默认模式、Sparse，还是 DOC mode？
- 哪些配置先保持默认，哪些配置才值得优先调整？

如果你已经确定要使用 `VARIANT`，只是想查语法或类型规则，请直接看 [VARIANT](./VARIANT)。如果你只需要一个最小可运行的导入示例，请看 [导入 Variant 数据](../../../../data-operate/import/complex-types/variant)。

:::tip 为什么使用 VARIANT
`VARIANT` 保留了 JSON 的灵活性，同时又能让常用路径通过子列列式提取（Subcolumnization）获得类似普通列的裁剪、聚合和索引能力，不必先把整份文档固化成静态 schema。对超宽 JSON，存储层优化也让更大规模的 Subcolumnization 保持可控。
:::

## 什么时候适合用 VARIANT

当以下条件大多成立时，`VARIANT` 往往是合适的选择：

- 输入是 JSON 或其他半结构化载荷，而且字段会持续演进。
- 查询通常集中在一部分热点路径，而不是每一行都访问全部字段。
- 你希望保留 schema 灵活性，同时获得列式分析性能。
- 只有少量关键路径需要索引，其余路径可以保持动态。

当以下条件更占主导时，优先考虑静态列：

- schema 稳定，并且可以提前定义清楚。
- 核心字段经常作为 Join Key、排序键，或者必须严格类型治理。
- 主要诉求是原样存档 JSON，而不是按路径做分析。

## 先回答四个问题

在动任何配置之前，先把下面四个问题答清楚。

### 1. 有没有明确的热点路径？

如果查询总是反复落在同一批 JSON Path 上，Doris 就能持续对这些路径执行子列列式提取（Subcolumnization）。这正是 `VARIANT` 最有价值的场景。

### 2. 是否有少数路径必须固定类型或稳定索引？

如果有，就只给这些路径加 Schema Template。它适合少量关键字段，不适合把整份文档都描述一遍。

### 3. 这是不是已经变成宽 JSON 问题？

当 Path 数量持续增长，并开始带来元数据压力、Compaction 压力或明显的查询开销时，就已经进入宽 JSON 问题域。

### 4. 对宽 JSON 来说，更重要的是热点路径分析，还是整条文档返回？

- 如果核心价值仍然是热点字段上的过滤、聚合和索引，优先往 Sparse 方向想。
- 如果核心价值更偏向导入效率或整条文档返回，优先往 DOC mode 方向想。

## 关键概念

阅读下面的存储模式之前，先确认以下术语清晰。每个概念用 2-3 行讲清边界；实现细节请参考 [VARIANT](./VARIANT)。

**子列列式提取（Subcolumnization）。** 写入 `VARIANT` 列时，Doris 会自动发现 JSON Path，并对热点路径执行子列列式提取，使其以独立子列的形式参与分析。

<img src="/images/variant/variant-default-storage.png" alt="默认 VARIANT：自动子列提取" width="720" />

**Schema Template。** 一种在 `VARIANT` 列上的声明，用来把部分路径固定为稳定类型。它适合少量关键业务字段，让这些路径的类型、索引和行为更可控；不应试图穷举所有可能路径。

**宽 JSON。** 当 JSON Path 的总数持续增长，并开始影响元数据规模、写入成本、Compaction 成本或查询成本时，就进入了宽 JSON 问题域。

**Sparse columns（稀疏列）。** 当宽 JSON 有明显的冷热分布时，Sparse 让热点路径继续保留子列列式提取（Subcolumnization）的结果，而冷门（长尾）路径进入共享的稀疏存储。稀疏存储支持分片，将对多个物理列进行分散存储以提升读并行度。

<img src="/images/variant/variant-sparse-storage.png" alt="Sparse Columns：冷热路径分离" width="720" />

如上图所示，热点路径（如 `user_id`、`page`）继续以独立列式子列的形式保持高性能分析能力，而数千个长尾路径则汇入共享稀疏存储。阈值通过 `variant_max_subcolumns_count` 控制。

**Sparse sharding（稀疏分片）。** 当长尾路径数量非常大时，单个稀疏列可能成为读取瓶颈。稀疏分片通过哈希将长尾路径分散到多个物理列（`variant_sparse_hash_shard_count`），从而可以并行扫描。

<img src="/images/variant/variant-sparse-sharding.png" alt="Sparse Sharding：长尾路径并行读取" width="720" />

**DOC mode。** 写入时延迟子列列式提取（Subcolumnization），并额外存储一份 map 格式的原始 JSON（即 **doc map**）。这带来了快速导入和高效整条文档返回能力，代价是额外存储。后续 Compaction 时仍会完成 Subcolumnization。

<img src="/images/variant/variant-doc-mode.png" alt="DOC Mode：延迟提取 + 快速文档返回" width="700" />

如上图所示，写入时 JSON 被原样保存到 Doc Store 以实现快速导入。子列在后续 Compaction 过程中提取。读取时，按路径查询（如 `SELECT v['user_id']`）从物化子列中以列式速度读取；而整条文档查询（`SELECT v`）则直接从 Doc Store 中读取，无需从大量子列重组文档。

DOC mode 的读取路径取决于被查询的路径是否已经物化：

<img src="/images/variant/variant-doc-mode-readpaths.png" alt="DOC Mode：读取路径详情" width="720" />

- **DOC Materialized**：被查询的路径已经提取为 subcolumn（Compaction 后或 `variant_doc_materialization_min_rows` 条件满足后）。以列式速度读取，与默认 VARIANT 一样快。
- **DOC Map**：被查询的路径尚未物化。查询回退到扫描整个 doc map 来查找值 —— 在宽 JSON 上显著变慢。
- **DOC Map（分片）**：同样的回退路径，但通过 `variant_doc_hash_shard_count` 将 doc map 分散到多个物理列，实现并行扫描，大幅加速恢复速度。

**Storage Format V3。** 把列元数据从 Segment Footer 中解耦出来。推荐在所有 `VARIANT` 表上使用，尤其是宽 JSON 场景，因为它消除了上千子列同时存在时的元数据瓶颈。

## 推荐决策路径

<img src="/images/variant/variant-decision-flowchart.png" alt="VARIANT 模式决策路径" width="520" />

## 存储模式

先用下表选一个起点，再看对应章节。

| | 典型场景 | 推荐模式 | 关键配置 |
|---|---|---|---|
| **A** | 事件日志、审计日志 | 默认 VARIANT + V3 | 保持默认 |
| **B** | 广告/遥测/用户画像（宽、热点少） | Sparse + V3 | `variant_max_subcolumns_count`、`variant_sparse_hash_shard_count` |
| **C** | 模型输出/Trace/归档（写入优先或整条返回） | DOC mode + V3 | `variant_enable_doc_mode`、`variant_doc_materialization_min_rows` |
| **D** | 订单/支付/设备（关键路径需稳定类型） | Schema Template + A 或 B | 只定义关键路径 |

### 默认模式

这是大多数新 `VARIANT` 场景最稳妥的起点。

典型例子：事件日志或审计载荷，查询反复落在少量常见路径上。

```sql
CREATE TABLE IF NOT EXISTS event_log (
    ts DATETIME NOT NULL,
    event_id BIGINT NOT NULL,
    event_type VARCHAR(64),
    payload VARIANT
)
DUPLICATE KEY(`ts`, `event_id`)
DISTRIBUTED BY HASH(`event_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

适合在你还不确定这个场景是否宽到需要 Sparse 或 DOC mode 时使用，尤其是主要价值仍然来自几个常见路径的过滤、聚合和分组。

注意：
- 不要在没有证据的情况下，一开始就把 `variant_max_subcolumns_count` 调得很大。
- 如果 JSON 并不宽，开启 Sparse 或 DOC mode 只会增加复杂度而没有收益。

### Sparse 模式

当 JSON 很宽，但查询依然集中在少量热点路径上时，优先 Sparse。

典型例子：广告、遥测或用户画像 JSON，属性很多，但真正稳定查询的只有少量字段。

```sql
CREATE TABLE IF NOT EXISTS telemetry_wide (
    ts DATETIME NOT NULL,
    device_id BIGINT NOT NULL,
    attributes VARIANT<
        'device_type' : STRING,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_sparse_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `device_id`)
DISTRIBUTED BY HASH(`device_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

适合总 key 数很多，但主要目标仍然是路径级过滤、聚合和索引的场景。

注意：
- 如果瓶颈还是热点路径分析，就不要先跳到 DOC mode。
- `variant_max_subcolumns_count` 默认就是 `2048`，已经覆盖大多数 workload 的自动子列列式提取需求。不要把它设得过大，导致事实上全部路径都被列化；如果场景确实需要更大规模的子列列式提取，优先参考 [DOC 模式](#doc-mode-template)。

### DOC 模式 {#doc-mode-template}

当整条 JSON 返回能力或写入效率比路径分析更重要时，优先 DOC mode。

典型例子：模型输出、Trace 快照或归档文档，查询经常直接取回完整 JSON。

**DOC mode 更适合下面几类诉求：**

- 当子列列式提取规模接近万列级别时，硬件要求会明显提高。DOC mode 在这个规模下更稳定。
- 相比默认的即时 Subcolumnization，compaction 内存可下降约 2/3。
- 在稀疏宽列导入场景下，导入性能可提升约 5～10 倍。
- 当查询直接读取整个 `VARIANT` 值（`SELECT variant_col`）时，DOC mode 无需从数千子列重组文档，效率可获得数量级提升。

**开始使用：**

```sql
CREATE TABLE IF NOT EXISTS trace_archive (
    ts DATETIME NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    span VARIANT<
        'service_name' : STRING,
        properties(
            'variant_enable_doc_mode' = 'true',
            'variant_doc_materialization_min_rows' = '10000',
            'variant_doc_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `trace_id`)
DISTRIBUTED BY HASH(`trace_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

适合导入吞吐优先、查询经常需要整条 JSON，或者超宽列上频繁直接执行 `SELECT variant_col` 的场景。

注意：
- DOC mode 不是所有宽 JSON 场景的默认答案。若核心诉求是热点路径分析，通常还是 Sparse 更合适。
- DOC mode 和 Sparse 互斥，不能同时开启。

### Schema Template 模式

当只有少量路径需要稳定类型、稳定行为或路径级索引时，优先 Schema Template。

典型例子：订单、支付或设备载荷里，少数字段必须保持稳定类型和可检索性。

```sql
CREATE TABLE IF NOT EXISTS order_events (
    ts DATETIME NOT NULL,
    order_id BIGINT NOT NULL,
    detail VARIANT<
        'status' : STRING,
        'amount' : DECIMAL(18, 2),
        'currency' : STRING
    >,
    INDEX idx_status(detail) USING INVERTED PROPERTIES("field_pattern" = "status")
)
DUPLICATE KEY(`ts`, `order_id`)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

适合关键业务字段不多，但其中某些路径必须有更严格的类型和索引策略的场景。可以与默认 `VARIANT` 或 Sparse 组合使用。

注意：
- 不要试图把整个 JSON 都静态模板化，这会削弱 `VARIANT` 的意义。
- Schema Template 只用于关键路径，其余保持动态。

## 性能

下图对比了 10K 路径宽列数据集上的单路径提取耗时（200K 行，提取 key5000，16 CPU，3 次取中位数）。

<img src="/images/variant/variant-bench-query-time.svg" alt="宽列单路径提取：查询耗时" width="720" />

| 模式 | 查询耗时 | 峰值内存 |
|---|---:|---:|
| DOC Materialized | 76 ms | 1 MiB |
| VARIANT 默认 | 76 ms | 1 MiB |
| DOC Map（分片） | 148 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| DOC Map | 2,533 ms | 1 MiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING (原始 JSON) | 6,104 ms | 48 GiB |

要点：

- **物化子列最快。** 默认模式和 DOC Materialized 均约 76 ms —— 是原始 STRING 的 80 倍、JSONB 的 12 倍。
- **DOC Map 分片有效。** 分片后 doc map 查询从 2.5 s 降至 148 ms。
- **JSONB 和 STRING 内存开销大。** 峰值内存 32–48 GiB，而 VARIANT 各模式仅 1 MiB。

## 最佳实践

### 导入阶段

- **新的 `VARIANT` 表优先使用 Storage Format V3。** V3 把列元数据从 Segment Footer 解耦。没有它，宽 JSON 场景下文件打开速度慢、内存开销高。
- **关键路径尽早通过 Schema Template 固定类型。** 如果同一路径在不同批次出现不同类型（如先整数后字符串），会被提升为 JSONB，该路径上的索引也会失效。
- **从默认配置起步，基于症状调参。** 大多数 workload 用默认配置就够了。只有在 AI 训练、车联网、用户标签等场景需要支撑更大规模的子列列式提取（Subcolumnization）和大量路径级索引时，才建议按访问模式调优。一开始就过度配置（如很大的 `variant_max_subcolumns_count`、不需要时就开启 DOC mode）只会增加复杂度，没有收益证据。

### 查询阶段

- **不要把 `SELECT *` 当成超宽 `VARIANT` 列的主查询模式。** 没有 DOC mode 时，`SELECT *` 或 `SELECT variant_col` 需要从所有子列重组 JSON，远慢于指定路径查询如 `SELECT v['path']`。
- **查询依赖路径类型时，务必显式 CAST。** 自动推断的类型可能与预期不一致。如果 `v['id']` 实际存储为 STRING，但你用整数字面量做比较，索引不会被使用，结果也可能不正确。

### 运维阶段

- **关注 Compaction 压力。** 子列增长会增加合并成本。如果 Compaction Score 持续上升，检查 `variant_max_subcolumns_count` 是否设置过高或导入速率是否过快。
- **关注 schema 漂移。** 如果 JSON 结构频繁变化，热点路径可能被挤入稀疏存储，导致查询性能突然退化。通过 Schema Template 锁定关键路径。
- **关注类型冲突。** 同一路径频繁出现类型冲突，说明该路径应通过 Schema Template 锁定类型，避免 JSONB 提升和索引失效。

## 快速验证

建表后，用以下最小序列验证一切正常：

```sql
-- 插入示例数据
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', '{"page": "home", "user_id": 42, "duration_ms": 320}'),
    ('2025-01-01 10:00:01', 1002, 'purchase', '{"item": "widget", "price": 9.99, "user_id": 42}'),
    ('2025-01-01 10:00:02', 1003, 'click', '{"page": "search", "user_id": 99, "query": "doris variant"}');

-- 验证数据
SELECT payload['user_id'], payload['page'] FROM event_log;

-- 查看 Subcolumnization 结果
SET describe_extend_variant_column = true;
DESC event_log;

-- 查看每行类型
SELECT variant_type(payload) FROM event_log;
```

## 延伸阅读

- [VARIANT](./VARIANT)
- [导入 Variant 数据](../../../../data-operate/import/complex-types/variant)
- [Storage Format V3](../../../../table-design/storage-format)
- [SEARCH Function](../../../../ai/text-search/search-function)
