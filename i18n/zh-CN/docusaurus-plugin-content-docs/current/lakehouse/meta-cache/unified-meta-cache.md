---
{
    "title": "统一外表元数据缓存（4.1.x+）",
    "language": "zh-CN",
    "description": "面向用户的统一外表元数据缓存使用说明：统一配置键 meta.cache.*、缓存覆盖范围、以及各类 Catalog 的配置入口。"
}
---

从 **Doris 4.1.x** 开始，External Catalog 的外表元数据缓存能力进行了统一化重构。对用户来说，主要关注三件事：

| 你需要关心的问题 | 对应入口 |
|---|---|
| 在哪里配置 | 在 Catalog `PROPERTIES` 里使用统一键 `meta.cache.*`（具体 module 见下方各 catalog 文档）。 |
| 影响哪些内容 | 取决于不同 catalog 引擎（分区信息、文件列表、表元数据、manifest 等）。 |
| 如何观测 | 通过 `information_schema.catalog_meta_cache_statistics` 查看指标（见本文观测章节）。 |

:::tip
适用于 Doris 4.1.x 及之后版本。
:::

## 统一属性模型

各引擎 cache entry 使用统一的配置键格式：

`meta.cache.<engine>.<module>.{enable,ttl-second,capacity}`

下表说明属性语义：

| 属性 | 示例 | 含义 |
|---|---|---|
| `enable` | `true/false` | 是否启用该缓存 module。 |
| `ttl-second` | `600`、`0`、`-1` | `0` 表示关闭；`-1` 表示永不过期；其他值表示按访问时间计算 TTL。 |
| `capacity` | `10000` | 最大缓存条目数（按条目数量计）。`0` 表示关闭。 |

说明：

- `<module>` 使用 catalog 文档和 stats 表中展示的 cache entry 名，例如 `partition_values`、`fs_view`、`meta_client`。
- 当前没有 per-entry 的刷新周期参数。异步刷新周期仍由 FE 配置 `external_cache_refresh_time_minutes` 统一控制。

示例：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## 外表 Meta Cache 覆盖范围

这里有两层缓存，比较容易混淆：

- Catalog 对象/名称缓存：如 `SHOW DATABASES`、`SHOW TABLES`、库对象、表对象等，见 [元数据缓存](../meta-cache.md)。
- 引擎 entry 缓存：如 Hive 分区/文件、Iceberg manifest、Paimon table handle、schema entry 等。本文主要讲这一层。

外表元数据 cache entry 覆盖多种元数据类型。其中一部分由统一 `meta.cache.*` 键配置，另一部分同时继承 FE 级默认值：

| 类别 | 示例 | 配置方式 |
|---|---|---|
| 引擎 entry 缓存 | Hive `partition_values` / `partition` / `file`、Iceberg `manifest`、Paimon `table` 等 | Catalog `PROPERTIES`：`meta.cache.<engine>.<module>.*` |
| Schema cache | 各引擎自己的 `schema` entry，按 schema version token 隔离 | FE 配置提供默认值，Catalog `meta.cache.<engine>.schema.*` 可覆盖 |

## 支持矩阵

下面的表总结了当前实现状态：

| 引擎 | 在 stats 表里能看到的 entry | 属性键前缀 | `ALTER CATALOG ... SET PROPERTIES` 热生效 |
|---|---|---|---|
| Hive | `schema`、`partition_values`、`partition`、`file` | `meta.cache.hive.<entry>.*` | `meta.cache.hive.*` 的变更不会通过统一热生效路径应用；需重建 catalog 或重启 FE 后生效 |
| Iceberg | `schema`、`table`、`view`、`manifest` | `meta.cache.iceberg.<entry>.*` | 支持 |
| Paimon | `schema`、`table` | `meta.cache.paimon.<entry>.*` | 支持 |
| Hudi | `schema`、`partition`、`fs_view`、`meta_client` | `meta.cache.hudi.<entry>.*` | 支持，通过 HMS catalog 属性更新路径生效 |
| MaxCompute | `schema`、`partition_values` | `meta.cache.maxcompute.<entry>.*` | 没有专门的热生效 hook |

## 各类 Catalog 的配置入口（链接）

不同 Catalog 引擎支持的缓存 module 不同，具体 module、推荐配置与可观测性请参考对应 Catalog 文档：

| Catalog 引擎 | module 缓存配置与可观测性 |
|---|---|
| Hive | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-unified) |
| Iceberg | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-unified) |
| Paimon | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-unified) |
| Hudi | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-unified) |
| MaxCompute | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-unified) |

## 观测方式

通过系统表统一观测缓存指标：

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, engine_name, entry_name;
```

该系统表文档见：[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)。

可以这样理解这些字段：

| 内容 | 说明 |
|---|---|
| `ENGINE_NAME` | 缓存引擎，如 `hive`、`iceberg` |
| `ENTRY_NAME` | 该引擎下的精确 entry 名，如 `partition_values`、`fs_view`、`manifest` |
| `EFFECTIVE_ENABLED` | 综合 `enable`、`ttl-second`、`capacity` 后最终是否生效 |

常见查询方式是按 `catalog_name` 和 `engine_name` 过滤。该系统表不再使用旧的 `cache_name` / `metric_name` 透视模型。

## 旧参数迁移说明

从 Doris 4.1.x 开始，旧版 catalog cache 参数（例如 `schema.cache.ttl-second`、`file.meta.cache.ttl-second`）已不再推荐使用。请改用 `meta.cache.*` 统一键，并参考上文对应的 catalog 文档。
