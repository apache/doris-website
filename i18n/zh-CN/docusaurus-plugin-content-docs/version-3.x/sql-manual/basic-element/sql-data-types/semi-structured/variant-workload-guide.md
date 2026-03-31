---
{
    "title": "VARIANT 使用与配置指南",
    "language": "zh-CN",
    "description": "帮助用户判断在 Doris 3.x 中何时使用 VARIANT、何时开启 Sparse，以及何时增加 Schema Template 或路径级索引。"
}
---

## 概览

`VARIANT` 用来存储半结构化 JSON，并对常用路径执行子列列式提取（Subcolumnization）。

这篇文档用来帮你给 Doris 3.x 的 `VARIANT` 场景选方案。适合在落地前先回答下面这些问题：

- 这个场景应该用 `VARIANT`，还是直接建静态列？
- JSON 开始变宽时，应该继续使用默认模式，还是开启 Sparse？
- 什么时候应该增加 Schema Template 或路径级索引？

如果你已经确定要使用 `VARIANT`，只是想查语法或类型规则，请直接看 [VARIANT](./VARIANT)。如果你只需要一个最小可运行的导入示例，请看 [导入 Variant 数据](../../../../data-operate/import/complex-types/variant)。

:::tip 为什么使用 VARIANT
`VARIANT` 保留了 JSON 的灵活性，同时又能让 Doris 对常用路径执行子列列式提取（Subcolumnization）。在 Doris 3.1 及以上版本里，宽 JSON 还可以让热点路径继续保留 Subcolumnization 的结果，长尾路径进入共享稀疏存储，不必先把所有字段固定下来。
:::

:::note 3.x 版本边界
这篇指南只覆盖 Doris 3.x 已支持的能力。Sparse、`variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse` 以及路径级索引都要求 Doris 3.1.0 及以上版本；更新版本中的 DOC mode 指南不适用于 Doris 3.x。
:::

## 什么时候适合用 VARIANT

当以下条件大多成立时，优先考虑 `VARIANT`：

- 输入是 JSON 或其他半结构化载荷，而且字段会持续演进。
- 查询通常集中在一部分热点路径，而不是每一行都访问全部字段。
- 你希望保留 schema 灵活性，同时获得列式分析性能。
- 只有少量关键路径需要索引，其余路径可以保持动态。

当以下条件更占主导时，优先考虑静态列：

- schema 稳定，并且可以提前定义清楚。
- 核心字段经常作为 Join Key、排序键，或者必须严格类型治理。
- 主要诉求是原样存档 JSON，或者频繁整条返回完整文档，而不是按路径做分析。

## 关键概念

阅读下面的存储模式之前，先确认以下术语清晰。每个概念用 2-3 行讲清边界；实现细节请参考 [VARIANT](./VARIANT)。

**子列列式提取（Subcolumnization）。** 写入 `VARIANT` 列时，Doris 会自动发现 JSON Path，并对热点路径执行子列列式提取，使其以独立子列的形式参与分析。

![默认 VARIANT：自动子列提取](/images/variant/variant-default-storage.png)

**Schema Template（3.1+）。** 一种在 `VARIANT` 列上的声明，用来把部分路径固定为稳定类型。它适合少量关键业务字段，让这些路径的类型、索引和行为更可控；不应试图穷举所有可能路径。

**宽 JSON。** 当 JSON Path 的总数持续增长，并开始影响元数据规模、写入成本、Compaction 成本或查询成本时，就进入了宽 JSON 问题域。

**Sparse columns（稀疏列，3.1+）。** 当宽 JSON 有明显的冷热分布时，Sparse 让热点路径继续保留子列列式提取（Subcolumnization）的结果，而冷门（长尾）路径进入共享的稀疏存储。使用 `variant_max_subcolumns_count` 控制边界。

![Sparse Columns：冷热路径分离](/images/variant/variant-sparse-storage.png)

如上图所示，热点路径（如 `user_id`、`page`）继续以独立列式子列的形式保持高性能分析能力，而数千个长尾路径则汇入共享稀疏存储。阈值通过 `variant_max_subcolumns_count` 控制。

## 推荐决策路径

![VARIANT 模式决策路径 (Doris 3.x)](/images/variant/variant-decision-flowchart-3x.png)

如果宽 JSON 的主访问模式是整条文档返回，Doris 3.x 的 `VARIANT` 往往不是最佳匹配，因为没有 DOC mode。不建议在超宽列上把 `SELECT variant_col` 作为主查询模式。

对大多数 workload 来说，默认配置已经是合适的起点。只有在访问模式比较特殊时，才需要按场景调优。典型例子包括 AI 训练特征载荷、车联网遥测、用户标签系统这类在 Doris 3.1 及以上版本中需要支撑大规模子列列式提取（Subcolumnization）和大量路径级索引的场景。

## 存储模式

先用下表选一个起点，再看对应章节。

