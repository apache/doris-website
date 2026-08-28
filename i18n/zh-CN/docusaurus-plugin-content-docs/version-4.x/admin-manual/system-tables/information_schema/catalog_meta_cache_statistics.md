---
{
    "title": "catalog_meta_cache_statistics",
    "language": "zh-CN",
    "description": "查看 FE 节点上的 External Catalog 元数据缓存配置、运行状态和内存治理统计信息。"
}
---

## 概述

`catalog_meta_cache_statistics` 为当前用户可见的每个 FE、External Catalog、元数据缓存引擎和缓存模块显示一行数据。除缓存配置和 Caffeine 运行指标外，该表还显示 Doris 4.1.4 引入的保留内存上限、估算使用量、淘汰内存和准入拒绝信息。

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
| `INVALIDATE_COUNT` | BIGINT | 显式失效缓存的次数。 |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 最近一次加载成功时间。 |
| `LAST_LOAD_FAILURE_TIME` | STRING | 最近一次加载失败时间。 |
| `LAST_ERROR` | STRING | 最近一次加载错误；没有记录时为空。 |
| `WEIGHT_BOUNDED` | BOOLEAN | 当前模块是否受到 FE、Catalog 或模块级内存上限约束。 |
| `MAX_WEIGHT` | BIGINT | 模块的有效内存上限，单位为字节。 |
| `ESTIMATED_WEIGHT` | BIGINT | 当前模块已预留的估算内存，单位为字节。 |
| `EVICTION_WEIGHT` | BIGINT | 自动淘汰和本地预算淘汰累计释放的估算字节数。 |
| `WEIGHT_REJECT_COUNT` | BIGINT | 因估算不完整或权重预算不足而拒绝缓存准入的次数。 |
| `CATALOG_MAX_WEIGHT` | BIGINT | Catalog 内存上限，单位为字节。 |
| `CATALOG_ESTIMATED_WEIGHT` | BIGINT | 当前 Catalog 中受管理模块已预留的估算内存。 |
| `GLOBAL_MAX_WEIGHT` | BIGINT | FE 外部元数据缓存总内存上限，单位为字节。 |
| `GLOBAL_ESTIMATED_WEIGHT` | BIGINT | 当前 FE 上受管理外部元数据缓存已预留的估算内存。 |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 最近一次权重准入拒绝原因。 |

对于仍按条目数管理的模块，或者未配置的父级上限，不适用的 weight 数值列使用 `-1`。

## 使用示例

查看按内存管理的模块及其最近一次准入结果：

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight, eviction_weight,
       weight_reject_count, last_weight_reject_reason,
       catalog_max_weight, catalog_estimated_weight,
       global_max_weight, global_estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE weight_bounded = true
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

查看指定 Catalog 的缓存效果和加载失败信息：

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
