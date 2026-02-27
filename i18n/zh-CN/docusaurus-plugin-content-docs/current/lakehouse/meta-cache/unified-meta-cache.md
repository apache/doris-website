---
{
    "title": "统一外表元数据缓存（4.0.4+）",
    "language": "zh-CN",
    "description": "面向用户的统一外表元数据缓存使用说明：统一配置键 meta.cache.*、缓存覆盖范围、以及各类 Catalog 的配置入口。"
}
---

从 **Doris 4.0.4** 开始，External Catalog 的外表元数据缓存能力进行了统一化重构。对用户来说，主要关注三件事：

| 你需要关心的问题 | 对应入口 |
|---|---|
| 在哪里配置 | 在 Catalog `PROPERTIES` 里使用统一键 `meta.cache.*`（具体 module 见下方各 catalog 文档）。 |
| 影响哪些内容 | 取决于不同 catalog 引擎（分区信息、文件列表、表元数据、manifest 等）。 |
| 如何观测 | 通过 `information_schema.catalog_meta_cache_statistics` 查看指标（见本文观测章节）。 |

:::tip
适用于 Doris 4.0.4 及之后版本。
:::

## 统一属性模型

各引擎缓存 module 使用统一的配置键格式：

`meta.cache.<engine>.<module>.{enable,ttl-second,capacity}`

下表说明属性语义：

| 属性 | 示例 | 含义 |
|---|---|---|
| `enable` | `true/false` | 是否启用该缓存 module。 |
| `ttl-second` | `600`、`0`、`-1` | `0` 表示关闭；`-1` 表示永不过期；其他值表示按访问时间计算 TTL。 |
| `capacity` | `10000` | 最大缓存条目数（按条目数量计）。`0` 表示关闭。 |

示例（修改 catalog properties）：

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## 外表 Meta Cache 覆盖范围

外表元数据缓存覆盖多种元数据类型。其中一部分由统一 `meta.cache.*` 键配置，另一部分由 FE 配置控制：

| 类别 | 示例 | 配置方式 |
|---|---|---|
| 引擎 module 缓存 | Hive 分区/文件、Iceberg manifest、Paimon 表元数据等 | Catalog `PROPERTIES`：`meta.cache.<engine>.<module>.*` |
| Schema cache | 表 schema（按版本 token 隔离） | FE 配置（例如：`max_external_schema_cache_num`） |

## 各类 Catalog 的配置入口（链接）

不同 Catalog 引擎支持的缓存 module 不同，具体 module、推荐配置与可观测性请参考对应 Catalog 文档：

| Catalog 引擎 | module 缓存配置与可观测性 |
|---|---|
| Hive | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-404) |
| Iceberg | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-404) |
| Paimon | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-404) |
| Hudi | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-404) |
| MaxCompute | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-404) |

## 观测方式

通过系统表统一观测缓存指标：

```sql
SELECT *
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, cache_name, metric_name;
```

该系统表文档见：[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)。

约定与常见指标：

| 内容 | 说明 |
|---|---|
| `cache_name` | `<engine>_<module>_cache`（module 中的 `-` 会被替换为 `_`） |
| 常见指标 | `hit_ratio`、`hit_count`、`read_count`、`eviction_count`、`average_load_penalty`、`estimated_size` |

## 旧参数迁移说明

从 Doris 4.0.4 开始，旧版 catalog cache 参数（例如 `schema.cache.ttl-second`、`file.meta.cache.ttl-second`）已不再推荐使用。请改用 `meta.cache.*` 统一键，并参考上文对应的 catalog 文档。