| | 典型场景 | 推荐模式 | 关键配置 |
|---|---|---|---|
| **A** | 事件日志、审计日志 | 默认 VARIANT | 保持默认 |
| **B** | 广告/遥测/用户画像（宽、热点少） | Sparse（3.1+） | `variant_max_subcolumns_count` |
| **C** | 订单/支付/设备（关键路径需稳定类型） | Schema Template（3.1+） + A 或 B | 只定义关键路径 |

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
    "replication_num" = "1"
);
```

适合在你还不确定这个场景是否宽到需要 Sparse 时使用，尤其是主要价值仍然来自几个常见路径的过滤、聚合和分组。

注意：
- 不要在没有证据的情况下，一开始就把 `variant_max_subcolumns_count` 调得很大。
- 如果 JSON 并不宽，开启 Sparse 只会增加复杂度而没有收益。

### Sparse 模式

> 此模板需要 Doris 3.1.0 及以上版本。

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
            'variant_enable_typed_paths_to_sparse' = 'true'
        )
    >
)
DUPLICATE KEY(`ts`, `device_id`)
DISTRIBUTED BY HASH(`device_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1"
);
```

适合总 key 数很多，但主要目标仍然是路径级过滤、聚合和索引的场景。

注意：
- 如果瓶颈还是热点路径分析，Sparse 是 3.x 中的正确方向。
- 不要把 `variant_max_subcolumns_count` 设得过大，导致事实上全部路径都被列化。这会增加元数据和 Compaction 开销。

### Schema Template 模式

> 此模板需要 Doris 3.1.0 及以上版本。

当少量路径需要稳定类型、稳定行为或路径级索引时，优先使用 Schema Template。

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
    "replication_num" = "1"
);
```

适合关键业务字段不多，但其中某些路径必须有更严格的类型和索引策略的场景。可以与默认 `VARIANT` 或 Sparse 组合使用。

注意：
- 不要试图把整个 JSON schema 都固化成静态模板，这会抵消 `VARIANT` 的价值。
- Schema Template 只用于关键路径，其余保持动态。

## 性能

下图对比了 10K 路径宽列数据集上的单路径提取耗时（200K 行，提取 key5000，16 CPU，3 次取中位数）。

![宽列单路径提取：查询耗时](/images/variant/variant-bench-query-time-3x.svg)

| 模式 | 查询耗时 | 峰值内存 |
|---|---:|---:|
| VARIANT 默认 | 76 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING（原始 JSON） | 6,104 ms | 48 GiB |

要点：

- **VARIANT 默认最快。** 76 ms —— 是 JSONB 的 12 倍、原始 STRING 的 80 倍。
- **JSONB 和 STRING 内存开销大。** 峰值内存 32–48 GiB，而 VARIANT 仅 1 MiB。

## 最佳实践

### 导入阶段

- **关键路径尽早通过 Schema Template 固定类型（3.1+）。** 如果同一路径在不同批次出现不同类型（如先整数后字符串），会被提升为 JSONB，该路径上的索引也会失效。
- **从默认配置起步，基于症状调参。** 大多数 workload 用默认配置就够了。只有在 Doris 3.1 及以上版本中，AI 训练、车联网、用户标签等场景需要支撑更大规模的子列列式提取（Subcolumnization）和大量路径级索引时，才建议按访问模式调优。一开始就过度配置（如很大的 `variant_max_subcolumns_count`）只会增加复杂度，没有收益证据。

### 查询阶段

- **不要把 `SELECT *` 当成超宽 `VARIANT` 列的主查询模式。** Doris 3.x 没有 DOC mode，`SELECT *` 或 `SELECT variant_col` 需要从所有子列重组 JSON，在超宽列上非常昂贵。
- **查询依赖路径类型时，务必显式 CAST。** 自动推断的类型可能与预期不一致。如果 `v['id']` 实际存储为 STRING，但你用整数字面量做比较，索引不会被使用，结果也可能不正确。

### 运维阶段

- **关注 Compaction 压力。** 子列增长会增加合并成本。如果 Compaction Score 持续上升，检查 `variant_max_subcolumns_count` 是否设置过高或导入速率是否过快。
- **关注 schema 漂移。** 如果 JSON 结构频繁变化，热点路径可能被挤入稀疏存储，导致查询性能突然退化。通过 Schema Template 锁定关键路径。
- **关注类型冲突。** 同一路径频繁出现类型冲突，说明该路径应通过 Schema Template 锁定类型，避免 JSONB 提升和索引失效。
- **如果宽列查询越来越依赖整条文档返回**，需要重新评估 Doris 3.x `VARIANT` 是否仍然适合这个场景。

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

## 相关文档

- [VARIANT](./VARIANT)
- [导入 Variant 数据](../../../../data-operate/import/complex-types/variant)
- [倒排索引](../../../../table-design/index/inverted-index)
- [全文检索运算符](../../operators/conditional-operators/full-text-search-operators)
