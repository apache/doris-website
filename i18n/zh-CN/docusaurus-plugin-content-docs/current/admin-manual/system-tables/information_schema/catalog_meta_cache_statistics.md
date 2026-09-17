---
{
    "title": "catalog_meta_cache_statistics",
    "language": "zh-CN",
    "description": "查看 FE 节点上的 External Catalog 元数据缓存配置、运行状态和内存治理统计信息。"
}
---

## 概述

`catalog_meta_cache_statistics` 为当前用户可见的每个 FE、External Catalog、元数据缓存引擎和缓存模块显示一行数据。除缓存配置和 Caffeine 运行指标外，该表还显示 Doris 4.1.4 引入的保留内存上限、估算使用量和准入拒绝信息。

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
|---|---|---|
| `FE_HOST` | STRING | 上报该行数据的 FE 节点。 |
| `CATALOG_NAME` | STRING | External Catalog 名称。 |
| `ENGINE_NAME` | STRING | 元数据缓存引擎，例如 `hive`、`iceberg` 或 `paimon`。 |
| `ENTRY_NAME` | STRING | 引擎中的缓存模块名称。 |
| `EFFECTIVE_ENABLED` | BOOLEAN | 综合 enable、TTL、capacity 和 weight 配置后，该模块当前是否实际生效。 |
| `CONFIG_ENABLED` | BOOLEAN | 配置的 `enable` 值。 |
| `AUTO_REFRESH` | BOOLEAN | 是否启用受管理的自动刷新。 |
| `TTL_SECOND` | BIGINT | 过期时间，单位为秒。`-1` 表示永不过期，`0` 表示关闭模块。 |
| `CAPACITY` | BIGINT | 配置的条目数容量。启用 `max-weight` 后不再同时作为条目数上限，但 `0` 仍会关闭模块。 |
| `ESTIMATED_SIZE` | BIGINT | 缓存映射数量的近似值。 |
| `REQUEST_COUNT` | BIGINT | 缓存查询总次数。 |
| `HIT_COUNT` | BIGINT | 缓存命中次数。 |
| `MISS_COUNT` | BIGINT | 缓存未命中次数。 |
| `HIT_RATE` | DOUBLE | 缓存命中率，范围为 `0.0` 到 `1.0`。 |
| `LOAD_SUCCESS_COUNT` | BIGINT | 缓存加载成功次数。 |
| `LOAD_FAILURE_COUNT` | BIGINT | 缓存加载失败次数。 |
| `TOTAL_LOAD_TIME_MS` | BIGINT | 缓存加载总耗时，单位为毫秒。 |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | 平均加载耗时，单位为毫秒。 |
| `EVICTION_COUNT` | BIGINT | Caffeine 和本地预算主动淘汰的次数。 |
| `EVICTION_RATE` | DOUBLE | `EVICTION_COUNT` 与 `REQUEST_COUNT` 的比值；没有请求时为 `0`。 |
| `INVALIDATE_COUNT` | BIGINT | 显式失效缓存的次数。 |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 最近一次加载成功时间。 |
| `LAST_LOAD_FAILURE_TIME` | STRING | 最近一次加载失败时间。 |
| `LAST_ERROR` | STRING | 最近一次加载错误；没有记录时为空。 |
| `MAX_WEIGHT` | BIGINT | 模块的有效内存上限，单位为字节。 |
| `ESTIMATED_WEIGHT` | BIGINT | 当前模块已预留的估算内存，单位为字节。 |
| `WEIGHT_REJECT_COUNT` | BIGINT | 因估算不完整或权重预算不足而拒绝缓存准入的累计次数。 |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 最近一次权重准入拒绝原因。 |

对于没有任何 FE、Catalog 或模块级内存上限作用的模块，`MAX_WEIGHT` 为 `-1`，`ESTIMATED_WEIGHT` 为 `0`。

weight 列有两种时间语义：

- `ESTIMATED_WEIGHT` 是瞬时值（gauge），表示查询时刻已预留的估算内存。
- `WEIGHT_REJECT_COUNT` 以及其他计数列是当前缓存实例的累计值。修改 Catalog 属性导致缓存重建，或 FE 重启后，它们会从零重新累计。

系统表不保留历史样本。需要观察趋势时，请定期采样。

## 使用示例

按 Catalog 汇总受内存管理模块的预留量。排查 FE 内存问题时通常先执行这条查询：

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

查看按内存管理的模块及其最近一次准入结果：

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

查看指定 Catalog 的缓存效果和加载失败信息：
查看指定 Catalog 的缓存效果和加载失败信息：

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
