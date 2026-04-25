---
{
    "title": "catalog_meta_cache_statistics",
    "language": "zh-CN",
    "description": "查看当前连接的 FE 中，External Catalog 的元数据缓存信息。"
}
---

## 概述

查看当前连接的 FE 中，External Catalog 的元数据缓存信息。

## 所属数据库


`information_schema`


## 表信息

该表中一行表示“某个 FE 上、某个 external catalog 的一个 cache entry”的统计快照。

| 列名 | 类型 | 说明 |
| :----------- | :--- | :----------- |
| FE_HOST | text | 上报该统计的 FE 主机 |
| CATALOG_NAME | text | Catalog 名字 |
| ENGINE_NAME | text | Meta cache 引擎名，如 `hive`、`iceberg`、`paimon` |
| ENTRY_NAME | text | 引擎内部的 cache entry 名，如 `schema`、`file`、`manifest` |
| EFFECTIVE_ENABLED | boolean | 综合 `enable` / `ttl-second` / `capacity` 后，该缓存是否真正生效 |
| CONFIG_ENABLED | boolean | 配置中的原始 `enable` 值 |
| AUTO_REFRESH | boolean | 该 entry 是否启用异步 refresh-after-write |
| TTL_SECOND | bigint | TTL 秒数。`0` 表示关闭，`-1` 表示永不过期 |
| CAPACITY | bigint | 最大条目数 |
| ESTIMATED_SIZE | bigint | 当前缓存条目估计数 |
| REQUEST_COUNT | bigint | 总请求数 |
| HIT_COUNT | bigint | 命中次数 |
| MISS_COUNT | bigint | 未命中次数 |
| HIT_RATE | double | 命中率 |
| LOAD_SUCCESS_COUNT | bigint | 成功加载次数 |
| LOAD_FAILURE_COUNT | bigint | 失败加载次数 |
| TOTAL_LOAD_TIME_MS | bigint | 总加载耗时，单位毫秒 |
| AVG_LOAD_PENALTY_MS | double | 平均加载耗时，单位毫秒 |
| EVICTION_COUNT | bigint | 被驱逐条目数 |
| INVALIDATE_COUNT | bigint | 显式失效次数 |
| LAST_LOAD_SUCCESS_TIME | text | 最近一次成功加载时间 |
| LAST_LOAD_FAILURE_TIME | text | 最近一次失败加载时间 |
| LAST_ERROR | text | 最近一次加载失败错误信息 |


## 使用示例

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, last_error
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, engine_name, entry_name;
```

常见用法：

- 用 `ENGINE_NAME` + `ENTRY_NAME` 定位具体的逻辑缓存。
- 用 `EFFECTIVE_ENABLED`、`TTL_SECOND`、`CAPACITY` 确认实际生效的缓存策略。
- 用 `HIT_RATE`、`ESTIMATED_SIZE`、`LOAD_FAILURE_COUNT`、`LAST_ERROR` 排查缓存行为。
