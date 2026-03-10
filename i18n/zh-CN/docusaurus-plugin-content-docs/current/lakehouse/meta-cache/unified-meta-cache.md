---
{
    "title": "统一外表元数据缓存（4.1.x+）",
    "language": "zh-CN",
    "description": "面向用户的统一外表元数据缓存使用说明：统一配置键 meta.cache.*、缓存覆盖范围、以及各类 Catalog 的配置入口。"
}
---

从 **Doris 4.1.x** 开始，External Catalog 的外表元数据缓存能力进行了统一化重构。统一外表元数据缓存标准化了不同数据湖引擎（如 Hive, Iceberg 等）的缓存配置模型与监控体系，降低了多数据源管理的配置门槛和排障难度。

对用户来说，主要关注三件事：

- **影响哪些内容**：取决于不同 catalog 引擎（分区信息、文件列表、表元数据、manifest 等）。
- **在哪里配置**：在 Catalog `PROPERTIES` 里使用统一键 `meta.cache.*`（具体 entry 见下方各 catalog 文档）。
- **如何观测**：通过 `information_schema.catalog_meta_cache_statistics` 系统表查看指标（见本文观测章节）。

:::tip
适用于 Doris 4.1.x 及之后版本。
:::

## 外表 Meta Cache 覆盖范围

在学习如何配置之前，首先需要明确该缓存覆盖的范围。这里有两层缓存比较容易混淆：

- **Catalog 对象/名称缓存**：如 `SHOW DATABASES`、`SHOW TABLES`、库对象、表对象等，这部分属于通用缓存，详情见 [元数据缓存](../meta-cache.md)。
- **引擎 entry 缓存**：各引擎特有的运行时元数据，如 Hive 分区/文件、Iceberg manifest、Paimon table handle、schema entry 等。**本文主要针对这一层进行说明。**

外表元数据 cache entry 覆盖多种元数据类型。其中一部分由统一 `meta.cache.*` 键配置，另一部分同时继承 FE 级默认值：

| 类别 | 示例 | 配置方式 |
|---|---|---|
| 引擎 entry 缓存 | Hive `partition_values` / `partition` / `file`、Iceberg `manifest`、Paimon `table` 等 | Catalog `PROPERTIES`：`meta.cache.<engine>.<entry>.*` |
| Schema cache | 各引擎自己的 `schema` entry，按 schema version token 隔离 | FE 配置提供默认值，Catalog `meta.cache.<engine>.schema.*` 可覆盖 |

## 统一属性模型

各引擎 cache entry 使用统一的配置键格式：

`meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`

下表说明属性语义：

| 属性 | 示例 | 含义 |
|---|---|---|
| `enable` | `true/false` | 是否启用该缓存 entry。 |
| `ttl-second` | `600`、`0`、`-1` | `0` 表示关闭；`-1` 表示永不过期；其他值表示按访问时间计算 TTL。 |
| `capacity` | `10000` | 最大缓存条目数（按条目数量计）。`0` 表示关闭。 |

**生效逻辑说明：**
只有当 `enable=true` 且 `ttl-second > 0`（或为 -1）且 `capacity > 0` 时，该模块缓存才会真正生效（对应观测表中的 `EFFECTIVE_ENABLED = true`）。

说明：

- `<entry>` 使用 catalog 文档和 stats 表中展示的 cache entry 名，例如 `partition_values`、`fs_view`、`meta_client`。
- 当前没有 per-entry 的刷新周期参数。异步刷新周期仍由 FE 配置 `external_cache_refresh_time_minutes` 统一控制。

示例：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  -- 将 Hive 的文件列表缓存 TTL 设置为 0，即刻关闭该缓存
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## 支持矩阵与配置入口

下面的表总结了各引擎支持的缓存项，以及是否支持热生效，并提供了具体配置说明的链接：

| Catalog 引擎 | 在 stats 表里能看到的 entry (`<entry>`) | `ALTER CATALOG ... SET PROPERTIES` 热生效 | 详细配置说明链接 |
|---|---|---|---|
| Hive | `schema`、`partition_values`、`partition`、`file` | `meta.cache.hive.*` 的变更不会通过统一热生效路径应用；需重建 catalog 或重启 FE 后生效 | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-unified) |
| Iceberg | `schema`、`table`、`view`、`manifest` | 支持 | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-unified) |
| Paimon | `schema`、`table` | 支持 | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-unified) |
| Hudi | `schema`、`partition`、`fs_view`、`meta_client` | 支持，通过 HMS catalog 属性更新路径生效 | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-unified) |
| MaxCompute | `schema`、`partition_values` | 没有专门的热生效 hook | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-unified) |

:::caution
**Hive Catalog 注意事项**：Hive 的 `meta.cache.hive.*` 属性修改**不支持热生效**。修改配置后，必须重建 Catalog 或重启 FE 节点才能应用新的缓存配置。
:::

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
| `LOAD_FAILURE_COUNT` | 从外部系统加载数据的失败次数。当查询变慢或报错时，可优先查看此字段排查上游系统异常。 |
| `LAST_ERROR` | 最后一次加载失败的错误信息。对排查 HMS、S3 等超时或连接异常极其有用。 |

常见查询方式是按 `catalog_name` 和 `engine_name` 过滤。该系统表不再使用旧的 `cache_name` / `metric_name` 透视模型。

## 旧参数迁移说明

从 Doris 4.1.x 开始，旧版 catalog cache 参数（例如 `schema.cache.ttl-second`、`file.meta.cache.ttl-second`）已不再推荐使用。请改用 `meta.cache.*` 统一键，并参考上文对应的 catalog 文档。
