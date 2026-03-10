---
{
    "title": "Unified External Meta Cache (4.1.x+)",
    "language": "en",
    "description": "User guide for unified external metadata cache: unified meta.cache.* properties, what is cached, and where to configure per catalog."
}
---

Starting from **Doris 4.1.x**, external metadata caching is unified for major External Catalog engines. As a user, you only need to know:

| You want to know | Where in docs |
|---|---|
| Where to configure | Catalog `PROPERTIES` with `meta.cache.*` keys (see the catalog pages linked below). |
| What it affects | Depends on catalog engine (partitions, file listing, table metadata, manifests, etc.). |
| How to observe | `information_schema.catalog_meta_cache_statistics` (see the observability section below). |

:::tip
Applies to Doris 4.1.x and later.
:::

## Unified Property Model

All engine cache entries share the same property key pattern:

`meta.cache.<engine>.<module>.{enable,ttl-second,capacity}`

The following table describes the property semantics:

| Property | Example | Meaning |
|---|---|---|
| `enable` | `true/false` | Whether this cache module is enabled. |
| `ttl-second` | `600`, `0`, `-1` | `0` disables the module; `-1` means no expiration; otherwise expire after access by TTL. |
| `capacity` | `10000` | Max entry count (count-based). `0` disables the module. |

Notes:

- `<module>` uses the cache entry name shown in the catalog documentation and the stats table, for example `partition_values`, `fs_view`, `meta_client`.
- There is currently no per-entry refresh interval property. Async refresh behavior still uses the FE config `external_cache_refresh_time_minutes`.

Example:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## What External Meta Cache Includes

There are two layers of metadata caching that are easy to confuse:

- Catalog object/name caches: `SHOW DATABASES`, `SHOW TABLES`, database objects, table objects, and related generic caches described in [Metadata Cache](../meta-cache.md).
- Engine entry caches: engine-specific runtime metadata such as Hive partitions/files, Iceberg manifests, Paimon table handles, and schema entries. This page focuses on this layer.

External meta cache entries cover different kinds of metadata. Some are configured by unified catalog properties, and some also inherit FE-level defaults:

| Category | Examples | How to configure |
|---|---|---|
| Engine entry caches | Hive `partition_values` / `partition` / `file`, Iceberg `manifest`, Paimon `table`, etc. | Catalog `PROPERTIES`: `meta.cache.<engine>.<module>.*` |
| Schema cache | Per-engine `schema` entry, isolated by schema version token | FE configs provide defaults; catalog `meta.cache.<engine>.schema.*` can override them |

## Support Matrix

The following table summarizes the current implementation:

| Engine | Entries you will see in stats | Property key prefix | `ALTER CATALOG ... SET PROPERTIES` hot-reload |
|---|---|---|---|
| Hive | `schema`, `partition_values`, `partition`, `file` | `meta.cache.hive.<entry>.*` | Changes to `meta.cache.hive.*` are not applied through the unified hot-reload path; recreate the catalog or restart FE to apply new specs |
| Iceberg | `schema`, `table`, `view`, `manifest` | `meta.cache.iceberg.<entry>.*` | Supported |
| Paimon | `schema`, `table` | `meta.cache.paimon.<entry>.*` | Supported |
| Hudi | `schema`, `partition`, `fs_view`, `meta_client` | `meta.cache.hudi.<entry>.*` | Supported through HMS catalog property updates |
| MaxCompute | `schema`, `partition_values` | `meta.cache.maxcompute.<entry>.*` | No dedicated hot-reload hook |

## Catalog-Specific Configuration (Links)

For each catalog engine, the supported cache modules and the recommended properties are documented in its catalog page:

| Catalog engine | Where to configure module caches |
|---|---|
| Hive | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-unified) |
| Iceberg | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-unified) |
| Paimon | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-unified) |
| Hudi | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-unified) |
| MaxCompute | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-unified) |

## Observability

Use the system table to observe cache metrics:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, engine_name, entry_name;
```

This table is documented at: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

Read the table as follows:

| Field | Convention |
|---|---|
| `ENGINE_NAME` | Cache engine, such as `hive` or `iceberg` |
| `ENTRY_NAME` | Exact entry name used by that engine, such as `partition_values`, `fs_view`, `manifest` |
| `EFFECTIVE_ENABLED` | Final enable state after evaluating `enable`, `ttl-second`, and `capacity` |

Common queries filter by `catalog_name` and `engine_name`. This table no longer uses the old `cache_name` / `metric_name` pivoted model.

## Migration Note (Legacy Properties)

Starting from Doris 4.1.x, legacy catalog cache properties (for example, `schema.cache.ttl-second`, `file.meta.cache.ttl-second`) are deprecated. Use `meta.cache.*` properties instead and follow the catalog-specific pages above.
